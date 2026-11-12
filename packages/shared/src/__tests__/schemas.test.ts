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
  VoteCastSchema,
  ChatMessageSchema,
  RoomSettingsSchema,
  safeValidate,
} from '../index.js';

describe('Zod Validation Schemas', () => {
  describe('RoomCreateSchema', () => {
    it('accepts valid room creation payload', () => {
      const res = safeValidate(RoomCreateSchema, {
        playerName: 'CaptainNemo',
        color: 'neon_cyan',
        cosmetic: 'deep_diver',
      });
      expect(res.success).toBe(true);
    });

    it('rejects empty or excessively long player names', () => {
      expect(safeValidate(RoomCreateSchema, { playerName: '' }).success).toBe(false);
      expect(
        safeValidate(RoomCreateSchema, { playerName: 'A'.repeat(25) }).success
      ).toBe(false);
    });

    it('rejects extra unknown fields due to strict schema', () => {
      const res = safeValidate(RoomCreateSchema, {
        playerName: 'Nemo',
        hackedField: 'malicious',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('RoomJoinSchema', () => {
    it('accepts valid 6-char uppercase alphanumeric code', () => {
      const res = safeValidate(RoomJoinSchema, {
        roomCode: 'AB12CD',
        playerName: 'DiverDan',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.roomCode).toBe('AB12CD');
      }
    });

    it('rejects invalid room codes (wrong length or lowercase)', () => {
      expect(safeValidate(RoomJoinSchema, { roomCode: 'abc', playerName: 'Dan' }).success).toBe(false);
      expect(safeValidate(RoomJoinSchema, { roomCode: 'TOOLONG1', playerName: 'Dan' }).success).toBe(false);
    });
  });

  describe('PlayerMoveSchema', () => {
    it('validates position, velocity, and timestamp', () => {
      const res = safeValidate(PlayerMoveSchema, {
        x: 120.5,
        y: 450.2,
        vx: 150,
        vy: 0,
        facing: 'right',
        sequenceNumber: 14,
        timestamp: Date.now(),
      });
      expect(res.success).toBe(true);
    });

    it('rejects non-finite coordinates', () => {
      const res = safeValidate(PlayerMoveSchema, {
        x: NaN,
        y: 100,
        timestamp: Date.now(),
      });
      expect(res.success).toBe(false);
    });
  });

  describe('Task schemas', () => {
    it('validates task interact start and cancel', () => {
      expect(
        safeValidate(TaskInteractSchema, { taskId: 'task_sonar_cal', action: 'start' }).success
      ).toBe(true);
      expect(
        safeValidate(TaskInteractSchema, { taskId: 'task_sonar_cal', action: 'cancel' }).success
      ).toBe(true);
      expect(
        safeValidate(TaskInteractSchema, { taskId: 'task_sonar_cal', action: 'invalid' }).success
      ).toBe(false);
    });

    it('validates task completion payload', () => {
      expect(
        safeValidate(TaskCompleteSchema, { taskId: 'task_pressure_valve', proof: { val: 80 } }).success
      ).toBe(true);
    });
  });

  describe('Sabotage schemas', () => {
    it('validates sabotage trigger with valid type', () => {
      const res = safeValidate(SabotageTriggerSchema, {
        sabotageType: 'oxygen_depletion',
      });
      expect(res.success).toBe(true);
    });

    it('rejects unknown sabotage types', () => {
      const res = safeValidate(SabotageTriggerSchema, {
        sabotageType: 'nuclear_blast',
      });
      expect(res.success).toBe(false);
    });

    it('validates sabotage repair payload', () => {
      const res = safeValidate(SabotageRepairSchema, {
        sabotageType: 'reactor_meltdown',
        stationId: 'station_reactor_alpha',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('Kill and Report schemas', () => {
    it('validates kill attempt', () => {
      expect(safeValidate(KillAttemptSchema, { targetPlayerId: 'player_123' }).success).toBe(true);
      expect(safeValidate(KillAttemptSchema, { targetPlayerId: '' }).success).toBe(false);
    });

    it('validates dead body report', () => {
      expect(safeValidate(ReportBodySchema, { victimPlayerId: 'victim_456' }).success).toBe(true);
    });
  });

  describe('Voting and Chat schemas', () => {
    it('validates vote cast', () => {
      expect(safeValidate(VoteCastSchema, { votedPlayerId: 'suspect_1' }).success).toBe(true);
    });

    it('validates chat message length constraints', () => {
      expect(safeValidate(ChatMessageSchema, { text: 'I saw red vent in pressure lab!' }).success).toBe(true);
      expect(safeValidate(ChatMessageSchema, { text: '' }).success).toBe(false);
      expect(safeValidate(ChatMessageSchema, { text: 'x'.repeat(201) }).success).toBe(false);
    });
  });

  describe('RoomSettingsSchema', () => {
    it('applies default room settings', () => {
      const res = RoomSettingsSchema.parse({});
      expect(res.numDisruptors).toBe(1);
      expect(res.killCooldown).toBe(25);
      expect(res.discussionTime).toBe(15);
      expect(res.votingTime).toBe(30);
      expect(res.confirmEjects).toBe(true);
    });

    it('enforces min and max bounds on settings', () => {
      expect(safeValidate(RoomSettingsSchema, { numDisruptors: 5 }).success).toBe(false);
      expect(safeValidate(RoomSettingsSchema, { killCooldown: 5 }).success).toBe(false);
    });
  });
});
