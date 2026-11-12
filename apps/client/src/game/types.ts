import {
  FacilityRoomId,
  PlayerFacing,
  PlayerPublicView,
  PlayerPrivateView,
  DeadBody,
  PlayerTask,
  ActiveSabotage,
  Position2D,
} from '@pressure-shift/shared';

export type InteractableType =
  | 'task'
  | 'emergency_button'
  | 'body'
  | 'vent'
  | 'sabotage_repair'
  | 'kill_target';

export interface InteractableInfo {
  type: InteractableType;
  id: string;
  name: string;
  promptKey: string;
  promptText: string;
  room: FacilityRoomId | null;
  position: Position2D;
  distance: number;
  metadata?: Record<string, unknown>;
}

export interface PlayerMoveEventPayload {
  x: number;
  y: number;
  facing: PlayerFacing;
  room: FacilityRoomId;
  timestamp: number;
}

export interface KillTargetInfo {
  targetId: string;
  targetName: string;
  position: Position2D;
  distance: number;
}

export interface GameBridgeEvents {
  'player:moved': (payload: PlayerMoveEventPayload) => void;
  'player:room_changed': (newRoom: FacilityRoomId) => void;
  'interactable:in_range': (info: InteractableInfo) => void;
  'interactable:out_of_range': () => void;
  'interact:triggered': (info: InteractableInfo) => void;
  'task:triggered': (taskId: string) => void;
  'emergency_button:triggered': () => void;
  'body:reported': (bodyId: string) => void;
  'vent:used': (ventId: string) => void;
  'sabotage_repair:triggered': (stationId: string) => void;
  'kill:attempted': (targetId: string) => void;
  'kill_target:updated': (target: KillTargetInfo | null) => void;
  'game:ready': () => void;
}

export type GameBridgeEventName = keyof GameBridgeEvents;
