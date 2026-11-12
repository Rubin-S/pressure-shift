# PRESSURE SHIFT 🌊⚓

> **Deep-Sea Multiplayer Social Deduction Game**  
> Built with TypeScript, Node.js, Express, Socket.IO, Phaser 3, and React 18.

---

## 🌊 Overview

**Pressure Shift** drops 4 to 10 players into the Hadal Research Facility *Nadir-7*, anchored 8,500 meters beneath the surface in the Mariana Trench. While the **Operators** scramble across 8 underwater sectors to repair failing systems and maintain life support, covert **Disruptors** sabotage station infrastructure, hunt crew members in the dark, and trigger catastrophic pressure collapses.

```
       ___________________________________________
      | [ Docking Cradle ] <---> [ Pressure Lab ] |
      |         |                       |         |
      | [ Hydroponics ]   <--->   [ Medical Bay ] |
      |         |                       |         |
      | [ Sonar Control ] <---> [ Thermal Plant ] |
      |___________________________________________|
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher

### 1. Installation
```bash
# Clone the repository and navigate to the project root
git clone <repo_url>
cd pressure-shift

# Install all workspace dependencies
npm install
```

### 2. Run in Development Mode
Runs both the authoritative backend (`apps/server`) and the Vite client (`apps/client`) concurrently:
```bash
npm run dev
```
- **Web Client**: [http://localhost:5173](http://localhost:5173)
- **Authoritative Game Server**: [http://localhost:3001](http://localhost:3001)

### 3. Build & Typecheck
```bash
# Compile shared types and bundles
npm run build

# Run TypeScript typechecks across all packages
npm run lint
```

### 4. Run Automated Tests
```bash
# Unit and integration test suites (Vitest)
npm test

# End-to-end multi-client simulation (Playwright)
npm run test:e2e
```

---

## 🕹️ Game Rules & Roles

### 🔬 Operators (Crew)
- Complete assigned maintenance tasks across the 8 facility sectors.
- Maintain the global **Station Equilibrium Meter** (all tasks complete = Operators win).
- Report dead divers (`[R]`) or hit the **Emergency Console** in the `docking_cradle` to initiate an Emergency Meeting.
- Intervene at damaged stations during critical sabotages before pressure failure kills everyone.

### 🩸 Disruptors (Infiltrators)
- Blend in with Operators and pretend to perform tasks.
- Ambush and eliminate isolated crew members (`[Q]` within 60 px).
- Trigger station-wide sabotages (`[M]`):
  - **Oxygen / Pressure Depletion**: 45s countdown requiring dual-terminal synchronization.
  - **Reactor Meltdown**: 45s critical thermal emergency.
  - **Communications Interference**: Jams player minimap and task beacons.
  - **Bulkhead Lockdown**: Traps players inside rooms for 10 seconds.
- Win by eliminating Operators until Disruptors equal or outnumber Operators, or allowing critical sabotage countdown to reach 0.

### 👻 Spectators (Ghosts)
- Killed or ejected players become translucent underwater ghosts.
- Can swim through walls and bulkheads.
- Continue completing maintenance tasks to help living Operators win.

---

## 🛠️ Mini-Games (8 Interactive Tasks)

1. **Sonar Calibration** (`sonar_control`): Align sine wave amplitude and frequency with target acoustic echo.
2. **Electrical Circuit** (`thermal_plant`): Connect 4 matching colored leads across terminal blocks.
3. **Pressure Valve Regulator** (`pressure_lab`): Hold hydrostatic slider inside turbulent green zone for 3 seconds.
4. **Power Grid Router** (`thermal_plant`): Toggle 3x3 breaker switches to route current from core to life support.
5. **Bio Sample Sort** (`hydroponics`): Classify glowing deep-sea algae and benthic specimens into test tubes.
6. **Sensor Alignment** (`observation_gallery`): Adjust Azimuth and Elevation crosshairs to lock onto deep trench beacon.
7. **Ballast Pump Purge** (`docking_cradle`): Rapid-pump hydraulic piston to equalize water ballast.
8. **Filtration Sieve Clear** (`medical_bay`): Drag hydrothermal silt particles out of the micro-mesh filter.

---

## 🏗️ Architecture & Monorepo Structure

```
pressure-shift/
├── packages/
│   └── shared/              # Pure domain models, Zod schemas, Socket.IO contracts
├── apps/
│   ├── server/              # Authoritative Node.js + Express + Socket.IO server
│   │   ├── src/rooms/       # In-memory RoomManager & 30s session recovery
│   │   ├── src/engine/      # Movement validation & anti-cheat boundary logic
│   │   ├── src/tasks/       # Authoritative task tracking & sabotage timers
│   │   └── src/voting/      # Meeting discussion & majority tally calculation
│   └── client/              # React 18 HUD + Phaser 3 Hadal Station Canvas
│       ├── src/game/        # Phaser scenes, tilemap collision, dynamic lighting
│       ├── src/ui/          # HUD, Lobby, Mini-games, Voting dialogs
│       ├── src/network/     # Socket.IO client event handling
│       └── src/audio/       # Web Audio API procedural sound engine
├── tests/                   # Vitest unit/integration tests & Playwright E2E
└── docs/                    # Architectural specs, multiplayer testing, and deployment
```

For in-depth architecture and design docs:
- [Architecture & Protocol Specification](docs/ARCHITECTURE.md)
- [Game Design & Task Mechanics](docs/GAME_DESIGN.md)
- [Multiplayer Testing Guide](docs/MULTIPLAYER_TESTING.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)

---

## 🧪 Verification & QA

- **Authoritative Validation**: All positions, kills, task interactions, and meeting votes are strictly validated on the server.
- **Zero-Knowledge Role Hiding**: Disruptor identities are never transmitted to Operators over WebSockets during active gameplay.
- **Automated Multi-Client Playwright Tests**: Simulates 4 concurrent browser instances joining lobbies, moving, interacting, voting, and triggering game over states.

---

## 📄 License
MIT
