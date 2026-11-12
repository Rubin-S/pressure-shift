import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoomManager } from '../game/room-manager.js';
import { GameRoom } from '../game/room.js';
import { ServerPlayer } from '../types.js';

describe('Authoritative Win Conditions Unit Tests', () => {
  let roomManager: RoomManager;
  let room: GameRoom;
  let disruptor: ServerPlayer;
  let ops: ServerPlayer[];

  beforeEach(() => {
    roomManager = new RoomManager();
    const created = roomManager.createRoom({ playerName: 'P1', socketId: 's1' });
    room = created.room;
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P2', socketId: 's2' });
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P3', socketId: 's3' });
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P4', socketId: 's4' });

    for (const p of room.getAllPlayersList()) room.setPlayerReady(p.id, true);

    room.startMatch({
      numDisruptors: 1,
      operatorTaskCount: 2,
      discussionTime: 5,
      votingTime: 10,
    });

    disruptor = room.getAllPlayersList().find((p) => p.role === 'DISRUPTOR')!;
    ops = room.getAllPlayersList().filter((p) => p.role === 'OPERATOR');
  });

  afterEach(() => {
    room.destroy();
  });

  it('Win Condition 1: All Disruptors ejected -> Operators Win', () => {
    // Call meeting and vote out the disruptor
    room.handleCallEmergencyMeeting(ops[0].id);
    room.tick(6); // To voting phase

    for (const op of ops) {
      room.handleCastVote(op.id, disruptor.id);
    }
    room.handleSkipVote(disruptor.id);

    room.tick(11); // Resolve voting

    expect(room.state).toBe('GAME_OVER');
    expect(room.gameOverSummary?.winner).toBe('OPERATORS');
    expect(room.gameOverSummary?.reason).toBe('ALL_DISRUPTORS_EJECTED');
  });

  it('Win Condition 2: All tasks completed -> Operators Win', () => {
    // 3 operators * 2 tasks = 6 tasks
    for (const op of ops) {
      for (const task of op.tasks) {
        op.position = { x: task.location.x, y: task.location.y };
        room.handleTaskComplete(op.id, task.id);
      }
    }

    expect(room.taskMeter.completedTasks).toBe(room.taskMeter.totalTasks);
    expect(room.taskMeter.progressPercent).toBe(100);

    expect(room.state).toBe('GAME_OVER');
    expect(room.gameOverSummary?.winner).toBe('OPERATORS');
    expect(room.gameOverSummary?.reason).toBe('TASKS_COMPLETED');
  });

  it('Win Condition 3: Disruptor count >= Operator count -> Disruptors Win', () => {
    // Initial: 1 Disruptor, 3 Operators
    // Kill Operator 1 -> 1 Disruptor, 2 Operators
    disruptor.killCooldownRemaining = 0;
    disruptor.position = { x: 300, y: 300 };
    ops[0].position = { x: 320, y: 300 };
    room.handleKillAttempt(disruptor.id, ops[0].id);
    expect(room.state).toBe('PLAYING');

    // Kill Operator 2 -> 1 Disruptor, 1 Operator (Equal!) -> Disruptors Win
    disruptor.killCooldownRemaining = 0;
    ops[1].position = { x: 320, y: 300 };
    room.handleKillAttempt(disruptor.id, ops[1].id);

    expect(room.state).toBe('GAME_OVER');
    expect(room.gameOverSummary?.winner).toBe('DISRUPTORS');
    expect(room.gameOverSummary?.reason).toBe('DISRUPTORS_EQUAL_OR_OUTNUMBER');
  });

  it('Win Condition 4: Critical emergency countdown reaches 0 -> Disruptors Win', () => {
    disruptor.sabotageCooldownRemaining = 0;
    const trig = room.handleTriggerSabotage(disruptor.id, 'reactor_meltdown');
    expect(trig.success).toBe(true);

    // Fast-forward past 45-second critical reactor meltdown
    room.tick(46.0);

    expect(room.state).toBe('GAME_OVER');
    expect(room.gameOverSummary?.winner).toBe('DISRUPTORS');
    expect(room.gameOverSummary?.reason).toBe('CRITICAL_SABOTAGE_COLLAPSE');
  });
});
