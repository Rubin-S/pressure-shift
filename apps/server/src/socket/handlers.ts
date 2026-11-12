import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  safeValidate,
  CLIENT_EVENT_SCHEMAS,
  ChatMessageBroadcastPayload,
  GameOverSummary,
  MeetingState,
  MeetingResult,
  ActiveSabotage,
  SabotageType,
  Position2D,
  TaskMeterState,
} from '@pressure-shift/shared';
import { RoomManager } from '../game/room-manager.js';
import { GameRoom } from '../game/room.js';
import { ServerPlayer } from '../types.js';
import { RateLimiter } from '../rate-limiter.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Broadcasts sanitized room state to each connected player in the room.
 * Crucial Anti-Cheat Guarantee: NEVER leaks Disruptor roles to Operators!
 */
export function broadcastSanitizedRoomState(io: TypedServer, room: GameRoom): void {
  for (const player of room.getAllPlayersList()) {
    if (player.socketId) {
      const sanitized = room.getSanitizedStateForPlayer(player.id);
      io.to(player.socketId).emit('room:state', { room: sanitized });
    }
  }
}

/**
 * Synchronizes full state to a single player (including their private assigned tasks and role).
 */
export function sendPlayerSyncState(socket: TypedSocket, room: GameRoom, player: ServerPlayer): void {
  const sanitizedRoom = room.getSanitizedStateForPlayer(player.id);
  const privateView = room.getPrivateViewForPlayer(player.id);
  if (privateView) {
    socket.emit('sync:state', {
      room: sanitizedRoom,
      yourPlayer: privateView,
    });
  }
}

