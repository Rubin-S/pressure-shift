import {
  generateRoomCode,
  RoomSettings,
  PlayerColorId,
  PLAYER_COLORS,
  PLAYER_COSMETICS,
  GAMEPLAY_CONSTANTS,
  FACILITY_ROOMS,
} from '@pressure-shift/shared';
import { ServerPlayer } from '../types.js';
import { GameRoom, RoomEventsListener } from './room.js';

export const RECONNECT_GRACE_PERIOD_MS = 30_000;

export interface RoomJoinResult {
  success: boolean;
  error?: string;
  room?: GameRoom;
  player?: ServerPlayer;
  isReconnect?: boolean;
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private eventListenerFactory?: (roomCode: string) => RoomEventsListener;

  public setEventListenerFactory(factory: (roomCode: string) => RoomEventsListener): void {
    this.eventListenerFactory = factory;
  }

  public getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public getRoomBySocketId(socketId: string): { room: GameRoom; player: ServerPlayer } | undefined {
    for (const room of this.rooms.values()) {
      const player = room.getPlayerBySocketId(socketId);
      if (player) {
        return { room, player };
      }
    }
    return undefined;
  }

  public getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Generates an unused unique 6-character room code.
   */
  public generateUniqueRoomCode(): string {
    let code = generateRoomCode();
    let attempts = 0;
    while (this.rooms.has(code) && attempts < 100) {
      code = generateRoomCode();
      attempts++;
    }
    return code;
  }

  /**
   * Creates a new game room and initial host player.
   */
  public createRoom(params: {
    playerName: string;
    cosmetic?: string;
    color?: string;
    roomSettings?: Partial<RoomSettings>;
    socketId: string;
  }): { room: GameRoom; player: ServerPlayer; sessionToken: string } {
    const roomCode = this.generateUniqueRoomCode();
    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const sessionToken = `tok_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

    const chosenColor = this.sanitizeColor(params.color);
    const chosenCosmetic = this.sanitizeCosmetic(params.cosmetic);

    const hostPlayer: ServerPlayer = {
      id: playerId,
      name: params.playerName,
      color: chosenColor,
      cosmetic: chosenCosmetic,
      role: 'OPERATOR',
      isAlive: true,
      isReady: true, // Host is ready by default
      position: { ...FACILITY_ROOMS.central_junction.spawnPoint },
      facing: 'down',
      currentRoom: 'central_junction',
      currentTask: null,
      isHost: true,
      connected: true,
      socketId: params.socketId,
      sessionToken,
      assignedTasks: [],
      tasks: [],
      killCooldownRemaining: 0,
      sabotageCooldownRemaining: 0,
      emergencyMeetingsRemaining: 1,
      lastMoveTimestamp: Date.now(),
      lastMovePosition: { ...FACILITY_ROOMS.central_junction.spawnPoint },
      speedViolationsCount: 0,
    };

    const room = new GameRoom(roomCode, hostPlayer, params.roomSettings);
    if (this.eventListenerFactory) {
      room.setEventListener(this.eventListenerFactory(roomCode));
    }
    this.rooms.set(roomCode, room);

    return { room, player: hostPlayer, sessionToken };
  }

  /**
   * Joins an existing room or reconnects via sessionToken.
   */
  public joinRoom(params: {
    roomCode: string;
    playerName: string;
    cosmetic?: string;
    color?: string;
    sessionToken?: string;
    socketId: string;
  }): RoomJoinResult {
    const roomCode = params.roomCode.toUpperCase();
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { success: false, error: `Room ${roomCode} does not exist` };
    }

    // 1. Session Token Reconnection Check (Grace Period Recovery)
    if (params.sessionToken) {
      const existingPlayer = room.getPlayerBySessionToken(params.sessionToken);
      if (existingPlayer) {
        // Cancel disconnect timer
        if (existingPlayer.disconnectTimer) {
          clearTimeout(existingPlayer.disconnectTimer);
          existingPlayer.disconnectTimer = null;
        }
        existingPlayer.socketId = params.socketId;
        existingPlayer.connected = true;
        return {
          success: true,
          room,
          player: existingPlayer,
          isReconnect: true,
        };
      }
    }

    // 2. Joining as a new player
    if (room.state !== 'LOBBY') {
      return {
        success: false,
        error: `Cannot join room ${roomCode}: Match is already in progress (${room.state})`,
      };
    }

    if (room.players.size >= GAMEPLAY_CONSTANTS.MAX_PLAYERS_PER_ROOM) {
      return {
        success: false,
        error: `Room ${roomCode} is full (max ${GAMEPLAY_CONSTANTS.MAX_PLAYERS_PER_ROOM} players)`,
      };
    }

    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const sessionToken = `tok_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

    // Allocate an unused color if possible
    const chosenColor = this.assignAvailableColor(room, params.color);
    const chosenCosmetic = this.sanitizeCosmetic(params.cosmetic);

    const newPlayer: ServerPlayer = {
      id: playerId,
      name: params.playerName,
      color: chosenColor,
      cosmetic: chosenCosmetic,
      role: 'OPERATOR',
      isAlive: true,
      isReady: false,
      position: { ...FACILITY_ROOMS.central_junction.spawnPoint },
      facing: 'down',
      currentRoom: 'central_junction',
      currentTask: null,
      isHost: false,
      connected: true,
      socketId: params.socketId,
      sessionToken,
      assignedTasks: [],
      tasks: [],
      killCooldownRemaining: 0,
      sabotageCooldownRemaining: 0,
      emergencyMeetingsRemaining: room.settings.emergencyMeetingLimit,
      lastMoveTimestamp: Date.now(),
      lastMovePosition: { ...FACILITY_ROOMS.central_junction.spawnPoint },
      speedViolationsCount: 0,
    };

    room.addPlayer(newPlayer);

    return {
      success: true,
      room,
      player: newPlayer,
      isReconnect: false,
    };
  }

