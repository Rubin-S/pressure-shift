import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PROTOCOL_VERSION } from '@pressure-shift/shared';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', protocol: PROTOCOL_VERSION });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

server.listen(PORT, () => {
  console.log(`[PRESSURE SHIFT SERVER] running on port ${PORT} (Protocol v${PROTOCOL_VERSION})`);
});
