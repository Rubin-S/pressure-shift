import { PlayerPublicView, PlayerPrivateView, PlayerRole, PlayerFacing } from './player.js';
import { RoomSettings, RoomStateView } from './room.js';
import { PlayerTask } from './tasks.js';
import { SabotageType, ActiveSabotage } from './sabotage.js';
import { MeetingState, MeetingResult } from './meeting.js';
import { GameOverReason, GameOverSummary } from './state-machine.js';
import { FacilityRoomId } from './facility.js';

// Standard Socket Acknowledgment
export type SocketAck<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// ========================
// ClientToServer Payload Inputs
// ========================

export interface RoomCreateInput {
  playerName: string;
  cosmetic?: string;
  color?: string;
  roomSettings?: Partial<RoomSettings>;
}

export interface RoomJoinInput {
  roomCode: string;
  playerName: string;
  cosmetic?: string;
  color?: string;
  sessionToken?: string;
}

export interface RoomLeaveInput {
  reason?: string;
}

export interface RoomReadyInput {
  ready: boolean;
}

export interface RoomStartInput {
  settings?: Partial<RoomSettings>;
}

export interface PlayerMoveInput {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  facing?: PlayerFacing;
  sequenceNumber?: number;
  timestamp: number;
}

export interface TaskInteractInput {
  taskId: string;
  action: 'start' | 'cancel';
}

export interface TaskCompleteInput {
  taskId: string;
  proof?: Record<string, unknown>;
}

export interface SabotageTriggerInput {
  sabotageType: SabotageType;
  targetRoom?: FacilityRoomId;
}

export interface SabotageRepairInput {
  sabotageType: SabotageType;
  stationId?: string;
  stepData?: Record<string, unknown>;
}

export interface KillAttemptInput {
  targetPlayerId: string;
}

export interface ReportBodyInput {
  victimPlayerId: string;
}

export interface MeetingCallInput {
  reason?: string;
}

export interface VoteCastInput {
  votedPlayerId: string;
}

export interface VoteSkipInput {
  reason?: string;
}

export interface ChatMessageInput {
  text: string;
}

// ========================
// ServerToClient Payloads
// ========================

export interface RoomStatePayload {
  room: RoomStateView;
}

export interface RoomErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface GameStartPayload {
  role: PlayerRole;
  disruptorPeers?: string[];
  assignedTasks: PlayerTask[];
  settings: RoomSettings;
  yourPlayerId: string;
  countdownSeconds?: number;
}

export interface PlayerJoinedPayload {
  player: PlayerPublicView;
}

export interface PlayerLeftPayload {
  playerId: string;
  reason?: string;
  newHostId?: string;
}

export interface PlayerMovedPayload {
  playerId: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  facing?: PlayerFacing;
  timestamp: number;
}

export interface TaskAssignedPayload {
  tasks: PlayerTask[];
}

export interface TaskProgressPayload {
  totalCompleted: number;
  totalTasks: number;
  percent: number;
  playerCompletedId?: string;
  taskId?: string;
}

export interface SabotageActivePayload {
  sabotage: ActiveSabotage;
}

export interface SabotageClearedPayload {
  sabotageType: SabotageType;
}

export interface PlayerKilledPayload {
  victimId: string;
  killerId?: string;
  position: { x: number; y: number };
}

export interface MeetingStartedPayload {
  meeting: MeetingState;
}

export interface VoteUpdatePayload {
  votedPlayerIds: string[];
  remainingVoters: string[];
}

export interface MeetingResultPayload {
  result: MeetingResult;
}

export interface GameOverPayload {
  winner: 'OPERATORS' | 'DISRUPTORS';
  reason: GameOverReason;
  roles: Record<string, PlayerRole>;
  summary: GameOverSummary;
}

export interface SyncStatePayload {
  room: RoomStateView;
  yourPlayer: PlayerPrivateView;
}

export interface ChatMessageBroadcastPayload {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
  isDeadOnly?: boolean;
}

// ========================
// Socket.IO Event Interfaces
// ========================

export interface ClientToServerEvents {
  'room:create': (data: RoomCreateInput, callback?: (ack: SocketAck<{ roomCode: string; playerId: string; sessionToken: string }>) => void) => void;
  'room:join': (data: RoomJoinInput, callback?: (ack: SocketAck<{ roomCode: string; playerId: string; sessionToken: string; isHost: boolean }>) => void) => void;
  'room:leave': (data: RoomLeaveInput, callback?: (ack: SocketAck<void>) => void) => void;
  'room:ready': (data: RoomReadyInput, callback?: (ack: SocketAck<void>) => void) => void;
  'room:start': (data: RoomStartInput, callback?: (ack: SocketAck<void>) => void) => void;
  'player:move': (data: PlayerMoveInput) => void;
  'task:interact': (data: TaskInteractInput, callback?: (ack: SocketAck<void>) => void) => void;
  'task:complete': (data: TaskCompleteInput, callback?: (ack: SocketAck<{ percent: number }>) => void) => void;
  'sabotage:trigger': (data: SabotageTriggerInput, callback?: (ack: SocketAck<void>) => void) => void;
  'sabotage:repair': (data: SabotageRepairInput, callback?: (ack: SocketAck<void>) => void) => void;
  'kill:attempt': (data: KillAttemptInput, callback?: (ack: SocketAck<{ killed: boolean }>) => void) => void;
  'report:body': (data: ReportBodyInput, callback?: (ack: SocketAck<void>) => void) => void;
  'meeting:call': (data: MeetingCallInput, callback?: (ack: SocketAck<void>) => void) => void;
  'vote:cast': (data: VoteCastInput, callback?: (ack: SocketAck<void>) => void) => void;
  'vote:skip': (data: VoteSkipInput, callback?: (ack: SocketAck<void>) => void) => void;
  'chat:message': (data: ChatMessageInput, callback?: (ack: SocketAck<void>) => void) => void;
}

export interface ServerToClientEvents {
  'room:state': (data: RoomStatePayload) => void;
  'room:error': (data: RoomErrorPayload) => void;
  'game:start': (data: GameStartPayload) => void;
  'player:joined': (data: PlayerJoinedPayload) => void;
  'player:left': (data: PlayerLeftPayload) => void;
  'player:moved': (data: PlayerMovedPayload) => void;
  'task:assigned': (data: TaskAssignedPayload) => void;
  'task:progress': (data: TaskProgressPayload) => void;
  'sabotage:active': (data: SabotageActivePayload) => void;
  'sabotage:cleared': (data: SabotageClearedPayload) => void;
  'player:killed': (data: PlayerKilledPayload) => void;
  'meeting:started': (data: MeetingStartedPayload) => void;
  'vote:update': (data: VoteUpdatePayload) => void;
  'meeting:result': (data: MeetingResultPayload) => void;
  'game:over': (data: GameOverPayload) => void;
  'sync:state': (data: SyncStatePayload) => void;
  'chat:message': (data: ChatMessageBroadcastPayload) => void;
}