  /**
   * Handles socket disconnect: begins 30s reconnect grace period.
   */
  public handleDisconnect(socketId: string): { room: GameRoom; player: ServerPlayer } | undefined {
    const found = this.getRoomBySocketId(socketId);
    if (!found) return undefined;

    const { room, player } = found;
    player.connected = false;
    player.socketId = null;

    // Start 30s session recovery grace period timer
    player.disconnectTimer = setTimeout(() => {
      this.handleGracePeriodExpired(room.roomCode, player.id);
    }, RECONNECT_GRACE_PERIOD_MS);

    if (player.disconnectTimer.unref) {
      player.disconnectTimer.unref();
    }

    return { room, player };
  }

  /**
   * Grace period expired without reconnection.
   */
  public handleGracePeriodExpired(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.getPlayer(playerId);
    if (!player || player.connected) {
      // Player reconnected in the meantime
      return;
    }

    if (room.state === 'LOBBY') {
      // Remove completely from lobby
      const { roomEmpty } = room.removePlayer(playerId);
      if (roomEmpty) {
        this.destroyRoom(roomCode);
      }
    } else {
      // During active match, mark player as eliminated and check win conditions
      player.isAlive = false;
      const { roomEmpty } = room.removePlayer(playerId);
      if (roomEmpty) {
        this.destroyRoom(roomCode);
      } else {
        room.evaluateWinCondition();
      }
    }
  }

  public leaveRoom(socketId: string): { roomCode: string; playerId: string; roomEmpty: boolean } | undefined {
    const found = this.getRoomBySocketId(socketId);
    if (!found) return undefined;

    const { room, player } = found;
    const { roomEmpty } = room.removePlayer(player.id);

    if (roomEmpty) {
      this.destroyRoom(room.roomCode);
    }

    return { roomCode: room.roomCode, playerId: player.id, roomEmpty };
  }

  public destroyRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.destroy();
      this.rooms.delete(roomCode);
    }
  }

  private sanitizeColor(color?: string): PlayerColorId {
    if (color && color in PLAYER_COLORS) {
      return color as PlayerColorId;
    }
    return 'neon_cyan';
  }

  private sanitizeCosmetic(cosmetic?: string): string {
    if (cosmetic && cosmetic in PLAYER_COSMETICS) {
      return cosmetic;
    }
    return 'standard_helm';
  }

  private assignAvailableColor(room: GameRoom, preferredColor?: string): PlayerColorId {
    const usedColors = new Set(room.getAllPlayersList().map((p) => p.color));
    if (preferredColor && preferredColor in PLAYER_COLORS && !usedColors.has(preferredColor)) {
      return preferredColor as PlayerColorId;
    }

    const allColors = Object.keys(PLAYER_COLORS) as PlayerColorId[];
    const available = allColors.find((c) => !usedColors.has(c));
    return available || (preferredColor as PlayerColorId) || 'neon_cyan';
  }
}
