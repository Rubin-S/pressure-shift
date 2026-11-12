import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { createServerApp, ServerInstance } from '../app.js';
import { ClientToServerEvents, ServerToClientEvents } from '@pressure-shift/shared';

type TestClientSocket = ClientSocketType<ServerToClientEvents, ClientToServerEvents>;

describe('Socket.IO Handlers & Networking Integration Tests', () => {
  let serverInstance: ServerInstance;
  let serverPort: number;
  let client1: TestClientSocket;
  let client2: TestClientSocket;

  beforeAll(async () => {
    serverInstance = createServerApp();
    await new Promise<void>((resolve) => {
      // Listen on ephemeral port 0
      serverInstance.httpServer.listen(0, () => {
        const addr = serverInstance.httpServer.address();
        if (addr && typeof addr === 'object') {
          serverPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    await serverInstance.close();
  });

  it('connects client to server and handles room:create with valid ack and session token', async () => {
    client1 = ClientSocket(`http://localhost:${serverPort}`, {
      transports: ['websocket'],
      forceNew: true,
    }) as TestClientSocket;

    await new Promise<void>((resolve) => {
      client1.on('connect', () => resolve());
    });

    const createAck = await new Promise<any>((resolve) => {
      client1.emit(
        'room:create',
        {
          playerName: 'CaptainAlpha',
          color: 'neon_cyan',
          cosmetic: 'standard_helm',
        },
        (ack) => resolve(ack)
      );
    });

    expect(createAck.success).toBe(true);
    expect(createAck.data.roomCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(createAck.data.playerId).toBeDefined();
    expect(createAck.data.sessionToken).toBeDefined();

    const roomCode = createAck.data.roomCode;

    // Connect client2 and join room
    client2 = ClientSocket(`http://localhost:${serverPort}`, {
      transports: ['websocket'],
      forceNew: true,
    }) as TestClientSocket;

    await new Promise<void>((resolve) => {
      client2.on('connect', () => resolve());
    });

    const joinAck = await new Promise<any>((resolve) => {
      client2.emit(
        'room:join',
        {
          roomCode,
          playerName: 'DiverBeta',
          color: 'kelp_green',
        },
        (ack) => resolve(ack)
      );
    });

    expect(joinAck.success).toBe(true);
    expect(joinAck.data.roomCode).toBe(roomCode);
    expect(joinAck.data.isHost).toBe(false);
  });

  it('rejects malformed socket payload with Zod schema validation error', async () => {
    const invalidAck = await new Promise<any>((resolve) => {
      client1.emit(
        'room:join',
        // Missing roomCode and invalid payload structure
        { roomCode: 'invalid', playerName: '' } as any,
        (ack) => resolve(ack)
      );
    });

    expect(invalidAck.success).toBe(false);
    expect(invalidAck.error).toBeDefined();
  });

  it('enforces rate limits on socket chat messages', async () => {
    // Send 10 rapid messages
    let rejectedCount = 0;
    for (let i = 0; i < 10; i++) {
      const ack = await new Promise<any>((resolve) => {
        client1.emit('chat:message', { text: `Message ${i}` }, (res) => resolve(res));
      });
      if (!ack.success && /rate limit/i.test(ack.error || '')) {
        rejectedCount++;
      }
    }

    expect(rejectedCount).toBeGreaterThan(0);
  });
});
