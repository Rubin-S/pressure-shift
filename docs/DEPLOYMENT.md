# Pressure Shift: Production Deployment & Operations Guide

## 1. Overview

Pressure Shift is packaged for cloud or bare-metal production environments with:
- **Node.js 20+** backend powering authoritative WebSocket connections via Socket.IO.
- **Vite-built static assets** for the React 18 + Phaser 3 frontend.
- Monorepo package bundling using TypeScript compilation (`npm run build`).

---

## 2. Production Build Workflow

Before deploying, build all packages and workspaces:
```bash
# 1. Install all dependencies
npm ci

# 2. Build shared contracts, server, and client bundles
npm run build

# 3. Verify type safety across the entire monorepo
npm run lint

# 4. Run test suites
npm test
```

Build outputs:
- Shared package: `packages/shared/dist/`
- Game Server: `apps/server/dist/`
- Web Client: `apps/client/dist/`

---

## 3. Environment Configuration

### 3.1 Server Environment Variables (`apps/server/.env`)
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3001` | Listening port for Express + Socket.IO |
| `NODE_ENV` | `production` | Execution mode (`development` or `production`) |
| `CORS_ORIGIN` | `*` | Allowed client origins (e.g. `https://pressureshift.example.com`) |
| `MAX_ROOMS` | `100` | Maximum concurrent rooms on this server instance |
| `SESSION_TIMEOUT_MS` | `30000` | Reconnect grace window before removing disconnected player |
| `TICK_RATE` | `20` | Server state broadcast tick rate (Hz) |

### 3.2 Client Environment Variables (`apps/client/.env`)
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_SERVER_URL` | `http://localhost:3001` | Socket.IO server target endpoint |

---

## 4. Containerization (Docker)

Multi-stage `Dockerfile` for deploying a unified full-stack or microservices deployment:

```dockerfile
# Multi-stage production container
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/
COPY apps/client/package*.json ./apps/client/

RUN npm ci

COPY . .

RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/client/dist ./apps/server/public

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
```

---

## 5. Reverse Proxy Configuration (Nginx)

For HTTPS and WebSocket proxying:

```nginx
server {
    listen 80;
    server_name pressureshift.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pressureshift.example.com;

    ssl_certificate /etc/letsencrypt/live/pressureshift.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pressureshift.example.com/privkey.pem;

    # Serve built frontend static files
    location / {
        root /var/www/pressure-shift/apps/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket & API reverse proxy to Node.js
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 6. High Availability & Scaling

For horizontal scaling across multiple game server nodes:
1. **Socket.IO Redis Adapter**: Attach `@socket.io/redis-adapter` to distribute room messages across multiple server nodes.
2. **Sticky Sessions**: Configure load balancer (e.g. AWS ALB, Cloudflare, or Nginx `ip_hash`) to route WebSocket handshakes from the same client to the same backend pod.
3. **Health Check Endpoint**: `/health` returning `{ status: "ok", activeRooms: N, connectedPlayers: M }`.
