import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomCreateInput,
  RoomJoinInput,
  RoomStartInput,
  PlayerMoveInput,
  TaskInteractInput,
  TaskCompleteInput,
  SabotageTriggerInput,
  SabotageRepairInput,
  KillAttemptInput,
  ReportBodyInput,
  MeetingCallInput,
  VoteCastInput,
  VoteSkipInput,
  ChatMessageInput,
  SocketAck,
  SabotageType,
  FacilityRoomId
} from '@pressure-shift/shared';
import { NetworkConnectionStatus, NetworkCallbacks, UserSession } from './types.js';

const SESSION_STORAGE_KEY = 'pressure_shift_session';

export class NetworkManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private callbacks: NetworkCallbacks = {};
  private status: NetworkConnectionStatus = 'disconnected';
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private currentPingMs: number = 0;

  constructor() {
    // Check saved session in localStorage if in browser environment
    this.loadSavedSession();
  }

  public getStatus(): NetworkConnectionStatus {
    return this.status;
  }

  public getLatency(): number {
    return this.currentPingMs;
  }

  public setCallbacks(callbacks: NetworkCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public loadSavedSession(): UserSession {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore storage errors
    }
    return {
      playerName: `Cadet_${Math.floor(100 + Math.random() * 900)}`,
      color: 'neon_cyan',
      cosmetic: 'standard_helm'
    };
  }

  public saveSession(session: Partial<UserSession>) {
    try {
      const current = this.loadSavedSession();
      const updated = { ...current, ...session };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }

  public clearSessionTokens() {
    try {
      const current = this.loadSavedSession();
      delete current.sessionToken;
      delete current.roomCode;
      delete current.playerId;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Ignore
    }
  }

  public connect(url?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.setStatus('connecting');

    // Use current origin if not provided (Vite proxies /socket.io in dev)
    const serverUrl = url || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupSocketEvents();
    this.startPingTracking();

    return this.socket;
  }

  public disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  private setStatus(newStatus: NetworkConnectionStatus) {
    this.status = newStatus;
    this.callbacks.onConnectionStatus?.(newStatus);
  }

  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.setStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        this.setStatus('disconnected');
      } else {
        this.setStatus('reconnecting');
      }
    });

    this.socket.on('connect_error', () => {
      this.setStatus('error');
    });

    // Game state events
    this.socket.on('room:state', (payload) => {
      this.callbacks.onRoomState?.(payload.room);
    });

    this.socket.on('room:error', (error) => {
      this.callbacks.onError?.(error);
    });

    this.socket.on('game:start', (payload) => {
      this.callbacks.onGameStart?.(payload);
    });

    this.socket.on('sync:state', (payload) => {
      this.callbacks.onSyncState?.(payload);
    });

    this.socket.on('player:joined', (payload) => {
      this.callbacks.onPlayerJoined?.(payload.player);
    });

    this.socket.on('player:left', (payload) => {
      this.callbacks.onPlayerLeft?.(payload);
    });

    this.socket.on('player:moved', (payload) => {
      this.callbacks.onPlayerMoved?.(payload);
    });

    this.socket.on('task:assigned', (payload) => {
      this.callbacks.onTaskAssigned?.(payload.tasks);
    });

    this.socket.on('task:progress', (payload) => {
      this.callbacks.onTaskProgress?.(payload);
    });

    this.socket.on('sabotage:active', (payload) => {
      this.callbacks.onSabotageActive?.(payload.sabotage);
    });

    this.socket.on('sabotage:cleared', (payload) => {
      this.callbacks.onSabotageCleared?.(payload.sabotageType);
    });

    this.socket.on('player:killed', (payload) => {
      this.callbacks.onPlayerKilled?.(payload);
    });

    this.socket.on('meeting:started', (payload) => {
      this.callbacks.onMeetingStarted?.(payload.meeting);
    });

    this.socket.on('vote:update', (payload) => {
      this.callbacks.onVoteUpdate?.(payload);
    });

    this.socket.on('meeting:result', (payload) => {
      this.callbacks.onMeetingResult?.(payload.result);
    });

    this.socket.on('game:over', (payload) => {
      this.callbacks.onGameOver?.(payload);
    });

    this.socket.on('chat:message', (payload) => {
      this.callbacks.onChatMessage?.(payload);
    });
  }

  private startPingTracking() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (!this.socket || !this.socket.connected) return;
      const start = Date.now();
      // Measure round-trip ping time
      this.socket.volatile.emit('chat:message', { text: '' }, () => {
        const ping = Date.now() - start;
        this.currentPingMs = ping;
        this.callbacks.onLatency?.(ping);
      });
    }, 4000);
  }

  // ==========================
  // Client Action Emitters
  // ==========================

  public async createRoom(data: RoomCreateInput): Promise<{ roomCode: string; playerId: string; sessionToken: string }> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.socket!.emit('room:create', data, (ack: SocketAck<{ roomCode: string; playerId: string; sessionToken: string }>) => {
        if (ack.success) {
          this.saveSession({
            roomCode: ack.data.roomCode,
            playerId: ack.data.playerId,
            sessionToken: ack.data.sessionToken,
            playerName: data.playerName,
            color: data.color || 'neon_cyan',
            cosmetic: data.cosmetic || 'standard_helm'
          });
          resolve(ack.data);
        } else {
          reject(new Error(ack.error || 'Failed to create room'));
        }
      });
    });
  }

  public async joinRoom(data: RoomJoinInput): Promise<{ roomCode: string; playerId: string; sessionToken: string; isHost: boolean }> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.socket!.emit('room:join', data, (ack: SocketAck<{ roomCode: string; playerId: string; sessionToken: string; isHost: boolean }>) => {
        if (ack.success) {
          this.saveSession({
            roomCode: ack.data.roomCode,
            playerId: ack.data.playerId,
            sessionToken: ack.data.sessionToken,
            playerName: data.playerName,
            color: data.color || 'neon_cyan',
            cosmetic: data.cosmetic || 'standard_helm'
          });
          resolve(ack.data);
        } else {
          reject(new Error(ack.error || 'Failed to join room'));
        }
      });
    });
  }

  public async leaveRoom(reason?: string): Promise<void> {
    if (!this.socket || !this.socket.connected) return;
    return new Promise((resolve) => {
      this.socket!.emit('room:leave', { reason }, () => {
        this.clearSessionTokens();
        resolve();
      });
    });
  }

  public async setReady(ready: boolean): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.socket!.emit('room:ready', { ready }, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Failed to toggle ready'));
      });
    });
  }

  public async startGame(settings?: Partial<RoomStartInput>): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.socket!.emit('room:start', settings || {}, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Failed to start game'));
      });
    });
  }

  public sendMove(input: PlayerMoveInput): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('player:move', input);
  }

  public async interactTask(taskId: string, action: 'start' | 'cancel'): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: TaskInteractInput = { taskId, action };
      this.socket!.emit('task:interact', payload, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Task interaction failed'));
      });
    });
  }

  public async completeTask(taskId: string, proof?: Record<string, unknown>): Promise<{ percent: number }> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: TaskCompleteInput = { taskId, proof };
      this.socket!.emit('task:complete', payload, (ack: SocketAck<{ percent: number }>) => {
        if (ack.success) resolve(ack.data);
        else reject(new Error(ack.error || 'Failed to complete task'));
      });
    });
  }

  public async triggerSabotage(sabotageType: SabotageType, targetRoom?: FacilityRoomId): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: SabotageTriggerInput = { sabotageType, targetRoom };
      this.socket!.emit('sabotage:trigger', payload, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Failed to trigger sabotage'));
      });
    });
  }

  public async repairSabotage(sabotageType: SabotageType, stationId?: string, stepData?: Record<string, unknown>): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: SabotageRepairInput = { sabotageType, stationId, stepData };
      this.socket!.emit('sabotage:repair', payload, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Failed to repair sabotage'));
      });
    });
  }

  public async attemptKill(targetPlayerId: string): Promise<{ killed: boolean }> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: KillAttemptInput = { targetPlayerId };
      this.socket!.emit('kill:attempt', payload, (ack: SocketAck<{ killed: boolean }>) => {
        if (ack.success) resolve(ack.data);
        else reject(new Error(ack.error || 'Kill attempt failed'));
      });
    });
  }

  public async reportBody(victimPlayerId: string): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: ReportBodyInput = { victimPlayerId };
      this.socket!.emit('report:body', payload, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Report body failed'));
      });
    });
  }

  public async callMeeting(reason?: string): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: MeetingCallInput = { reason };
      this.socket!.emit('meeting:call', payload, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Emergency meeting call failed'));
      });
    });
  }

  public async castVote(votedPlayerId: string): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: VoteCastInput = { votedPlayerId };
      this.socket!.emit('vote:cast', payload, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Failed to cast vote'));
      });
    });
  }

  public async skipVote(reason?: string): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: VoteSkipInput = { reason };
      this.socket!.emit('vote:skip', payload, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Failed to skip vote'));
      });
    });
  }

  public async sendChatMessage(text: string): Promise<void> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const payload: ChatMessageInput = { text };
      this.socket!.emit('chat:message', payload, (ack: SocketAck<void>) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error || 'Failed to send message'));
      });
    });
  }

  private ensureConnected() {
    if (!this.socket) {
      this.connect();
    }
  }

  public getRawSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }
}

export const networkManager = new NetworkManager();
