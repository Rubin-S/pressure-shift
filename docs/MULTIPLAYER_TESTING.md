# Pressure Shift: Multiplayer Testing & QA Guide

This guide details procedures for running, debugging, and testing multiplayer sessions of Pressure Shift, covering both manual multi-client workflows and automated verification suites.

---

## 1. Quick Local Multiplayer Testing (Manual)

To test a live 4+ player session on a single developer workstation:

### Step 1: Start the Development Server & Client
From the project root:
```bash
npm run dev
```
This starts:
- Authoritative Game Server on `http://localhost:3001`
- Vite Client on `http://localhost:5173`

### Step 2: Open Multiple Isolated Browser Contexts
Because local storage or session tokens isolate players, open separate browser windows:
1. **Host Client**: Open `http://localhost:5173` in a standard browser window (e.g. Chrome).
   - Enter name: `Captain-Nadir`
   - Select Suit Color: `Cyan`
   - Click **Create Facility Room**. Note the 6-character room code (e.g., `AB12CD`).
2. **Client 2 (Operator)**: Open an **Incognito / Private Window**.
   - Navigate to `http://localhost:5173`.
   - Enter name: `Diver-Alpha`
   - Select Suit Color: `Amber`
   - Enter the room code and click **Join Room**.
3. **Client 3 (Disruptor / Operator)**: Open a second browser (e.g. Firefox or Chrome Guest profile).
   - Navigate to `http://localhost:5173`.
   - Enter name: `Diver-Beta`
   - Select Suit Color: `Ruby`
   - Enter the room code and join.
4. **Client 4 (Disruptor / Operator)**: Open another isolated tab/window.
   - Enter name: `Diver-Gamma`
   - Select Suit Color: `Emerald`
   - Enter the room code and join.

### Step 3: Start the Match
- In the Host lobby view, ensure all players have marked **Ready** (or toggle force ready in dev settings).
- Click **Start Mission**.
- Roles are authoritatively distributed: Disruptors receive red HUD markers and kill/sabotage buttons; Operators receive standard cyan task lists.

---

## 2. Automated Testing Suite

The testing infrastructure includes unit tests, integration tests, and Playwright end-to-end multi-client simulations.

### 2.1 Running Unit & Integration Tests (Vitest)
```bash
# Run all unit and integration test suites
npm test

# Run tests in watch mode
npm run test:watch
```

### 2.2 Test Suite Matrix

| Test Suite | File | What It Covers |
| :--- | :--- | :--- |
| **Contracts & Validation** | `tests/unit/contracts.test.ts` | Validates Zod input schemas for room creation, movement bounds, voting, and sabotage inputs. |
| **Room Lifecycle** | `tests/integration/room-lifecycle.test.ts` | Creation, joining, leave, host migration, disconnect grace periods, and ready states. |
| **Role Distribution & Anti-Cheat** | `tests/integration/role-distribution.test.ts` | Verifies random role distribution, correct disruptor counts, and **strictly ensures zero role leaks** to Operators. |
| **Movement & Boundaries** | `tests/integration/movement-collision.test.ts` | Server-authoritative speed checking ($v \le v_{\max}$), out-of-bounds rejection, delta time pacing. |
| **Tasks & Sabotages** | `tests/integration/tasks-sabotage.test.ts` | Task completion increments, 100% completion win trigger, sabotage countdown, repair protocols. |
| **Meetings & Voting** | `tests/integration/meetings-voting.test.ts` | Emergency button cooldowns, body reporting, tie-breaks, skip votes, majority ejections, role confirmation. |
| **Win Conditions** | `tests/integration/win-conditions.test.ts` | All Disruptors ejected, Tasks 100%, Disruptor-to-Operator parity, and Sabotage timer expiration. |

---

## 3. Playwright Multi-Client E2E Simulation

Playwright automates 4 concurrent browser sessions interacting with the live server.

### Running E2E Tests:
```bash
npm run test:e2e
```

### Simulated E2E Scenario:
1. **Browser 1 (Host)** launches, creates room `E2ETST`.
2. **Browsers 2, 3, 4** launch concurrently and join `E2ETST`.
3. Host initiates countdown; all 4 clients transition into `PLAYING` state.
4. Clients move to respective task stations.
5. Disruptor triggers a sabotage; Operators navigate to the station to resolve it.
6. A player calls an Emergency Meeting.
7. All 4 clients receive the meeting state, vote, and verify the ejection sequence.

---

## 4. Network Simulation & Chaos Testing

To test latency and packet drops:
- In Chrome DevTools > Network tab > Throttle: select **Slow 3G** or custom 200ms latency.
- Disconnect simulation: Toggle **Offline** for 10 seconds. The client enters reconnect mode with an overlay. Upon re-enabling network, the authoritative server resumes the session using the 30-second token grace window.
