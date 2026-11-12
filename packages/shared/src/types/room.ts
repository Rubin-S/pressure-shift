import { PlayerPublicView, DeadBody } from './player.js';
import { ActiveSabotage } from './sabotage.js';
import { MeetingState, MeetingResult } from './meeting.js';
import type { RoomState, GameOverSummary } from './state-machine.js';

export type { RoomState };

export interface RoomSettings {
  numDisruptors: number;
  killCooldown: number; // in seconds
  discussionTime: number; // in seconds
  votingTime: number; // in seconds
  operatorTaskCount: number; // tasks assigned per operator
  anonymousVoting: boolean;
  confirmEjects: boolean;
  emergencyMeetingLimit: number;
  playerSpeed?: number; // default 200
  killDistance?: number; // default 75
}

export interface TaskMeterState {
  completedTasks: number;
  totalTasks: number;
  progressPercent: number; // 0 to 100
}

export interface RoomStateView {
  roomCode: string;
  hostId: string;
  state: RoomState;
  settings: RoomSettings;
  players: PlayerPublicView[];
  deadBodies: DeadBody[];
  taskMeter: TaskMeterState;
  activeSabotage: ActiveSabotage | null;
  currentMeeting: MeetingState | null;
  lastMeetingResult: MeetingResult | null;
  gameOverSummary: GameOverSummary | null;
  countdownRemaining?: number | null;
}
