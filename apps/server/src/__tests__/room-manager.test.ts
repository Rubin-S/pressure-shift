import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RoomManager } from '../game/room-manager.js';
import { GAMEPLAY_CONSTANTS } from '@pressure-shift/shared';

describe('RoomManager Unit Tests', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  afterEach(() => {
    for (const room of roomManager.getAllRooms()) {
      room.destroy();
    }
  });

  describe('Room Creation & Code Generation', () => {
    it('creates a room with a valid unique 6-character room code', () => {
      const { room, player, sessionToken } = roomManager.createRoom({
        playerName: 'Captain Nemo',
        color: 'neon_cyan',
        cosmetic: 'standard_helm',
        socketId: 'sock_1',
      });

      expect(room).toBeDefined();
      expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(player.name).toBe('Captain Nemo');
      expect(player.isHost).toBe(true);
      expect(player.connected).toBe(true);
      expect(sessionToken).toBeDefined();
      expect(roomManager.getRoom(room.roomCode)).toBe(room);
    });

    it('generates distinct codes for separate rooms', () => {
      const r1 = roomManager.createRoom({ playerName: 'P1', socketId: 's1' });
      const r2 = roomManager.createRoom({ playerName: 'P2', socketId: 's2' });
      expect(r1.room.roomCode).not.toBe(r2.room.roomCode);
    });
  });

  describe('Player Joining & Capacity', () => {
    it('allows players to join an existing lobby with available slots', () => {
      const { room } = roomManager.createRoom({ playerName: 'Host', socketId: 's_host' });
      const joinRes = roomManager.joinRoom({
        roomCode: room.roomCode,
        playerName: 'Explorer',
        socketId: 's_join',
      });

      expect(joinRes.success).toBe(true);
      expect(joinRes.player).toBeDefined();
      expect(joinRes.player?.name).toBe('Explorer');
      expect(joinRes.player?.isHost).toBe(false);
      expect(room.players.size).toBe(2);
    });

    it('rejects join attempts for non-existent room codes', () => {
      const joinRes = roomManager.joinRoom({
        roomCode: 'NONEX9',
        playerName: 'LostDiver',
        socketId: 's_lost',
      });

      expect(joinRes.success).toBe(false);
      expect(joinRes.error).toContain('does not exist');
    });

    it('rejects join when room reaches maximum capacity', () => {
      const { room } = roomManager.createRoom({ playerName: 'Host', socketId: 's_host' });

      for (let i = 2; i <= GAMEPLAY_CONSTANTS.MAX_PLAYERS_PER_ROOM; i++) {
        const res = roomManager.joinRoom({
          roomCode: room.roomCode,
          playerName: `Diver_${i}`,
          socketId: `s_${i}`,
        });
        expect(res.success).toBe(true);
      }

      // 11th player should be rejected
      const overflow = roomManager.joinRoom({
        roomCode: room.roomCode,
        playerName: 'OverflowDiver',
        socketId: 's_overflow',
      });
      expect(overflow.success).toBe(false);
      expect(overflow.error).toContain('is full');
    });

    it('allocates distinct colors when players pick duplicate colors', () => {
      const { room } = roomManager.createRoom({
        playerName: 'Host',
        color: 'coral_red',
        socketId: 's_host',
      });

      const joinRes = roomManager.joinRoom({
        roomCode: room.roomCode,
        playerName: 'Guest',
        color: 'coral_red', // same color requested
        socketId: 's_guest',
      });

      expect(joinRes.success).toBe(true);
      expect(joinRes.player?.color).not.toBe('coral_red');
    });
  });

  describe('Disconnect Grace Period & Session Recovery', () => {
    it('recovers player connection within grace period using session token', () => {
      const { room, sessionToken } = roomManager.createRoom({
        playerName: 'Host',
        socketId: 's_original',
      });

      // Socket disconnects
      const dc = roomManager.handleDisconnect('s_original');
      expect(dc).toBeDefined();
      expect(dc?.player.connected).toBe(false);
      expect(dc?.player.socketId).toBeNull();

      // Reconnect with new socket and original session token
      const reconnectRes = roomManager.joinRoom({
        roomCode: room.roomCode,
        playerName: 'Host',
        sessionToken,
        socketId: 's_reconnected',
      });

      expect(reconnectRes.success).toBe(true);
      expect(reconnectRes.isReconnect).toBe(true);
      expect(reconnectRes.player?.connected).toBe(true);
      expect(reconnectRes.player?.socketId).toBe('s_reconnected');
      expect(room.players.size).toBe(1);
    });

    it('transfers host privileges when host leaves the room', () => {
      const { room, player: host } = roomManager.createRoom({
        playerName: 'OriginalHost',
        socketId: 's_host',
      });

      const guestRes = roomManager.joinRoom({
        roomCode: room.roomCode,
        playerName: 'NextInLine',
        socketId: 's_guest',
      });

      expect(guestRes.player).toBeDefined();
      expect(guestRes.player?.isHost).toBe(false);

      // Host leaves
      const leaveRes = roomManager.leaveRoom('s_host');
      expect(leaveRes).toBeDefined();
      expect(leaveRes?.roomEmpty).toBe(false);

      expect(room.hostId).toBe(guestRes.player!.id);
      expect(guestRes.player!.isHost).toBe(true);
    });

    it('destroys room and cleans up resources when all players leave', () => {
      const { room } = roomManager.createRoom({ playerName: 'Solo', socketId: 's_solo' });
      const roomCode = room.roomCode;

      const leaveRes = roomManager.leaveRoom('s_solo');
      expect(leaveRes?.roomEmpty).toBe(true);
      expect(roomManager.getRoom(roomCode)).toBeUndefined();
    });
  });
});
