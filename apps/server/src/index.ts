import { PROTOCOL_VERSION } from '@pressure-shift/shared';
import { createServerApp } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const instance = createServerApp();

instance.httpServer.listen(PORT, () => {
  console.log(`[PRESSURE SHIFT SERVER] Authoritative game server listening on port ${PORT} (Protocol v${PROTOCOL_VERSION})`);
});

// Graceful shutdown handling
const shutdown = async () => {
  console.log('[PRESSURE SHIFT SERVER] Shutting down...');
  await instance.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { createServerApp };
