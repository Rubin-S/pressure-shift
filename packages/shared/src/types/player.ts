import { FacilityRoomId } from './facility.js';
import { Position2D, PlayerTask } from './tasks.js';
import type { PlayerRole } from './meeting.js';

export type { PlayerRole };

export type PlayerColorId =
  | 'neon_cyan'
  | 'coral_red'
  | 'deep_amber'
  | 'kelp_green'
  | 'biolum_purple'
  | 'trench_white'
  | 'abyss_black'
  | 'sub_yellow'
  | 'marine_blue'
  | 'rust_orange';

export type PlayerCosmeticId =
  | 'standard_helm'
  | 'deep_diver'
  | 'welding_mask'
  | 'captain_cap'
  | 'biologist_goggles'
  | 'hazard_rebreather'
  | 'aquanaut_beret'
  | 'sonar_headset';

export type PlayerFacing = 'left' | 'right' | 'up' | 'down';

export interface PlayerPublicView {
  id: string;
  name: string;
  color: PlayerColorId | string;
  cosmetic: PlayerCosmeticId | string;
  role?: PlayerRole; // Hidden for other players during match unless game over or disruptor teammate
  isAlive: boolean;
  isReady: boolean;
  position: Position2D;
  facing: PlayerFacing;
  currentRoom: FacilityRoomId | null;
  currentTask: string | null;
  isHost: boolean;
  connected: boolean;
}

export interface PlayerPrivateView extends PlayerPublicView {
  role: PlayerRole;
  assignedTasks: PlayerTask[];
  disruptorPeers?: string[];
  killCooldownRemaining?: number;
  sabotageCooldownRemaining?: number;
  emergencyMeetingsRemaining: number;
}

export interface DeadBody {
  id: string;
  victimId: string;
  victimName: string;
  victimColor: PlayerColorId | string;
  position: Position2D;
  room: FacilityRoomId | null;
  reported: boolean;
  reportedBy?: string;
  createdAt: number;
}
