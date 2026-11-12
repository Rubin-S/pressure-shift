import { z } from 'zod';
import { RoomSettingsSchema, PartialRoomSettingsSchema } from './settings.js';

export const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, 'Room code must be exactly 6 uppercase alphanumeric characters');

export const PlayerNameSchema = z
  .string()
  .trim()
  .min(1, 'Player name must be at least 1 character')
  .max(20, 'Player name cannot exceed 20 characters')
  .regex(/^[a-zA-Z0-9 _-]+$/, 'Player name contains invalid characters');

export const FacilityRoomIdSchema = z.enum([
  'docking_cradle',
  'sonar_control',
  'hydroponics',
  'pressure_lab',
  'thermal_plant',
  'communications',
  'observation_gallery',
  'medical_bay',
  'central_junction',
]);

export const SabotageTypeSchema = z.enum([
  'communications_interference',
  'oxygen_depletion',
  'reactor_meltdown',
  'door_lockdown',
]);

export const PlayerFacingSchema = z.enum(['left', 'right', 'up', 'down']);

// 1. room:create
export const RoomCreateSchema = z
  .object({
    playerName: PlayerNameSchema,
    cosmetic: z.string().trim().max(50).optional(),
    color: z.string().trim().max(30).optional(),
    roomSettings: PartialRoomSettingsSchema.optional(),
  })
  .strict();

// 2. room:join
export const RoomJoinSchema = z
  .object({
    roomCode: RoomCodeSchema,
    playerName: PlayerNameSchema,
    cosmetic: z.string().trim().max(50).optional(),
    color: z.string().trim().max(30).optional(),
    sessionToken: z.string().trim().max(128).optional(),
  })
  .strict();

// 3. room:leave
export const RoomLeaveSchema = z
  .object({
    reason: z.string().max(100).optional(),
  })
  .strict()
  .optional()
  .default({});

// 4. room:ready
export const RoomReadySchema = z
  .object({
    ready: z.boolean(),
  })
  .strict();

// 5. room:start
export const RoomStartSchema = z
  .object({
    settings: PartialRoomSettingsSchema.optional(),
  })
  .strict()
  .optional()
  .default({});

// 6. player:move
export const PlayerMoveSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    vx: z.number().finite().optional(),
    vy: z.number().finite().optional(),
    facing: PlayerFacingSchema.optional(),
    sequenceNumber: z.number().int().nonnegative().optional(),
    timestamp: z.number().positive(),
  })
  .strict();

// 7. task:interact
export const TaskInteractSchema = z
  .object({
    taskId: z.string().trim().min(1).max(64),
    action: z.enum(['start', 'cancel']),
  })
  .strict();

// 8. task:complete
export const TaskCompleteSchema = z
  .object({
    taskId: z.string().trim().min(1).max(64),
    proof: z.record(z.unknown()).optional(),
  })
  .strict();

// 9. sabotage:trigger
export const SabotageTriggerSchema = z
  .object({
    sabotageType: SabotageTypeSchema,
    targetRoom: FacilityRoomIdSchema.optional(),
  })
  .strict();

// 10. sabotage:repair
export const SabotageRepairSchema = z
  .object({
    sabotageType: SabotageTypeSchema,
    stationId: z.string().trim().max(64).optional(),
    stepData: z.record(z.unknown()).optional(),
  })
  .strict();

// 11. kill:attempt
export const KillAttemptSchema = z
  .object({
    targetPlayerId: z.string().trim().min(1).max(64),
  })
  .strict();

// 12. report:body
export const ReportBodySchema = z
  .object({
    victimPlayerId: z.string().trim().min(1).max(64),
  })
  .strict();

// 13. meeting:call
export const MeetingCallSchema = z
  .object({
    reason: z.string().max(100).optional(),
  })
  .strict()
  .optional()
  .default({});

// 14. vote:cast
export const VoteCastSchema = z
  .object({
    votedPlayerId: z.string().trim().min(1).max(64),
  })
  .strict();

// 15. vote:skip
export const VoteSkipSchema = z
  .object({
    reason: z.string().max(100).optional(),
  })
  .strict()
  .optional()
  .default({});

// 16. chat:message
export const ChatMessageSchema = z
  .object({
    text: z.string().trim().min(1, 'Message cannot be empty').max(200, 'Message cannot exceed 200 characters'),
  })
  .strict();

// Map of all schemas for convenient runtime lookup
export const CLIENT_EVENT_SCHEMAS = {
  'room:create': RoomCreateSchema,
  'room:join': RoomJoinSchema,
  'room:leave': RoomLeaveSchema,
  'room:ready': RoomReadySchema,
  'room:start': RoomStartSchema,
  'player:move': PlayerMoveSchema,
  'task:interact': TaskInteractSchema,
  'task:complete': TaskCompleteSchema,
  'sabotage:trigger': SabotageTriggerSchema,
  'sabotage:repair': SabotageRepairSchema,
  'kill:attempt': KillAttemptSchema,
  'report:body': ReportBodySchema,
  'meeting:call': MeetingCallSchema,
  'vote:cast': VoteCastSchema,
  'vote:skip': VoteSkipSchema,
  'chat:message': ChatMessageSchema,
} as const;
