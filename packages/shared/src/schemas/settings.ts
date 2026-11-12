import { z } from 'zod';

export const RoomSettingsSchema = z.object({
  numDisruptors: z.number().int().min(1).max(3).default(1),
  killCooldown: z.number().int().min(10).max(60).default(25),
  discussionTime: z.number().int().min(5).max(120).default(15),
  votingTime: z.number().int().min(10).max(120).default(30),
  operatorTaskCount: z.number().int().min(1).max(8).default(5),
  anonymousVoting: z.boolean().default(false),
  confirmEjects: z.boolean().default(true),
  emergencyMeetingLimit: z.number().int().min(1).max(5).default(1),
  playerSpeed: z.number().min(100).max(400).optional().default(200),
  killDistance: z.number().min(40).max(150).optional().default(75),
}).strict();

export const PartialRoomSettingsSchema = RoomSettingsSchema.partial();

export type RoomSettingsValidated = z.infer<typeof RoomSettingsSchema>;
