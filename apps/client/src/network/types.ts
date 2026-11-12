import {
  PlayerPublicView,
  PlayerPrivateView,
  RoomStateView,
  PlayerTask,
  ActiveSabotage,
  MeetingState,
  MeetingResult,
  GameOverPayload,
  ChatMessageBroadcastPayload,
  RoomErrorPayload
} from '@pressure-shift/shared';

export type NetworkConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface UserSession {
  playerId?: string;
  roomCode?: string;
  sessionToken?: string;
  playerName: string;
  color: string;
  cosmetic: string;
}

export interface NetworkCallbacks {
  onConnectionStatus?: (status: NetworkConnectionStatus) => void;
  onRoomState?: (state: RoomStateView) => void;
  onGameStart?: (data: {
    role: string;
    disruptorPeers?: string[];
    assignedTasks: PlayerTask[];
    settings: any;
    yourPlayerId: string;
  }) => void;
  onSyncState?: (data: { room: RoomStateView; yourPlayer: PlayerPrivateView }) => void;
  onPlayerJoined?: (player: PlayerPublicView) => void;
  onPlayerLeft?: (data: { playerId: string; reason?: string; newHostId?: string }) => void;
  onPlayerMoved?: (data: { playerId: string; x: number; y: number; facing?: string }) => void;
  onTaskAssigned?: (tasks: PlayerTask[]) => void;
  onTaskProgress?: (data: { totalCompleted: number; totalTasks: number; percent: number }) => void;
  onSabotageActive?: (sabotage: ActiveSabotage) => void;
  onSabotageCleared?: (sabotageType: string) => void;
  onPlayerKilled?: (data: { victimId: string; killerId?: string; position: { x: number; y: number } }) => void;
  onMeetingStarted?: (meeting: MeetingState) => void;
  onVoteUpdate?: (data: { votedPlayerIds: string[]; remainingVoters: string[] }) => void;
  onMeetingResult?: (result: MeetingResult) => void;
  onGameOver?: (data: GameOverPayload) => void;
  onChatMessage?: (message: ChatMessageBroadcastPayload) => void;
  onError?: (error: RoomErrorPayload) => void;
  onLatency?: (pingMs: number) => void;
}
