import {
  PlayerRole,
  PlayerFacing,
  PlayerColorId,
  PlayerCosmeticId,
  Position2D,
  FacilityRoomId,
  PlayerTask,
  RoomSettings,
  RoomStateView,
} from '@pressure-shift/shared';

export interface ServerPlayer {
  id: string;
  name: string;
  color: PlayerColorId | string;
  cosmetic: PlayerCosmeticId | string;
  role: PlayerRole;
  isAlive: boolean;
  isReady: boolean;
  position: Position2D;
  facing: PlayerFacing;
  currentRoom: FacilityRoomId | null;
  currentTask: string | null;
  isHost: boolean;
  connected: boolean;
  socketId: string | null;
  sessionToken: string;
  assignedTasks: PlayerTask[];
  tasks: PlayerTask[];
  killCooldownRemaining: number;
  sabotageCooldownRemaining: number;
  emergencyMeetingsRemaining: number;
  lastMoveTimestamp: number;
  lastMovePosition: Position2D;
  disconnectTimer?: NodeJS.Timeout | null;
  speedViolationsCount: number;
}

export interface RoomBroadcastSanitizedViews {
  recipients: Array<{
    socketId: string;
    playerId: string;
    roomView: RoomStateView;
  }>;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}
