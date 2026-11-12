import { describe, it, expect } from 'vitest';
import {
  RoomCreateSchema,
  RoomJoinSchema,
  PlayerMoveSchema,
  TaskInteractSchema,
  TaskCompleteSchema,
  SabotageTriggerSchema,
  SabotageRepairSchema,
  KillAttemptSchema,
  ReportBodySchema,
  MeetingCallSchema,
  VoteCastSchema,
  VoteSkipSchema,
  ChatMessageSchema,
  safeValidate,
  distance2D,
  isWithinRadius,
  clamp,
  calculateAngleDeg,
  validateSpeedDelta,
  canTransition,
  checkWinCondition,
  tallyVotes,
  generateRoomCode,
  sanitizePlayerForClient,
  sanitizePlayerRosterForClient,
  DEFAULT_ROOM_SETTINGS,
  GAMEPLAY_CONSTANTS,
  PROTOCOL_VERSION,
} from '@pressure-shift/shared';

describe('Shared Contracts & Schemas Verification', () => {
  describe('Protocol Version', () => {
    it('should export the expected protocol version', () => {
      expect(PROTOCOL_VERSION).toBe('1.0.0');
    });
  });

  describe('Room Creation & Join Schemas', () => {
    it('validates correct RoomCreateSchema payloads', () => {
      const valid = {
        playerName: 'CaptainNadir',
        cosmetic: 'standard_helm',
        color: 'neon_cyan',
        roomSettings: {
          numDisruptors: 2,
          killCooldown: 30,
        },
      };
      const res = safeValidate(RoomCreateSchema, valid);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.playerName).toBe('CaptainNadir');
        expect(res.data.roomSettings?.numDisruptors).toBe(2);
      }
    });

    it('rejects invalid player names in RoomCreateSchema', () => {
      const emptyName = safeValidate(RoomCreateSchema, { playerName: '' });
      expect(emptyName.success).toBe(false);

      const tooLongName = safeValidate(RoomCreateSchema, { playerName: 'A'.repeat(25) });
      expect(tooLongName.success).toBe(false);

      const invalidChars = safeValidate(RoomCreateSchema, { playerName: '<script>alert(1)</script>' });
      expect(invalidChars.success).toBe(false);
    });

    it('validates RoomJoinSchema with valid 6-char alphanumeric room code', () => {
      const valid = {
        roomCode: 'AB12CD',
        playerName: 'Diver1',
      };
      const res = safeValidate(RoomJoinSchema, valid);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.roomCode).toBe('AB12CD');
      }
    });

    it('rejects malformed room codes in RoomJoinSchema', () => {
      // Lowercase should be auto-trimmed/normalized or rejected if strictly uppercase
      const tooShort = safeValidate(RoomJoinSchema, { roomCode: 'ABC', playerName: 'Diver' });
      expect(tooShort.success).toBe(false);

      const tooLong = safeValidate(RoomJoinSchema, { roomCode: 'ABCDEFG', playerName: 'Diver' });
      expect(tooLong.success).toBe(false);

      const specialChars = safeValidate(RoomJoinSchema, { roomCode: 'AB#$12', playerName: 'Diver' });
      expect(specialChars.success).toBe(false);
    });
  });

  describe('Movement & Action Schemas', () => {
    it('validates PlayerMoveSchema with valid coordinates', () => {
      const validMove = {
        x: 450.5,
        y: 320.1,
        vx: 120,
        vy: -50,
        facing: 'left' as const,
        sequenceNumber: 42,
        timestamp: Date.now(),
      };
      const res = safeValidate(PlayerMoveSchema, validMove);
      expect(res.success).toBe(true);
    });

    it('rejects non-finite coordinates in PlayerMoveSchema (Anti-Cheat)', () => {
      const nanMove = {
        x: NaN,
        y: 100,
        timestamp: Date.now(),
      };
      expect(safeValidate(PlayerMoveSchema, nanMove).success).toBe(false);

      const infMove = {
        x: 100,
        y: Infinity,
        timestamp: Date.now(),
      };
      expect(safeValidate(PlayerMoveSchema, infMove).success).toBe(false);

      const negativeTimestamp = {
        x: 100,
        y: 200,
        timestamp: -1,
      };
      expect(safeValidate(PlayerMoveSchema, negativeTimestamp).success).toBe(false);
    });

    it('validates TaskInteractSchema and TaskCompleteSchema', () => {
      expect(safeValidate(TaskInteractSchema, { taskId: 'task-sonar-1', action: 'start' }).success).toBe(true);
      expect(safeValidate(TaskInteractSchema, { taskId: 'task-sonar-1', action: 'cancel' }).success).toBe(true);
      expect(safeValidate(TaskInteractSchema, { taskId: 'task-sonar-1', action: 'invalid' }).success).toBe(false);

      expect(safeValidate(TaskCompleteSchema, { taskId: 'task-sonar-1' }).success).toBe(true);
      expect(safeValidate(TaskCompleteSchema, { taskId: '' }).success).toBe(false);
    });

    it('validates SabotageTriggerSchema and SabotageRepairSchema', () => {
      const validSabotage = safeValidate(SabotageTriggerSchema, {
        sabotageType: 'oxygen_depletion',
        targetRoom: 'pressure_lab',
      });
      expect(validSabotage.success).toBe(true);

      const invalidType = safeValidate(SabotageTriggerSchema, {
        sabotageType: 'alien_invasion',
      });
      expect(invalidType.success).toBe(false);

      const validRepair = safeValidate(SabotageRepairSchema, {
        sabotageType: 'oxygen_depletion',
        stationId: 'station-oxygen-1',
      });
      expect(validRepair.success).toBe(true);
    });

    it('validates KillAttemptSchema and ReportBodySchema', () => {
      expect(safeValidate(KillAttemptSchema, { targetPlayerId: 'p-target-123' }).success).toBe(true);
      expect(safeValidate(KillAttemptSchema, { targetPlayerId: '' }).success).toBe(false);

      expect(safeValidate(ReportBodySchema, { victimPlayerId: 'p-victim-456' }).success).toBe(true);
      expect(safeValidate(ReportBodySchema, { victimPlayerId: '' }).success).toBe(false);
    });

    it('validates VoteCastSchema, VoteSkipSchema, and ChatMessageSchema', () => {
      expect(safeValidate(VoteCastSchema, { votedPlayerId: 'p-suspect-789' }).success).toBe(true);
      expect(safeValidate(VoteCastSchema, { votedPlayerId: '' }).success).toBe(false);

      expect(safeValidate(VoteSkipSchema, {}).success).toBe(true);

      expect(safeValidate(ChatMessageSchema, { text: 'I saw cyan vent in hydroponics!' }).success).toBe(true);
      expect(safeValidate(ChatMessageSchema, { text: '' }).success).toBe(false);
      expect(safeValidate(ChatMessageSchema, { text: 'x'.repeat(201) }).success).toBe(false);
    });
  });

  describe('Math & Speed Anti-Cheat Utilities', () => {
    it('calculates Euclidean distance accurately', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 300, y: 400 };
      expect(distance2D(p1, p2)).toBe(500);
      expect(isWithinRadius(p1, p2, 500)).toBe(true);
      expect(isWithinRadius(p1, p2, 499)).toBe(false);
    });

    it('clamps values correctly', () => {
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(-50, 0, 100)).toBe(0);
      expect(clamp(42, 0, 100)).toBe(42);
    });

    it('calculates angles in 0-360 range', () => {
      const from = { x: 100, y: 100 };
      // directly north (dy = -100) -> atan2(-100, 0) = -90 -> -90 + 90 = 0 deg
      expect(calculateAngleDeg(from, { x: 100, y: 0 })).toBe(0);
      // directly east (dx = 100) -> atan2(0, 100) = 0 -> 0 + 90 = 90 deg
      expect(calculateAngleDeg(from, { x: 200, y: 100 })).toBe(90);
    });

    it('validates speed deltas and rejects speed hacking', () => {
      const p1 = { x: 100, y: 100 };
      // Max speed: 200 px/sec. In 500ms (0.5s), normal distance is 100px. With 1.35x tolerance = 135px.
      const legitimateP2 = { x: 200, y: 100 }; // 100px in 500ms -> 200 px/sec
      expect(validateSpeedDelta(p1, legitimateP2, 500, 200)).toBe(true);

      const hackedP2 = { x: 400, y: 100 }; // 300px in 500ms -> 600 px/sec (speed hack!)
      expect(validateSpeedDelta(p1, hackedP2, 500, 200)).toBe(false);

      // Rejects non-positive deltaTime
      expect(validateSpeedDelta(p1, legitimateP2, 0, 200)).toBe(false);
      expect(validateSpeedDelta(p1, legitimateP2, -100, 200)).toBe(false);
    });
  });

  describe('State Machine & Voting Utilities', () => {
    it('validates legal room state transitions', () => {
      expect(canTransition('LOBBY', 'STARTING')).toBe(true);
      expect(canTransition('STARTING', 'PLAYING')).toBe(true);
      expect(canTransition('PLAYING', 'MEETING')).toBe(true);
      expect(canTransition('MEETING', 'VOTING_RESULTS')).toBe(true);
      expect(canTransition('VOTING_RESULTS', 'PLAYING')).toBe(true);
      expect(canTransition('VOTING_RESULTS', 'GAME_OVER')).toBe(true);
      expect(canTransition('GAME_OVER', 'LOBBY')).toBe(true);

      // Illegal transitions
      expect(canTransition('LOBBY', 'PLAYING')).toBe(false);
      expect(canTransition('LOBBY', 'VOTING_RESULTS')).toBe(false);
      expect(canTransition('PLAYING', 'STARTING')).toBe(false);
    });

    it('accurately tallies meeting votes for a clear majority ejection', () => {
      const votes: Record<string, string | 'SKIP'> = {
        player1: 'suspectA',
        player2: 'suspectA',
        player3: 'suspectB',
        player4: 'SKIP',
      };
      const result = tallyVotes(votes);
      expect(result.ejectedPlayerId).toBe('suspectA');
      expect(result.isTie).toBe(false);
      expect(result.isSkip).toBe(false);
      expect(result.voteCounts['suspectA']).toBe(2);
      expect(result.voteCounts['suspectB']).toBe(1);
      expect(result.voteCounts['SKIP']).toBe(1);
    });

    it('accurately handles tie votes without ejecting anyone', () => {
      const votes: Record<string, string | 'SKIP'> = {
        player1: 'suspectA',
        player2: 'suspectA',
        player3: 'suspectB',
        player4: 'suspectB',
      };
      const result = tallyVotes(votes);
      expect(result.ejectedPlayerId).toBeNull();
      expect(result.isTie).toBe(true);
    });

    it('accurately handles majority skip votes without ejecting anyone', () => {
      const votes: Record<string, string | 'SKIP'> = {
        player1: 'SKIP',
        player2: 'SKIP',
        player3: 'suspectA',
        player4: 'suspectB',
      };
      const result = tallyVotes(votes);
      expect(result.ejectedPlayerId).toBeNull();
      expect(result.isSkip).toBe(true);
    });

    it('evaluates win conditions: All Disruptors Ejected', () => {
      const players = [
        { id: 'p1', name: 'Op1', role: 'OPERATOR' as const, isAlive: true },
        { id: 'p2', name: 'Op2', role: 'OPERATOR' as const, isAlive: true },
        { id: 'p3', name: 'Op3', role: 'OPERATOR' as const, isAlive: true },
        { id: 'd1', name: 'Disruptor1', role: 'DISRUPTOR' as const, isAlive: false },
      ];
      const win = checkWinCondition({
        players,
        completedTasks: 5,
        totalTasks: 10,
        criticalSabotageExpired: false,
      });
      expect(win).not.toBeNull();
      expect(win?.winner).toBe('OPERATORS');
      expect(win?.reason).toBe('ALL_DISRUPTORS_EJECTED');
    });

    it('evaluates win conditions: All Tasks Completed', () => {
      const players = [
        { id: 'p1', name: 'Op1', role: 'OPERATOR' as const, isAlive: true },
        { id: 'p2', name: 'Op2', role: 'OPERATOR' as const, isAlive: true },
        { id: 'd1', name: 'Disruptor1', role: 'DISRUPTOR' as const, isAlive: true },
      ];
      const win = checkWinCondition({
        players,
        completedTasks: 10,
        totalTasks: 10,
        criticalSabotageExpired: false,
      });
      expect(win).not.toBeNull();
      expect(win?.winner).toBe('OPERATORS');
      expect(win?.reason).toBe('TASKS_COMPLETED');
    });

    it('evaluates win conditions: Disruptor Parity (Disruptors >= Operators)', () => {
      const players = [
        { id: 'p1', name: 'Op1', role: 'OPERATOR' as const, isAlive: true },
        { id: 'd1', name: 'Disruptor1', role: 'DISRUPTOR' as const, isAlive: true },
      ];
      const win = checkWinCondition({
        players,
        completedTasks: 3,
        totalTasks: 10,
        criticalSabotageExpired: false,
      });
      expect(win).not.toBeNull();
      expect(win?.winner).toBe('DISRUPTORS');
      expect(win?.reason).toBe('DISRUPTORS_EQUAL_OR_OUTNUMBER');
    });

    it('evaluates win conditions: Critical Sabotage Collapse', () => {
      const players = [
        { id: 'p1', name: 'Op1', role: 'OPERATOR' as const, isAlive: true },
        { id: 'p2', name: 'Op2', role: 'OPERATOR' as const, isAlive: true },
        { id: 'd1', name: 'Disruptor1', role: 'DISRUPTOR' as const, isAlive: true },
      ];
      const win = checkWinCondition({
        players,
        completedTasks: 3,
        totalTasks: 10,
        criticalSabotageExpired: true,
      });
      expect(win).not.toBeNull();
      expect(win?.winner).toBe('DISRUPTORS');
      expect(win?.reason).toBe('CRITICAL_SABOTAGE_COLLAPSE');
    });

    it('generates 6-character room codes without confusing characters', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateRoomCode();
        expect(code).toHaveLength(6);
        expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
        expect(code).not.toMatch(/[0OI1]/); // Excludes ambiguous characters
      }
    });
  });
});
