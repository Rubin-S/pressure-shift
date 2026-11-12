import { describe, it, expect } from 'vitest';
import {
  canTransition,
  generateRoomCode,
  safeValidate,
  RoomCreateSchema,
  RoomJoinSchema,
  RoomReadySchema,
  RoomStartSchema,
  DEFAULT_ROOM_SETTINGS,
  GAMEPLAY_CONSTANTS,
  RoomState,
} from '@pressure-shift/shared';

describe('Room Lifecycle & State Integration Tests', () => {
  describe('Room Code Generation & Validation', () => {
    it('generates unique 6-character room codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const code = generateRoomCode();
        expect(code).toHaveLength(6);
        expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
        codes.add(code);
      }
      // With 100 random codes, duplicates should be near zero
      expect(codes.size).toBeGreaterThanOrEqual(95);
    });

    it('rejects invalid room codes during join attempts', () => {
      // Note: roomCode schema applies .toUpperCase(), so lowercase valid 6-char strings are normalized.
      // Truly invalid codes: wrong lengths, symbols, spaces.
      const invalidCodes = ['', 'abc', 'toolong123', 'A B12C', '$$$$$$', 'AB!@CD'];
      for (const code of invalidCodes) {
        const res = safeValidate(RoomJoinSchema, {
          roomCode: code,
          playerName: 'Diver1',
        });
        expect(res.success).toBe(false);
      }
    });
  });

  describe('Lobby Player Capacity & Ready Flow', () => {
    it('enforces min players (4) to start game', () => {
      expect(GAMEPLAY_CONSTANTS.MIN_PLAYERS_TO_START).toBe(4);
      expect(GAMEPLAY_CONSTANTS.MAX_PLAYERS_PER_ROOM).toBe(10);
    });

    it('validates player ready toggle schema', () => {
      expect(safeValidate(RoomReadySchema, { ready: true }).success).toBe(true);
      expect(safeValidate(RoomReadySchema, { ready: false }).success).toBe(true);
      expect(safeValidate(RoomReadySchema, { ready: 'yes' }).success).toBe(false);
    });

    it('validates host start game payload with optional custom settings', () => {
      const validStart = safeValidate(RoomStartSchema, {
        settings: {
          numDisruptors: 2,
          killCooldown: 30,
          discussionTime: 20,
          votingTime: 45,
        },
      });
      expect(validStart.success).toBe(true);
    });
  });

  describe('Full State Machine Transitions', () => {
    it('follows valid room lifecycle: LOBBY -> STARTING -> PLAYING -> MEETING -> VOTING_RESULTS -> PLAYING -> GAME_OVER -> LOBBY', () => {
      let currentState: RoomState = 'LOBBY';

      const nextTransitions: RoomState[] = [
        'STARTING',
        'PLAYING',
        'MEETING',
        'VOTING_RESULTS',
        'PLAYING',
        'MEETING',
        'VOTING_RESULTS',
        'GAME_OVER',
        'LOBBY',
      ];

      for (const targetState of nextTransitions) {
        expect(canTransition(currentState, targetState)).toBe(true);
        currentState = targetState;
      }

      expect(currentState).toBe('LOBBY');
    });

    it('rejects illegal transitions that bypass rules', () => {
      // Cannot jump from LOBBY directly to PLAYING without STARTING
      expect(canTransition('LOBBY', 'PLAYING')).toBe(false);
      // Cannot jump from PLAYING directly to VOTING_RESULTS without MEETING
      expect(canTransition('PLAYING', 'VOTING_RESULTS')).toBe(false);
      // Cannot jump from MEETING directly to LOBBY
      expect(canTransition('MEETING', 'LOBBY')).toBe(false);
      // Cannot jump from GAME_OVER directly to PLAYING
      expect(canTransition('GAME_OVER', 'PLAYING')).toBe(false);
    });
  });

  describe('Session Reconnection & Grace Period', () => {
    it('defines a 30-second session recovery window', () => {
      expect(GAMEPLAY_CONSTANTS.SESSION_RECOVERY_SECONDS).toBe(30);
    });

    it('allows valid sessionToken in RoomJoinSchema for reconnection', () => {
      const reconnectPayload = {
        roomCode: 'HADR01',
        playerName: 'CaptainNadir',
        sessionToken: 'sess_99388373_abf44',
      };
      const res = safeValidate(RoomJoinSchema, reconnectPayload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.sessionToken).toBe('sess_99388373_abf44');
      }
    });
  });
});
