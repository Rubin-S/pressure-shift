# Pressure Shift: System Architecture & Technical Specification

## 1. System Overview

**Pressure Shift** is a real-time, top-down multiplayer underwater social deduction game engineered as a modern monorepo. Set in the crushing depths of the Hadal Research Station *Nadir-7*, players are divided into research **Operators** attempting to maintain life support and covert **Disruptors** sabotaging station integrity.

```mermaid
graph TD
    Client1["Browser Client 1 (Host)<br>React 18 + Phaser 3"] <-->|Socket.IO (WSS)| Server["Authoritative Game Server<br>Node.js + Express + Socket.IO"]
    Client2["Browser Client 2 (Operator)<br>React 18 + Phaser 3"] <-->|Socket.IO (WSS)| Server
    Client3["Browser Client 3 (Disruptor)<br>React 18 + Phaser 3"] <-->|Socket.IO (WSS)| Server
    Client4["Browser Client 4 (Spectator)<br>React 18 + Phaser 3"] <-->|Socket.IO (WSS)| Server
    Server --> Shared["@pressure-shift/shared<br>Schemas, Types, State Machines"]
    Client1 --> Shared
    Client2 --> Shared
    Client3 --> Shared
    Client4 --> Shared
```

---

## 2. Monorepo Organization

```
pressure-shift/
├── packages/
│   └── shared/                 # Shared domain models, contracts, schemas & utilities
│       ├── src/
│       │   ├── types/          # Player, Room, Task, Sabotage, Meeting types
│       │   ├── schemas/        # Strict Zod schemas for all client network inputs
│       │   ├── constants/      # Physics limits, room boundaries, audio configs
│       │   └── utils/          # Pure validation, state-machine transition helpers
│       └── package.json
├── apps/
│   ├── server/                 # Authoritative game server
│   │   ├── src/
│   │   │   ├── rooms/          # In-memory RoomManager, session recovery
│   │   │   ├── engine/         # Movement validation, collision bounding, role assignment
│   │   │   ├── tasks/          # Task progression tracker & sabotage timers
│   │   │   ├── voting/         # Discussion, ballot calculation, tie-breaking, ejection
│   │   │   └── sockets/        # Socket.IO connection handlers & sanitization dispatch
│   │   └── package.json
│   └── client/                 # Client application
│       ├── src/
│       │   ├── game/           # Phaser 3 engine: Station map, lighting, collisions, sprites
│       │   ├── ui/             # React 18 HUD: Lobby, Modals, Voting, Minigames, Game Over
│       │   ├── network/        # Socket.IO typed client, reconnect logic
│       │   └── audio/          # Web Audio API procedural sound engine
│       └── package.json
├── tests/                      # Verification suite: Vitest unit/integration & Playwright E2E
├── docs/                       # Complete architecture, design, and operational manuals
└── package.json                # Monorepo workspace configuration
```

---

## 3. Authoritative Server Architecture

### 3.1 Trust Boundary & Anti-Cheat
The server retains **strict authority** over all game state:
1. **Movement & Position Verification**: Clients broadcast desired movement vectors or tick checkpoints (`player:move`). The server computes time deltas ($\Delta t$) and verifies player speed does not exceed the hydrodynamic maximum ($v \le v_{\max}$). Teleportation and boundary clipping are rejected.
2. **Proximity Gates**:
   - **Kill Command**: Verified on server: initiator must be a live Disruptor, kill cooldown must be $0$, and Euclidean distance to target must be $\le 60\text{ px}$.
   - **Task Interaction**: Player must be within interact distance ($\le 75\text{ px}$) of the target terminal coordinates.
   - **Body Report**: Dead body entity must exist and be within discovery radius ($\le 85\text{ px}$) of the reporting player.
3. **Role Data Isolation (Zero-Knowledge Payloads)**:
   - When game starts, each socket receives a personalized state sync.
   - Operators receive **no** Disruptor identities in `game:start` or `sync:state`.
   - Only Disruptors receive the array of fellow Disruptors.
   - Only after `GAME_OVER` or when role confirmation is triggered upon ejection are roles broadcasted to all participants.

### 3.2 State Machine Lifecycle

```mermaid
stateDiagram-v2
    [*] --> LOBBY: Room Created
    LOBBY --> STARTING: Host triggers start (countdown)
    STARTING --> PLAYING: Roles & Tasks assigned
    PLAYING --> MEETING: Dead body reported OR Emergency button pressed
    MEETING --> VOTING_RESULTS: Discussion & Voting timer ends / All votes cast
    VOTING_RESULTS --> PLAYING: Player ejected / Tie / Skip (Game continues)
    VOTING_RESULTS --> GAME_OVER: Win condition met (Disruptors eliminated or equal)
    PLAYING --> GAME_OVER: All Tasks 100% OR Critical Sabotage countdown reaches 0
    GAME_OVER --> LOBBY: Host selects Play Again
```

