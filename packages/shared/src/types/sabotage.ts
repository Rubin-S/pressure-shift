import { FacilityRoomId } from './facility.js';
import { Position2D } from './tasks.js';

export type SabotageType =
  | 'communications_interference'
  | 'oxygen_depletion'
  | 'reactor_meltdown'
  | 'door_lockdown';

export interface SabotageStation {
  id: string;
  name: string;
  room: FacilityRoomId;
  location: Position2D;
  isActivated: boolean;
  activatedBy?: string;
}

export interface ActiveSabotage {
  type: SabotageType;
  name: string;
  isCritical: boolean;
  timeRemaining: number | null; // seconds remaining before critical disaster, null if non-critical
  totalDuration: number | null; // total seconds countdown
  triggeredAt: number;
  targetRoom?: FacilityRoomId; // for room lockdown
  lockdownEndTime?: number;
  requiredStations: SabotageStation[];
}

export interface SabotageDefinition {
  type: SabotageType;
  name: string;
  description: string;
  cooldownSeconds: number;
  isCritical: boolean;
  criticalTimerSeconds?: number;
  repairInstructions: string;
  defaultStations: Array<{
    id: string;
    name: string;
    room: FacilityRoomId;
    location: Position2D;
  }>;
}
