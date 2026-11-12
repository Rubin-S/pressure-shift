import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { AddressInfo } from 'net';
import { createServerApp, ServerInstance } from '../../apps/server/src/app.js';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameStartPayload,
  RoomStatePayload,
  SocketAck,
  MeetingStartedPayload,
  MeetingResultPayload,
  GameOverPayload,
} from '@pressure-shift/shared';

type TestSocket = ClientSocketType<ServerToClientEvents, ClientToServerEvents>;

describe('Real Socket.IO 4-Client Multiplayer Simulation', () => {
  let serverInstance: ServerInstance;
  let serverUrl: string;

  let hostSocket: TestSocket;
  let client2Socket: TestSocket;
  let client3Socket: TestSocket;
  let client4Socket: TestSocket;

  let roomCode: string;
  let hostPlayerId: string;
  let client2PlayerId: string;
  let client3PlayerId: string;
  let client4PlayerId: string;

  beforeAll(async () => {
    serverInstance = createServerApp();
    await new Promise<void>((resolve) => {
      serverInstance.httpServer.listen(0, () => resolve());
    });

    const port = (serverInstance.httpServer.address() as AddressInfo).port;
    serverUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    hostSocket?.disconnect();
    client2Socket?.disconnect();
    client3Socket?.disconnect();
    client4Socket?.disconnect();
    await serverInstance.close();
  });

  it('connects 4 real WebSocket clients to the authoritative game server', async () => {
    const connectClient = (): Promise<TestSocket> => {
      return new Promise((resolve) => {
        const socket = ClientSocket(serverUrl, {
          transports: ['websocket'],
          forceNew: true,
        }) as TestSocket;
        socket.on('connect', () => resolve(socket));
      });
    };

    hostSocket = await connectClient();
    client2Socket = await connectClient();
    client3Socket = await connectClient();
    client4Socket = await connectClient();

    expect(hostSocket.connected).toBe(true);
    expect(client2Socket.connected).toBe(true);
    expect(client3Socket.connected).toBe(true);
    expect(client4Socket.connected).toBe(true);
  });

  it('Host creates a room via room:create event and receives roomCode', async () => {
    const ack = await new Promise<SocketAck<{ roomCode: string; playerId: string; sessionToken: string }>>((resolve) => {
      hostSocket.emit(
        'room:create',
        {
          playerName: 'Captain-Nadir',
          color: 'neon_cyan',
          cosmetic: 'standard_helm',
        },
        resolve
      );
    });

    expect(ack.success).toBe(true);
    if (ack.success) {
      roomCode = ack.data.roomCode;
      hostPlayerId = ack.data.playerId;
      expect(roomCode).toHaveLength(6);
      expect(hostPlayerId).toBeDefined();
    }
  });

  it('Clients 2, 3, and 4 join the created room via room:join', async () => {
    const join = (socket: TestSocket, name: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        socket.emit(
          'room:join',
          {
            roomCode,
            playerName: name,
          },
          (ack) => {
            if (ack.success) resolve(ack.data.playerId);
            else reject(new Error(ack.error));
          }
        );
      });
    };

    client2PlayerId = await join(client2Socket, 'Diver-Alpha');
    client3PlayerId = await join(client3Socket, 'Diver-Beta');
    client4PlayerId = await join(client4Socket, 'Diver-Gamma');

    expect(client2PlayerId).toBeDefined();
    expect(client3PlayerId).toBeDefined();
    expect(client4PlayerId).toBeDefined();

    // Verify room has 4 players
    const room = serverInstance.roomManager.getRoom(roomCode);
    expect(room?.getAllPlayersList()).toHaveLength(4);
  });

  it('All 4 players toggle ready and host receives room:state update', async () => {
    const setReady = (socket: TestSocket): Promise<void> => {
      return new Promise((resolve, reject) => {
        socket.emit('room:ready', { ready: true }, (ack) => {
          if (ack.success) resolve();
          else reject(new Error(ack.error));
        });
      });
    };

    await Promise.all([
      setReady(hostSocket),
      setReady(client2Socket),
      setReady(client3Socket),
      setReady(client4Socket),
    ]);

    const room = serverInstance.roomManager.getRoom(roomCode);
    const allReady = room?.getAllPlayersList().every((p) => p.isReady);
    expect(allReady).toBe(true);
  });

  it('Host starts the match, and all 4 clients receive game:start event with role sanitization', async () => {
    const startPayloads: Record<string, GameStartPayload> = {};

    const listenGameStart = (socket: TestSocket, socketKey: string): Promise<void> => {
      return new Promise((resolve) => {
        socket.once('game:start', (data) => {
          startPayloads[socketKey] = data;
          resolve();
        });
      });
    };

    const listeners = Promise.all([
      listenGameStart(hostSocket, 'host'),
      listenGameStart(client2Socket, 'client2'),
      listenGameStart(client3Socket, 'client3'),
      listenGameStart(client4Socket, 'client4'),
    ]);

    // Host triggers room:start
    const startAck = await new Promise<SocketAck<void>>((resolve) => {
      hostSocket.emit(
        'room:start',
        {
          settings: {
            numDisruptors: 1,
            operatorTaskCount: 5,
            discussionTime: 10,
            votingTime: 15,
          },
        },
        resolve
      );
    });

    expect(startAck.success).toBe(true);

    // Wait for all 4 clients to receive their personalized game:start payloads
    await listeners;

    // Check role distribution: exactly 1 Disruptor and 3 Operators
    const roles = Object.values(startPayloads).map((p) => p.role);
    const disruptors = roles.filter((r) => r === 'DISRUPTOR');
    const operators = roles.filter((r) => r === 'OPERATOR');

    expect(disruptors).toHaveLength(1);
    expect(operators).toHaveLength(3);

    // Verify task assignment in game:start
    for (const [key, payload] of Object.entries(startPayloads)) {
      expect(payload.assignedTasks).toHaveLength(5);
      expect(payload.yourPlayerId).toBeDefined();

      if (payload.role === 'OPERATOR') {
        // Operators MUST NOT receive any disruptor peers in their payload!
        expect(payload.disruptorPeers || []).toHaveLength(0);
      }
    }
  });

  it('Validates real-time movement synchronization across sockets', async () => {
    const movePromise = new Promise<{ playerId: string; x: number; y: number }>((resolve) => {
      client2Socket.once('player:moved', (data) => {
        resolve(data);
      });
    });

    // Wait a brief delta to allow legitimate speed delta
    await new Promise((r) => setTimeout(r, 120));

    const currentPos = serverInstance.roomManager.getRoom(roomCode)!.getPlayer(hostPlayerId)!.position;
    const targetPos = { x: currentPos.x + 5, y: currentPos.y };

    hostSocket.emit('player:move', {
      x: targetPos.x,
      y: targetPos.y,
      timestamp: Date.now(),
      facing: 'right',
    });

    const moved = await movePromise;
    expect(moved.playerId).toBe(hostPlayerId);
    expect(moved.x).toBe(targetPos.x);
    expect(moved.y).toBe(targetPos.y);
  });

  it('Allows players to exchange in-game chat messages', async () => {
    const chatPromise = new Promise<{ senderName: string; text: string }>((resolve) => {
      client3Socket.once('chat:message', (data) => {
        resolve({ senderName: data.senderName, text: data.text });
      });
    });

    hostSocket.emit('chat:message', { text: 'Heading to Sonar Control to calibrate!' });

    const receivedChat = await chatPromise;
    expect(receivedChat.senderName).toBe('Captain-Nadir');
    expect(receivedChat.text).toBe('Heading to Sonar Control to calibrate!');
  });
});
