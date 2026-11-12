import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoomManager } from '../game/room-manager.js';
import { GameRoom } from '../game/room.js';
import { ServerPlayer } from '../types.js';
import { FACILITY_ROOMS } from '@pressure-shift/shared';

describe('Authoritative Meetings & Voting Unit Tests', () => {
  let roomManager: RoomManager;
  let room: GameRoom;
  let players: ServerPlayer[];
  let disruptor: ServerPlayer;
  let operator1: ServerPlayer;
  let operator2: ServerPlayer;
  let operator3: ServerPlayer;

  beforeEach(() => {
    roomManager = new RoomManager();
    const created = roomManager.createRoom({ playerName: 'P1', socketId: 's1' });
    room = created.room;
    const j2 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P2', socketId: 's2' });
    const j3 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P3', socketId: 's3' });
    const j4 = roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P4', socketId: 's4' });

    players = [created.player, j2.player!, j3.player!, j4.player!];
    for (const p of players) room.setPlayerReady(p.id, true);

    room.startMatch({
      numDisruptors: 1,
      discussionTime: 10,
      votingTime: 20,
      emergencyMeetingLimit: 1,
      confirmEjects: true,
    });

    disruptor = room.getAllPlayersList().find((p) => p.role === 'DISRUPTOR')!;
    const ops = room.getAllPlayersList().filter((p) => p.role === 'OPERATOR');
    operator1 = ops[0];
    operator2 = ops[1];
    operator3 = ops[2];
  });

  afterEach(() => {
    room.destroy();
  });

  describe('Emergency Meeting Triggers', () => {
    it('allows emergency button call from console location in Central Junction', () => {
      operator1.position = { ...FACILITY_ROOMS.central_junction.emergencyConsole! };
      const res = room.handleCallEmergencyMeeting(operator1.id);

      expect(res.success).toBe(true);
      expect(room.state).toBe('MEETING');
      expect(operator1.emergencyMeetingsRemaining).toBe(0);

      const meeting = room.meetingManager.getCurrentMeeting();
      expect(meeting).toBeDefined();
      expect(meeting?.triggerType).toBe('EMERGENCY_BUTTON');
      expect(meeting?.callerId).toBe(operator1.id);
    });

    it('rejects emergency button call when player is too far from console', () => {
      operator1.position = { x: 100, y: 100 }; // Docking Cradle
      const res = room.handleCallEmergencyMeeting(operator1.id);

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/too far/i);
      expect(room.state).toBe('PLAYING');
    });

    it('rejects emergency button call when player has exhausted meetings', () => {
      operator1.emergencyMeetingsRemaining = 0;
      operator1.position = { ...FACILITY_ROOMS.central_junction.emergencyConsole! };
      const res = room.handleCallEmergencyMeeting(operator1.id);

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no emergency meetings remaining/i);
    });

    it('rejects emergency button call during active critical sabotage crisis', () => {
      disruptor.sabotageCooldownRemaining = 0;
      room.handleTriggerSabotage(disruptor.id, 'oxygen_depletion');

      operator1.position = { ...FACILITY_ROOMS.central_junction.emergencyConsole! };
      const res = room.handleCallEmergencyMeeting(operator1.id);

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/offline during critical crisis/i);
    });
  });

  describe('Dead Body Reporting', () => {
    it('allows reporting dead body within proximity', () => {
      // Execute a kill to generate a dead body
      disruptor.killCooldownRemaining = 0;
      disruptor.position = { x: 350, y: 300 };
      operator3.position = { x: 360, y: 300 };
      room.handleKillAttempt(disruptor.id, operator3.id);
      expect(room.deadBodies).toHaveLength(1);

      // Operator1 reports the body
      operator1.position = { x: 370, y: 300 };
      const reportRes = room.handleReportBody(operator1.id, operator3.id);

      expect(reportRes.success).toBe(true);
      expect(room.state).toBe('MEETING');

      const meeting = room.meetingManager.getCurrentMeeting();
      expect(meeting?.triggerType).toBe('BODY_REPORTED');
      expect(meeting?.callerId).toBe(operator1.id);
      expect(meeting?.reportedVictimId).toBe(operator3.id);

      // Bodies should be cleaned up on meeting start
      expect(room.deadBodies).toHaveLength(0);
    });
  });

  describe('Phases & Voting Calculations', () => {
    beforeEach(() => {
      operator1.position = { ...FACILITY_ROOMS.central_junction.emergencyConsole! };
      room.handleCallEmergencyMeeting(operator1.id);
    });

    it('prevents voting during DISCUSSION phase', () => {
      expect(room.meetingManager.getCurrentMeeting()?.phase).toBe('DISCUSSION');
      const voteRes = room.handleCastVote(operator1.id, disruptor.id);
      expect(voteRes.success).toBe(false);
      expect(voteRes.error).toMatch(/cannot vote during meeting discussion/i);
    });

    it('allows voting once DISCUSSION timer expires and VOTING phase starts', () => {
      // Advance past 10s discussion time
      room.tick(11);
      expect(room.meetingManager.getCurrentMeeting()?.phase).toBe('VOTING');

      const voteRes = room.handleCastVote(operator1.id, disruptor.id);
      expect(voteRes.success).toBe(true);

      // Rejects double vote
      const doubleVote = room.handleCastVote(operator1.id, disruptor.id);
      expect(doubleVote.success).toBe(false);
      expect(doubleVote.error).toMatch(/already cast a vote/i);
    });

    it('ejects majority target when voting resolves and reveals role with confirmEjects', () => {
      room.tick(11); // Enter VOTING

      room.handleCastVote(operator1.id, operator3.id);
      room.handleCastVote(operator2.id, operator3.id);
      room.handleCastVote(disruptor.id, operator3.id);
      room.handleSkipVote(operator3.id);

      // Advance past voting time (20s)
      room.tick(21);

      expect(room.state).toBe('VOTING_RESULTS');
      const result = room.meetingManager.getLastMeetingResult();
      expect(result?.ejectedPlayerId).toBe(operator3.id);
      expect(result?.wasDisruptor).toBe(false);
      expect(result?.ejectedPlayerRole).toBe('OPERATOR');
      expect(operator3.isAlive).toBe(false);
    });

    it('skips ejection on tie vote', () => {
      room.tick(11); // Enter VOTING

      room.handleCastVote(operator1.id, disruptor.id);
      room.handleCastVote(operator2.id, disruptor.id);
      room.handleCastVote(operator3.id, operator1.id);
      room.handleCastVote(disruptor.id, operator1.id);

      room.tick(21);

      const result = room.meetingManager.getLastMeetingResult();
      expect(result?.ejectedPlayerId).toBeNull();
      expect(result?.isTie).toBe(true);
    });

    it('skips ejection when skip has the most votes', () => {
      room.tick(11);

      room.handleSkipVote(operator1.id);
      room.handleSkipVote(operator2.id);
      room.handleSkipVote(operator3.id);
      room.handleCastVote(disruptor.id, operator1.id);

      room.tick(21);

      const result = room.meetingManager.getLastMeetingResult();
      expect(result?.ejectedPlayerId).toBeNull();
      expect(result?.isSkip).toBe(true);
    });
  });
});
