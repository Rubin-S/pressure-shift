import { PlayerRole } from './player.js';

export type RoomState =
  | 'LOBBY'
  | 'STARTING'
  | 'PLAYING'
  | 'MEETING'
  | 'VOTING_RESULTS'
  | 'GAME_OVER';

export type GameOverReason =
  | 'ALL_DISRUPTORS_EJECTED'
  | 'TASKS_COMPLETED'
  | 'DISRUPTORS_EQUAL_OR_OUTNUMBER'
  | 'CRITICAL_SABOTAGE_COLLAPSE'
  | 'OPERATORS_DISCONNECTED';

export interface GameOverSummary {
  winner: 'OPERATORS' | 'DISRUPTORS';
  reason: GameOverReason;
  disruptorIds: string[];
  allPlayers: Array<{
    id: string;
    name: string;
    role: PlayerRole;
    isAlive: boolean;
  }>;
}

export const VALID_STATE_TRANSITIONS: Record<RoomState, readonly RoomState[]> = {
  LOBBY: ['STARTING'],
  STARTING: ['PLAYING', 'LOBBY'],
  PLAYING: ['MEETING', 'GAME_OVER'],
  MEETING: ['VOTING_RESULTS', 'GAME_OVER'],
  VOTING_RESULTS: ['PLAYING', 'GAME_OVER'],
  GAME_OVER: ['LOBBY'],
} as const;
