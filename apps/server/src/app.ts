import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  PROTOCOL_VERSION,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@pressure-shift/shared';
import { RoomManager } from './game/room-manager.js';
import { RateLimiter } from './rate-limiter.js';
import { registerSocketHandlers } from './socket/handlers.js';

export interface ServerInstance {
  app: express.Application;
  httpServer: http.Server;
  io: Server<ClientToServerEvents, ServerToClientEvents>;
  roomManager: RoomManager;
  rateLimiter: RateLimiter;
  close: () => Promise<void>;
}

export function createServerApp(): ServerInstance {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const httpServer = http.createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const roomManager = new RoomManager();
  const rateLimiter = new RateLimiter();

  // Register HTTP Routes
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      protocol: PROTOCOL_VERSION,
      rooms: roomManager.getAllRooms().length,
      timestamp: Date.now(),
    });
  });

  app.get('/api/rooms', (_req, res) => {
    const list = roomManager.getAllRooms().map((r) => ({
      roomCode: r.roomCode,
      state: r.state,
      playersCount: r.players.size,
      maxPlayers: 10,
    }));
    res.json({ rooms: list });
  });

  // Register Socket.IO Handlers
  registerSocketHandlers(io, roomManager, rateLimiter);

  // Serve static client build if present (Unified Single-Service Deployment for Render/Railway/Fly.io/Docker)
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  const close = async (): Promise<void> => {
    rateLimiter.destroy();
    for (const room of roomManager.getAllRooms()) {
      room.destroy();
    }
    return new Promise<void>((resolve, reject) => {
      io.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  };

  return {
    app,
    httpServer,
    io,
    roomManager,
    rateLimiter,
    close,
  };
}
