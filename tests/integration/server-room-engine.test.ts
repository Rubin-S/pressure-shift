import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../../apps/server/src/game/room-manager.js';
import { GameRoom } from '../../apps/server/src/game/room.js';
import { ServerPlayer } from '../../apps/server/src/types.js';
import {
  DEFAULT_ROOM_SETTINGS,
  FACILITY_ROOMS,
  PlayerRole,
} from '@pressure-shift/shared';

describe('Server Room Engine Authoritative Integration Tests', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('Room Lifecycle & Player Management', () => {
    it('creates a room with a host and default settings', () => {
      const { room, player: hostPlayer } = roomManager.createRoom({
        playerName: 'HostAlpha',
        color: 'neon_cyan',
        cosmetic: 'standard_helm',
        socketId: 'sock-host-1',
      });
      expect(room).toBeDefined();
      expect(room.roomCode).toHaveLength(6);
      expect(room.hostId).toBe(hostPlayer.id);
      expect(room.state).toBe('LOBBY');
      expect(hostPlayer.isHost).toBe(true);
      expect(hostPlayer.isReady).toBe(true);
    });

    it('allows players to join up to max capacity', () => {
      const { room } = roomManager.createRoom({ playerName: 'HostAlpha', socketId: 'sock-host-1' });
      const join1 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Diver2', socketId: 'sock-2' });
      const join2 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Diver3', socketId: 'sock-3' });
      const join3 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Diver4', socketId: 'sock-4' });

      expect(join1.success).toBe(true);
      expect(join2.success).toBe(true);
      expect(join3.success).toBe(true);
      expect(room.getAllPlayersList()).toHaveLength(4);
    });

    it('handles player reconnection within 30-second grace window', () => {
      const { room, player: hostPlayer, sessionToken } = roomManager.createRoom({
        playerName: 'HostAlpha',
        socketId: 'sock-host-1',
      });

      // Simulate disconnect
      roomManager.handleDisconnect(hostPlayer.socketId);
      expect(hostPlayer.connected).toBe(false);

      // Reconnect with same sessionToken
      const reconnect = roomManager.joinRoom({
        roomCode: room.roomCode,
        playerName: 'HostAlpha',
        sessionToken,
        socketId: 'new-sock-123',
      });
      expect(reconnect.success).toBe(true);
      expect(reconnect.isReconnect).toBe(true);
      expect(hostPlayer.connected).toBe(true);
      expect(hostPlayer.socketId).toBe('new-sock-123');
    });

    it('migrates host privilege when the current host leaves', () => {
      const { room, player: hostPlayer } = roomManager.createRoom({
        playerName: 'HostAlpha',
        socketId: 'sock-host-1',
      });
      const join2 = roomManager.joinRoom({
        roomCode: room.roomCode,
        playerName: 'Diver2',
        socketId: 'sock-2',
      });
      const p2 = join2.player!;

      expect(room.hostId).toBe(hostPlayer.id);

      // Remove host
      const res = room.removePlayer(hostPlayer.id);
      expect(res.newHostId).toBe(p2.id);
      expect(p2.isHost).toBe(true);
      expect(room.hostId).toBe(p2.id);
    });
  });

  describe('Match Start & Role Sanitization', () => {
    let room: GameRoom;
    let players: ServerPlayer[];

    beforeEach(() => {
      const created = roomManager.createRoom({ playerName: 'P1-Host', socketId: 'sock-1' });
      room = created.room;
      const j2 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P2', socketId: 'sock-2' });
      const j3 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P3', socketId: 'sock-3' });
      const j4 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P4', socketId: 'sock-4' });

      players = [created.player, j2.player!, j3.player!, j4.player!];

      // Mark all ready
      for (const p of players) {
        room.setPlayerReady(p.id, true);
      }
    });

    it('starts match with 1 Disruptor and 3 Operators', () => {
      const startResult = room.startMatch({ numDisruptors: 1 });
      expect(startResult.success).toBe(true);
      expect(room.state).toBe('PLAYING');

      const allPlayers = room.getAllPlayersList();
      const disruptors = allPlayers.filter((p) => p.role === 'DISRUPTOR');
      const operators = allPlayers.filter((p) => p.role === 'OPERATOR');

      expect(disruptors).toHaveLength(1);
      expect(operators).toHaveLength(3);
    });

    it('CRITICAL: Sanitizes state so Operators never receive other player roles', () => {
      room.startMatch({ numDisruptors: 1 });

      const operator = room.getAllPlayersList().find((p) => p.role === 'OPERATOR')!;
      const disruptor = room.getAllPlayersList().find((p) => p.role === 'DISRUPTOR')!;

      // Operator perspective
      const opView = room.getSanitizedStateForPlayer(operator.id);
      const otherPlayersInOpView = opView.players.filter((p) => p.id !== operator.id);

      for (const other of otherPlayersInOpView) {
        expect(other.role).toBeUndefined(); // MUST BE UNDEFINED
      }

      // Disruptor perspective
      const disView = room.getSanitizedStateForPlayer(disruptor.id);
      const selfInDisView = disView.players.find((p) => p.id === disruptor.id);
      expect(selfInDisView?.role).toBe('DISRUPTOR');
    });

    it('assigns 5 tasks to each Operator and initializes the task meter', () => {
      room.startMatch({ numDisruptors: 1, operatorTaskCount: 5 });

      const operators = room.getAllPlayersList().filter((p) => p.role === 'OPERATOR');
      for (const op of operators) {
        expect(op.assignedTasks).toHaveLength(5);
      }

      // 3 operators * 5 tasks = 15 total tasks
      expect(room.taskMeter.totalTasks).toBe(15);
      expect(room.taskMeter.completedTasks).toBe(0);
      expect(room.taskMeter.progressPercent).toBe(0);
    });
  });

  describe('Authoritative Task Progression', () => {
    let room: GameRoom;
    let operator: ServerPlayer;

    beforeEach(() => {
      const created = roomManager.createRoom({ playerName: 'P1', socketId: 'sock-1' });
      room = created.room;
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P2', socketId: 'sock-2' });
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P3', socketId: 'sock-3' });
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P4', socketId: 'sock-4' });

      for (const p of room.getAllPlayersList()) {
        room.setPlayerReady(p.id, true);
      }

      room.startMatch({ numDisruptors: 1, operatorTaskCount: 5 });

      operator = room.getAllPlayersList().find((p) => p.role === 'OPERATOR')!;
    });

    it('updates task progress when an operator completes a task near station', () => {
      const task = operator.assignedTasks[0];
      // Move operator to the task location
      operator.position = { x: task.location.x, y: task.location.y };

      const res = room.handleTaskComplete(operator.id, task.taskId);
      expect(res.success).toBe(true);
      expect(task.status).toBe('COMPLETED');
      expect(room.taskMeter.completedTasks).toBe(1);
      expect(room.taskMeter.progressPercent).toBeGreaterThan(0);
    });

    it('rejects task completion when operator is too far from station', () => {
      const task = operator.assignedTasks[0];
      // Place operator 500px away from the task station
      operator.position = { x: task.location.x + 500, y: task.location.y + 500 };

      const res = room.handleTaskComplete(operator.id, task.taskId);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/too far/i);
      expect(task.status).toBe('NOT_STARTED');
    });
  });

  describe('Authoritative Disruptor Sabotage & Critical Countdown', () => {
    let room: GameRoom;
    let disruptor: ServerPlayer;
    let operator: ServerPlayer;

    beforeEach(() => {
      const created = roomManager.createRoom({ playerName: 'P1', socketId: 'sock-1' });
      room = created.room;
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P2', socketId: 'sock-2' });
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P3', socketId: 'sock-3' });
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P4', socketId: 'sock-4' });

      for (const p of room.getAllPlayersList()) {
        room.setPlayerReady(p.id, true);
      }

      room.startMatch({ numDisruptors: 1 });

      disruptor = room.getAllPlayersList().find((p) => p.role === 'DISRUPTOR')!;
      operator = room.getAllPlayersList().find((p) => p.role === 'OPERATOR')!;
    });

    it('allows Disruptor to trigger oxygen depletion emergency', () => {
      room.sabotageManager.setSabotageCooldown(0);
      disruptor.sabotageCooldownRemaining = 0;
      const res = room.handleTriggerSabotage(disruptor.id, 'oxygen_depletion');

      expect(res.success).toBe(true);
      expect(room.sabotageManager.getActiveSabotage()).not.toBeNull();
      expect(room.sabotageManager.getActiveSabotage()?.type).toBe('oxygen_depletion');
    });

    it('rejects sabotage attempts from Operators', () => {
      const res = room.handleTriggerSabotage(operator.id, 'oxygen_depletion');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/only living disruptors/i);
    });

    it('causes Disruptor victory when critical sabotage expires after 45 seconds', () => {
      room.sabotageManager.setSabotageCooldown(0);
      disruptor.sabotageCooldownRemaining = 0;
      room.handleTriggerSabotage(disruptor.id, 'oxygen_depletion');

      // Fast forward past 45 seconds
      room.tick(46.0);

      expect(room.state).toBe('GAME_OVER');
      expect(room.gameOverSummary?.winner).toBe('DISRUPTORS');
      expect(room.gameOverSummary?.reason).toBe('CRITICAL_SABOTAGE_COLLAPSE');
    });
  });

  describe('Authoritative Kill & Proximity Logic', () => {
    let room: GameRoom;
    let disruptor: ServerPlayer;
    let victim: ServerPlayer;

    beforeEach(() => {
      const created = roomManager.createRoom({ playerName: 'P1', socketId: 'sock-1' });
      room = created.room;
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P2', socketId: 'sock-2' });
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P3', socketId: 'sock-3' });
      roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P4', socketId: 'sock-4' });

      for (const p of room.getAllPlayersList()) {
        room.setPlayerReady(p.id, true);
      }

      room.startMatch({ numDisruptors: 1 });

      disruptor = room.getAllPlayersList().find((p) => p.role === 'DISRUPTOR')!;
      victim = room.getAllPlayersList().find((p) => p.role === 'OPERATOR')!;
    });

    it('allows Disruptor to execute nearby Operator within 75px', () => {
      disruptor.killCooldownRemaining = 0;
      disruptor.position = { x: 350, y: 300 };
      victim.position = { x: 370, y: 300 }; // 20px distance

      const res = room.handleKillAttempt(disruptor.id, victim.id);
      expect(res.success).toBe(true);
      expect(victim.isAlive).toBe(false);
      expect(room.deadBodies).toHaveLength(1);
      expect(disruptor.killCooldownRemaining).toBeGreaterThan(0);
    });

    it('rejects kill attempt if target is too far (>75px)', () => {
      disruptor.killCooldownRemaining = 0;
      disruptor.position = { x: 100, y: 100 };
      victim.position = { x: 500, y: 500 }; // 565px distance

      const res = room.handleKillAttempt(disruptor.id, victim.id);
      expect(res.success).toBe(false);
      expect(victim.isAlive).toBe(true);
    });

    it('rejects kill attempt while kill cooldown is active', () => {
      disruptor.killCooldownRemaining = 15; // 15s remaining
      disruptor.position = { x: 350, y: 300 };
      victim.position = { x: 370, y: 300 };

      const res = room.handleKillAttempt(disruptor.id, victim.id);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/cooldown/i);
    });
  });

  describe('Authoritative Meetings & Majority Ejection', () => {
    let room: GameRoom;
    let players: ServerPlayer[];
    let disruptor: ServerPlayer;

    beforeEach(() => {
      const created = roomManager.createRoom({ playerName: 'P1', socketId: 'sock-1' });
      room = created.room;
      const j2 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P2', socketId: 'sock-2' });
      const j3 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P3', socketId: 'sock-3' });
      const j4 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P4', socketId: 'sock-4' });

      players = [created.player, j2.player!, j3.player!, j4.player!];
      for (const p of players) room.setPlayerReady(p.id, true);

      room.startMatch({ numDisruptors: 1, discussionTime: 10, votingTime: 20 });

      disruptor = room.getAllPlayersList().find((p) => p.role === 'DISRUPTOR')!;
    });

    it('calls emergency meeting, transitions to discussion, and tallies votes', () => {
      const livingOp = players.find((p) => p.role === 'OPERATOR')!;
      const res = room.handleCallEmergencyMeeting(livingOp.id);
      expect(res.success).toBe(true);
      expect(room.state).toBe('MEETING');

      // Fast forward past discussionTime (10s) into VOTING phase
      room.tick(11);
      expect(room.meetingManager.getCurrentMeeting()?.phase).toBe('VOTING');

      // All 3 operators vote for the disruptor
      const ops = players.filter((p) => p.role === 'OPERATOR');
      for (const op of ops) {
        room.handleCastVote(op.id, disruptor.id);
      }
      room.handleSkipVote(disruptor.id);

      // Fast forward past votingTime (20s)
      room.tick(21);

      // Meeting results evaluated: disruptor ejected!
      expect(disruptor.isAlive).toBe(false);
      // All disruptors ejected -> Operators win!
      expect(room.state).toBe('GAME_OVER');
      expect(room.gameOverSummary?.winner).toBe('OPERATORS');
      expect(room.gameOverSummary?.reason).toBe('ALL_DISRUPTORS_EJECTED');
    });
  });
});