---

## 4. World & Map Design: Hadal Station Nadir-7

The facility layout consists of 8 interconnected underwater modules:

| Sector ID | Room Name | Interactive Consoles | Primary Systems |
| :--- | :--- | :--- | :--- |
| `docking_cradle` | Submersible Dock & Airflow | Airlock Control, Ballast Valve | Spawn point, emergency button |
| `sonar_control` | Deep Acoustic Array | Sonar Calibrator, Hydrophone Grid | Active scanning, navigation |
| `hydroponics` | High-Pressure Bio-Dome | Bio Sample Classifier, Algae Feeder | Food production, oxygen scrubbers |
| `pressure_lab` | Hydrostatic Testing Chamber | Pressure Valve Regulator | Hull stress diagnostics |
| `thermal_plant` | Geothermal Vent Generator | Thermal Grid Router, Core Injector | Power generation |
| `communications` | Trans-Oceanic Relay | Sub-wave Frequency Tuner | External contact, CCTV |
| `observation_gallery` | Abyssal Trench Overlook | Optical Sensor Alignment Dial | Trench exploration |
| `medical_bay` | Hyperbaric Decompression Unit | Vital Scanner, Filtration Sieve | Emergency treatment, quarantine |

---

## 5. Network Protocol & Event Matrix

### 5.1 Client to Server Events (`ClientToServerEvents`)
| Event | Payload Type | Description |
| :--- | :--- | :--- |
| `room:create` | `{ hostName, settings }` | Creates a new lobby with a unique 6-character code |
| `room:join` | `{ roomCode, playerName, cosmetic }` | Joins an existing lobby |
| `room:leave` | `{}` | Gracefully leaves room |
| `room:ready` | `{ isReady: boolean }` | Toggles player ready state |
| `room:start` | `{}` | Host initiates countdown to game start |
| `player:move` | `{ x, y, vx, vy, timestamp }` | Client movement input vector |
| `task:interact` | `{ taskId }` | Opens interaction with a task station |
| `task:complete` | `{ taskId, completionProof? }` | Submits task completion |
| `sabotage:trigger`| `{ sabotageId }` | Disruptor activates station sabotage |
| `sabotage:repair` | `{ sabotageId, terminalId }` | Player contributes to repair of critical sabotage |
| `kill:attempt` | `{ targetPlayerId }` | Disruptor executes nearby operator |
| `report:body` | `{ bodyId }` | Triggers emergency meeting from dead diver |
| `meeting:call` | `{}` | Triggers emergency meeting via Docking button |
| `vote:cast` | `{ targetPlayerId: string \| null }` | Casts vote for player or skip (`null`) |
| `chat:message` | `{ text }` | Meeting chat message |

### 5.2 Server to Client Events (`ServerToClientEvents`)
| Event | Payload Type | Description |
| :--- | :--- | :--- |
| `room:state` | `RoomState` | Full lobby/room metadata update |
| `room:error` | `{ code, message }` | Action rejection / error notification |
| `game:start` | `PlayerRoleAssignment` | Sanitized game start event with individual role & tasks |
| `player:joined` | `PlayerSummary` | New diver entered room |
| `player:left` | `{ playerId, reason }` | Diver disconnected or left |
| `player:moved` | `PlayerMovementSnapshot` | Broadcast movement updates for interpolation |
| `task:progress` | `{ totalCompleted, totalTasks, percentage }` | Global task bar progression |
| `sabotage:active`| `ActiveSabotageState` | Alarm state, countdown timer, affected systems |
| `sabotage:cleared`| `{ sabotageId }` | Sabotage neutralized notification |
| `player:killed` | `{ victimId, bodyPosition }` | Diver killed notification, leaves body on map |
| `meeting:started`| `MeetingDetails` | Discussion phase begins with caller & reason |
| `vote:update` | `{ voterId, hasVoted }` | Confirms vote without revealing target if anonymous |
| `meeting:result` | `MeetingResult` | Voting tally, ejected player, and role (if enabled) |
| `game:over` | `GameOverSummary` | Final winner (Operators/Disruptors), reason, full role reveal |

---

## 6. Client Architecture & Rendering Pipeline

1. **Phaser 3 Canvas Layer**:
   - Renders 60 FPS station tiles, dynamic water light refraction, player sprites with underwater swimming physics, collision boundaries, and visibility field-of-view (fog of war).
   - Coordinates with React via a decoupled Event Bus (`EventBus.ts`).
2. **React 18 Overlay & HUD**:
   - Manages top-level game state, UI dialogs, interactive mini-game screens, meeting discussion UI, and audio controls.
   - Zero DOM overhead during core traversal: React only renders the HUD overlay and modals.
3. **Web Audio Synthesizer**:
   - Procedural sound synthesis using the Web Audio API: Sonar pulse pings, hydrophone hum, emergency sirens, diving suit breathing ambience, and button clicks. Zero external asset dependencies.