export function registerSocketHandlers(
  io: TypedServer,
  roomManager: RoomManager,
  rateLimiter: RateLimiter
): void {
  // Wire up room event listeners for server-side state machine triggers
  roomManager.setEventListenerFactory((roomCode: string) => {
    return {
      onRoomStateChanged: (room: GameRoom) => {
        broadcastSanitizedRoomState(io, room);
      },
      onPlayerMoved: (playerId: string, x: number, y: number, vx?: number, vy?: number, facing?: any) => {
        io.to(roomCode).emit('player:moved', {
          playerId,
          x,
          y,
          vx,
          vy,
          facing,
          timestamp: Date.now(),
        });
      },
      onGameOver: (summary: GameOverSummary) => {
        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        const roles: Record<string, any> = {};
        for (const p of room.getAllPlayersList()) {
          roles[p.id] = p.role;
        }

        io.to(roomCode).emit('game:over', {
          winner: summary.winner,
          reason: summary.reason,
          roles,
          summary,
        });
        broadcastSanitizedRoomState(io, room);
      },
      onMeetingStarted: (meeting: MeetingState) => {
        io.to(roomCode).emit('meeting:started', { meeting });
      },
      onMeetingResult: (result: MeetingResult) => {
        io.to(roomCode).emit('meeting:result', { result });
      },
      onSabotageActive: (sabotage: ActiveSabotage) => {
        io.to(roomCode).emit('sabotage:active', { sabotage });
      },
      onSabotageCleared: (sabotageType: SabotageType) => {
        io.to(roomCode).emit('sabotage:cleared', { sabotageType });
      },
      onPlayerKilled: (victimId: string, killerId?: string, position?: Position2D) => {
        io.to(roomCode).emit('player:killed', {
          victimId,
          killerId,
          position: position || { x: 0, y: 0 },
        });
      },
      onTaskProgress: (progress: TaskMeterState, playerCompletedId?: string, taskId?: string) => {
        io.to(roomCode).emit('task:progress', {
          totalCompleted: progress.completedTasks,
          totalTasks: progress.totalTasks,
          percent: progress.progressPercent,
          playerCompletedId,
          taskId,
        });
      },
      onChatMessage: (msg: ChatMessageBroadcastPayload) => {
        io.to(roomCode).emit('chat:message', msg);
      },
    };
  });

  io.on('connection', (socket: TypedSocket) => {
    // 1. room:create
    socket.on('room:create', (data, callback) => {
      if (!rateLimiter.isAllowed(socket.id, 10, 5000)) {
        if (callback) callback({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      const val = safeValidate(CLIENT_EVENT_SCHEMAS['room:create'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      try {
        const { room, player, sessionToken } = roomManager.createRoom({
          playerName: val.data.playerName,
          cosmetic: val.data.cosmetic,
          color: val.data.color,
          roomSettings: val.data.roomSettings,
          socketId: socket.id,
        });

        socket.join(room.roomCode);

        if (callback) {
          callback({
            success: true,
            data: {
              roomCode: room.roomCode,
              playerId: player.id,
              sessionToken,
            },
          });
        }

        broadcastSanitizedRoomState(io, room);
        sendPlayerSyncState(socket, room, player);
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to create room' });
      }
    });

    // 2. room:join
    socket.on('room:join', (data, callback) => {
      if (!rateLimiter.isAllowed(socket.id, 15, 5000)) {
        if (callback) callback({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      const val = safeValidate(CLIENT_EVENT_SCHEMAS['room:join'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const result = roomManager.joinRoom({
        roomCode: val.data.roomCode,
        playerName: val.data.playerName,
        cosmetic: val.data.cosmetic,
        color: val.data.color,
        sessionToken: val.data.sessionToken,
        socketId: socket.id,
      });

      if (!result.success || !result.room || !result.player) {
        if (callback) callback({ success: false, error: result.error || 'Failed to join room' });
        return;
      }

      const { room, player, isReconnect } = result;
      socket.join(room.roomCode);

      if (callback) {
        callback({
          success: true,
          data: {
            roomCode: room.roomCode,
            playerId: player.id,
            sessionToken: player.sessionToken,
            isHost: player.isHost,
          },
        });
      }

      broadcastSanitizedRoomState(io, room);
      sendPlayerSyncState(socket, room, player);

      if (!isReconnect) {
        socket.to(room.roomCode).emit('player:joined', {
          player: room.getSanitizedStateForPlayer(player.id).players.find((p) => p.id === player.id)!,
        });
      }
    });

    // 3. room:leave
    socket.on('room:leave', (_data, callback) => {
      const left = roomManager.leaveRoom(socket.id);
      if (left) {
        socket.leave(left.roomCode);
        if (!left.roomEmpty) {
          const room = roomManager.getRoom(left.roomCode);
          if (room) {
            io.to(left.roomCode).emit('player:left', {
              playerId: left.playerId,
              newHostId: room.hostId,
            });
            broadcastSanitizedRoomState(io, room);
          }
        }
      }
      if (callback) callback({ success: true, data: undefined });
    });

    // 4. room:ready
    socket.on('room:ready', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['room:ready'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      found.room.setPlayerReady(found.player.id, val.data.ready);
      broadcastSanitizedRoomState(io, found.room);
      if (callback) callback({ success: true, data: undefined });
    });

    // 5. room:start
    socket.on('room:start', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['room:start'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      if (!found.player.isHost) {
        if (callback) callback({ success: false, error: 'Only the room host can start the game' });
        return;
      }

      const startResult = found.room.startMatch(val.data?.settings);
      if (!startResult.success) {
        if (callback) callback({ success: false, error: startResult.error || 'Failed to start game' });
        return;
      }

      // Authoritative game:start emission tailored per recipient
      for (const p of found.room.getAllPlayersList()) {
        if (p.socketId) {
          const disruptorPeers =
            p.role === 'DISRUPTOR'
              ? found.room.getAllPlayersList().filter((other) => other.role === 'DISRUPTOR' && other.id !== p.id).map((other) => other.id)
              : undefined;

          io.to(p.socketId).emit('game:start', {
            role: p.role,
            disruptorPeers,
            assignedTasks: p.assignedTasks,
            settings: found.room.settings,
            yourPlayerId: p.id,
          });

          sendPlayerSyncState(io.sockets.sockets.get(p.socketId) as TypedSocket, found.room, p);
        }
      }

      broadcastSanitizedRoomState(io, found.room);
      if (callback) callback({ success: true, data: undefined });
    });

    // 6. player:move
    socket.on('player:move', (data) => {
      // Movement rate limiter: max 40 moves/sec per socket
      if (!rateLimiter.isAllowed(`move_${socket.id}`, 40, 1000)) {
        return;
      }

      const val = safeValidate(CLIENT_EVENT_SCHEMAS['player:move'], data);
      if (!val.success) return;

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) return;

      const result = found.room.handlePlayerMove(
        found.player.id,
        { x: val.data.x, y: val.data.y },
        val.data.timestamp,
        val.data.facing
      );

      if (result.valid) {
        socket.to(found.room.roomCode).emit('player:moved', {
          playerId: found.player.id,
          x: val.data.x,
          y: val.data.y,
          vx: val.data.vx,
          vy: val.data.vy,
          facing: val.data.facing,
          timestamp: val.data.timestamp,
        });
      }
    });

    // 7. task:interact
    socket.on('task:interact', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['task:interact'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleTaskInteract(found.player.id, val.data.taskId, val.data.action);
      if (callback) {
        if (res.success) {
          callback({ success: true, data: undefined });
        } else {
          callback({ success: false, error: res.error || 'Interact failed' });
        }
      }
    });

    // 8. task:complete
    socket.on('task:complete', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['task:complete'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleTaskComplete(found.player.id, val.data.taskId);
      if (callback) {
        if (res.success) {
          callback({ success: true, data: { percent: res.percent } });
        } else {
          callback({ success: false, error: res.error || 'Failed to complete task' });
        }
      }
    });

    // 9. sabotage:trigger
    socket.on('sabotage:trigger', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['sabotage:trigger'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleTriggerSabotage(
        found.player.id,
        val.data.sabotageType,
        val.data.targetRoom
      );

      if (callback) {
        if (res.success) {
          callback({ success: true, data: undefined });
        } else {
          callback({ success: false, error: res.error || 'Failed to trigger sabotage' });
        }
      }
    });

    // 10. sabotage:repair
    socket.on('sabotage:repair', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['sabotage:repair'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleRepairSabotage(
        found.player.id,
        val.data.sabotageType,
        val.data.stationId
      );

      if (callback) {
        if (res.success) {
          callback({ success: true, data: undefined });
        } else {
          callback({ success: false, error: res.error || 'Repair failed' });
        }
      }
    });

    // 11. kill:attempt
    socket.on('kill:attempt', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['kill:attempt'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleKillAttempt(found.player.id, val.data.targetPlayerId);
      if (callback) {
        if (res.success) {
          callback({ success: true, data: { killed: true } });
        } else {
          callback({ success: false, error: res.error || 'Kill attempt failed' });
        }
      }
    });

    // 12. report:body
    socket.on('report:body', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['report:body'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleReportBody(found.player.id, val.data.victimPlayerId);
      if (callback) {
        if (res.success) {
          callback({ success: true, data: undefined });
        } else {
          callback({ success: false, error: res.error || 'Report body failed' });
        }
      }
    });

    // 13. meeting:call
    socket.on('meeting:call', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['meeting:call'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleCallEmergencyMeeting(found.player.id);
      if (callback) {
        if (res.success) {
          callback({ success: true, data: undefined });
        } else {
          callback({ success: false, error: res.error || 'Failed to call emergency meeting' });
        }
      }
    });

    // 14. vote:cast
    socket.on('vote:cast', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['vote:cast'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleCastVote(found.player.id, val.data.votedPlayerId);
      if (callback) {
        if (res.success) {
          callback({ success: true, data: undefined });
        } else {
          callback({ success: false, error: res.error || 'Vote cast failed' });
        }
      }

      if (res.success) {
        const meeting = found.room.meetingManager.getCurrentMeeting();
        if (meeting) {
          const livingIds = found.room.getLivingPlayersList().map((p) => p.id);
          const remainingVoters = livingIds.filter((id) => !meeting.voters.includes(id));
          io.to(found.room.roomCode).emit('vote:update', {
            votedPlayerIds: meeting.voters,
            remainingVoters,
          });
        }
      }
    });

    // 15. vote:skip
    socket.on('vote:skip', (data, callback) => {
      const val = safeValidate(CLIENT_EVENT_SCHEMAS['vote:skip'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const res = found.room.handleSkipVote(found.player.id);
      if (callback) {
        if (res.success) {
          callback({ success: true, data: undefined });
        } else {
          callback({ success: false, error: res.error || 'Vote skip failed' });
        }
      }

      if (res.success) {
        const meeting = found.room.meetingManager.getCurrentMeeting();
        if (meeting) {
          const livingIds = found.room.getLivingPlayersList().map((p) => p.id);
          const remainingVoters = livingIds.filter((id) => !meeting.voters.includes(id));
          io.to(found.room.roomCode).emit('vote:update', {
            votedPlayerIds: meeting.voters,
            remainingVoters,
          });
        }
      }
    });

    // 16. chat:message
    socket.on('chat:message', (data, callback) => {
      if (!rateLimiter.isAllowed(`chat_${socket.id}`, 5, 3000)) {
        if (callback) callback({ success: false, error: 'Chat rate limit exceeded' });
        return;
      }

      const val = safeValidate(CLIENT_EVENT_SCHEMAS['chat:message'], data);
      if (!val.success) {
        if (callback) callback({ success: false, error: val.error });
        return;
      }

      const found = roomManager.getRoomBySocketId(socket.id);
      if (!found) {
        if (callback) callback({ success: false, error: 'Player not in room' });
        return;
      }

      const sender = found.player;
      const isDead = !sender.isAlive;
      const chatPayload: ChatMessageBroadcastPayload = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: sender.id,
        senderName: sender.name,
        senderColor: typeof sender.color === 'string' ? sender.color : 'cyan',
        text: val.data.text,
        timestamp: Date.now(),
        isDeadOnly: isDead,
      };

      // If dead, only route to dead players
      if (isDead) {
        for (const p of found.room.getAllPlayersList()) {
          if (!p.isAlive && p.socketId) {
            io.to(p.socketId).emit('chat:message', chatPayload);
          }
        }
      } else {
        io.to(found.room.roomCode).emit('chat:message', chatPayload);
      }

      if (callback) callback({ success: true, data: undefined });
    });

    // 17. disconnect
    socket.on('disconnect', () => {
      rateLimiter.reset(socket.id);
      rateLimiter.reset(`move_${socket.id}`);
      rateLimiter.reset(`chat_${socket.id}`);

      const found = roomManager.handleDisconnect(socket.id);
      if (found) {
        broadcastSanitizedRoomState(io, found.room);
      }
    });
  });
}
