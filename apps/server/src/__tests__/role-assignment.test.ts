import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoomManager } from '../game/room-manager.js';
import { GameRoom } from '../game/room.js';

describe('Role Assignment & Anti-Cheat Sanitization Unit Tests', () => {
  let roomManager: RoomManager;
  let room: GameRoom;

  beforeEach(() => {
    roomManager = new RoomManager();
    const created = roomManager.createRoom({ playerName: 'Alice', socketId: 's1' });
    room = created.room;
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Bob', socketId: 's2' });
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Charlie', socketId: 's3' });
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Dave', socketId: 's4' });
  });

  afterEach(() => {
    room.destroy();
  });

  it('rejects match start if player count is below minimum required', () => {
    const solo = roomManager.createRoom({ playerName: 'Solo', socketId: 'solo' });
    const res = solo.room.startMatch();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/insufficient players/i);
    solo.room.destroy();
  });

  it('randomly assigns configured number of Disruptors when starting', () => {
    const startRes = room.startMatch({ numDisruptors: 1 });
    expect(startRes.success).toBe(true);
    expect(room.state).toBe('PLAYING');

    const players = room.getAllPlayersList();
    const disruptors = players.filter((p) => p.role === 'DISRUPTOR');
    const operators = players.filter((p) => p.role === 'OPERATOR');

    expect(disruptors).toHaveLength(1);
    expect(operators).toHaveLength(3);
  });

  it('assigns tasks to all Operators and initializes task meter correctly', () => {
    room.startMatch({ numDisruptors: 1, operatorTaskCount: 4 });

    const operators = room.getAllPlayersList().filter((p) => p.role === 'OPERATOR');
    for (const op of operators) {
      expect(op.tasks).toHaveLength(4);
      expect(op.assignedTasks).toHaveLength(4);
    }

    expect(room.taskMeter.totalTasks).toBe(3 * 4);
    expect(room.taskMeter.completedTasks).toBe(0);
    expect(room.taskMeter.progressPercent).toBe(0);
  });

  it('CRITICAL: Sanitizes state so Operators NEVER see other players roles', () => {
    room.startMatch({ numDisruptors: 1 });

    const operator = room.getAllPlayersList().find((p) => p.role === 'OPERATOR')!;
    const sanitized = room.getSanitizedStateForPlayer(operator.id);

    // Self view has role
    const selfView = sanitized.players.find((p) => p.id === operator.id);
    expect(selfView?.role).toBe('OPERATOR');

    // Every other player view MUST NOT have role defined
    const others = sanitized.players.filter((p) => p.id !== operator.id);
    expect(others.length).toBe(3);
    for (const other of others) {
      expect(other.role).toBeUndefined();
    }
  });

  it('allows Disruptors to see peer Disruptors', () => {
    // Add two more players to have 6 total players and 2 Disruptors
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Eve', socketId: 's5' });
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Frank', socketId: 's6' });

    room.startMatch({ numDisruptors: 2 });

    const disruptors = room.getAllPlayersList().filter((p) => p.role === 'DISRUPTOR');
    expect(disruptors).toHaveLength(2);

    const d1 = disruptors[0];
    const d2 = disruptors[1];

    const d1View = room.getSanitizedStateForPlayer(d1.id);
    const d2InD1View = d1View.players.find((p) => p.id === d2.id);
    expect(d2InD1View?.role).toBe('DISRUPTOR');

    const privateD1 = room.getPrivateViewForPlayer(d1.id);
    expect(privateD1?.disruptorPeers).toContain(d2.id);
  });

  it('reveals all roles when match transitions to GAME_OVER', () => {
    room.startMatch({ numDisruptors: 1 });
    const op = room.getAllPlayersList().find((p) => p.role === 'OPERATOR')!;

    room.triggerGameOver('OPERATORS', 'ALL_DISRUPTORS_EJECTED');
    expect(room.state).toBe('GAME_OVER');

    const gameOverView = room.getSanitizedStateForPlayer(op.id);
    for (const p of gameOverView.players) {
      expect(p.role).toBeDefined();
    }
  });
});
