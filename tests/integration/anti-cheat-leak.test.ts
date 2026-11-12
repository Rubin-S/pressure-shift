import { describe, it, expect } from 'vitest';
import {
  sanitizePlayerForClient,
  sanitizePlayerRosterForClient,
  validateSpeedDelta,
  isWithinRadius,
  PlayerPrivateView,
  DEFAULT_ROOM_SETTINGS,
  GAMEPLAY_CONSTANTS,
} from '@pressure-shift/shared';

describe('Anti-Cheat & Role Data Leak Prevention', () => {
  const mockPlayers: PlayerPrivateView[] = [
    {
      id: 'p-op-1',
      name: 'Alice (Operator)',
      color: 'neon_cyan',
      cosmetic: 'standard_helm',
      role: 'OPERATOR',
      isAlive: true,
      isReady: true,
      position: { x: 100, y: 100 },
      facing: 'right',
      currentRoom: 'docking_cradle',
      isHost: true,
      connected: true,
      sessionToken: 'token-alice-12345',
      killCooldownRemaining: 0,
    },
    {
      id: 'p-op-2',
      name: 'Bob (Operator)',
      color: 'kelp_green',
      cosmetic: 'biologist_goggles',
      role: 'OPERATOR',
      isAlive: true,
      isReady: true,
      position: { x: 150, y: 120 },
      facing: 'down',
      currentRoom: 'docking_cradle',
      isHost: false,
      connected: true,
      sessionToken: 'token-bob-23456',
      killCooldownRemaining: 0,
    },
    {
      id: 'p-disruptor-1',
      name: 'Charlie (Disruptor)',
      color: 'coral_red',
      cosmetic: 'welding_mask',
      role: 'DISRUPTOR',
      isAlive: true,
      isReady: true,
      position: { x: 200, y: 100 },
      facing: 'left',
      currentRoom: 'docking_cradle',
      isHost: false,
      connected: true,
      sessionToken: 'token-charlie-34567',
      killCooldownRemaining: 25,
    },
    {
      id: 'p-disruptor-2',
      name: 'Dave (Disruptor)',
      color: 'abyss_black',
      cosmetic: 'hazard_rebreather',
      role: 'DISRUPTOR',
      isAlive: true,
      isReady: true,
      position: { x: 500, y: 400 },
      facing: 'up',
      currentRoom: 'thermal_plant',
      isHost: false,
      connected: true,
      sessionToken: 'token-dave-45678',
      killCooldownRemaining: 25,
    },
  ];

  describe('Zero-Knowledge Role Hiding', () => {
    it('CRITICAL: Ordinary Operator NEVER receives other players roles in serialized payloads', () => {
      const viewerId = 'p-op-1'; // Alice
      const viewerRole = 'OPERATOR';

      const sanitizedRoster = sanitizePlayerRosterForClient(mockPlayers, viewerId, viewerRole, false);

      // Alice can see her own role
      const aliceView = sanitizedRoster.find((p) => p.id === 'p-op-1');
      expect(aliceView?.role).toBe('OPERATOR');

      // Alice MUST NOT see Bob's role
      const bobView = sanitizedRoster.find((p) => p.id === 'p-op-2');
      expect(bobView?.role).toBeUndefined();

      // Alice MUST NOT see Charlie's Disruptor role!
      const charlieView = sanitizedRoster.find((p) => p.id === 'p-disruptor-1');
      expect(charlieView?.role).toBeUndefined();

      // Alice MUST NOT see Dave's Disruptor role!
      const daveView = sanitizedRoster.find((p) => p.id === 'p-disruptor-2');
      expect(daveView?.role).toBeUndefined();
    });

    it('Disruptors can see fellow Disruptors, but not Operator roles', () => {
      const viewerId = 'p-disruptor-1'; // Charlie
      const viewerRole = 'DISRUPTOR';

      const sanitizedRoster = sanitizePlayerRosterForClient(mockPlayers, viewerId, viewerRole, false);

      // Charlie sees own role
      const charlieView = sanitizedRoster.find((p) => p.id === 'p-disruptor-1');
      expect(charlieView?.role).toBe('DISRUPTOR');

      // Charlie sees Dave is a fellow Disruptor
      const daveView = sanitizedRoster.find((p) => p.id === 'p-disruptor-2');
      expect(daveView?.role).toBe('DISRUPTOR');

      // Charlie does NOT see Operator roles explicitly leaked
      const aliceView = sanitizedRoster.find((p) => p.id === 'p-op-1');
      expect(aliceView?.role).toBeUndefined();
      const bobView = sanitizedRoster.find((p) => p.id === 'p-op-2');
      expect(bobView?.role).toBeUndefined();
    });

    it('Spectators can see all roles to enjoy ghost spectating', () => {
      const viewerId = 'ghost-spectator';
      const viewerRole = 'SPECTATOR';

      const sanitizedRoster = sanitizePlayerRosterForClient(mockPlayers, viewerId, viewerRole, false);

      expect(sanitizedRoster.find((p) => p.id === 'p-op-1')?.role).toBe('OPERATOR');
      expect(sanitizedRoster.find((p) => p.id === 'p-op-2')?.role).toBe('OPERATOR');
      expect(sanitizedRoster.find((p) => p.id === 'p-disruptor-1')?.role).toBe('DISRUPTOR');
      expect(sanitizedRoster.find((p) => p.id === 'p-disruptor-2')?.role).toBe('DISRUPTOR');
    });

    it('Reveals all player roles universally upon Game Over', () => {
      const viewerId = 'p-op-1'; // Operator
      const viewerRole = 'OPERATOR';

      // isGameOver = true
      const gameOverRoster = sanitizePlayerRosterForClient(mockPlayers, viewerId, viewerRole, true);

      expect(gameOverRoster.find((p) => p.id === 'p-op-1')?.role).toBe('OPERATOR');
      expect(gameOverRoster.find((p) => p.id === 'p-op-2')?.role).toBe('OPERATOR');
      expect(gameOverRoster.find((p) => p.id === 'p-disruptor-1')?.role).toBe('DISRUPTOR');
      expect(gameOverRoster.find((p) => p.id === 'p-disruptor-2')?.role).toBe('DISRUPTOR');
    });

    it('Sanitizes private credentials (sessionToken, killCooldown) from all public views', () => {
      const viewerId = 'p-op-1';
      const sanitized = sanitizePlayerForClient(mockPlayers[0], viewerId, 'OPERATOR');

      // Expect sessionToken and killCooldownRemaining to be stripped from public view
      expect((sanitized as Record<string, unknown>).sessionToken).toBeUndefined();
      expect((sanitized as Record<string, unknown>).killCooldownRemaining).toBeUndefined();
    });
  });

  describe('Movement & Physics Anti-Cheat Validation', () => {
    const baseSpeed = DEFAULT_ROOM_SETTINGS.playerSpeed; // 200 px/sec
    const tolerance = GAMEPLAY_CONSTANTS.SPEED_TOLERANCE_MULTIPLIER; // 1.35x

    it('allows normal movement within speed boundaries', () => {
      const from = { x: 100, y: 100 };
      // 100ms delta -> normal distance: 200 * 0.1 = 20px. max with 1.35x = 27px.
      const legitimateTo = { x: 120, y: 100 }; // 20px
      expect(validateSpeedDelta(from, legitimateTo, 100, baseSpeed, tolerance)).toBe(true);
    });

    it('allows movement with network jitter within tolerance', () => {
      const from = { x: 100, y: 100 };
      const jitteredTo = { x: 126, y: 100 }; // 26px <= 27px
      expect(validateSpeedDelta(from, jitteredTo, 100, baseSpeed, tolerance)).toBe(true);
    });

    it('rejects instantaneous teleportation / speed-hack movement', () => {
      const from = { x: 100, y: 100 };
      const speedHackedTo = { x: 250, y: 100 }; // 150px in 100ms -> 1500 px/sec!
      expect(validateSpeedDelta(from, speedHackedTo, 100, baseSpeed, tolerance)).toBe(false);
    });

    it('rejects delta times that are non-positive or corrupted', () => {
      const from = { x: 100, y: 100 };
      const to = { x: 105, y: 100 };
      expect(validateSpeedDelta(from, to, 0, baseSpeed, tolerance)).toBe(false);
      expect(validateSpeedDelta(from, to, -50, baseSpeed, tolerance)).toBe(false);
    });
  });

  describe('Action Proximity Validation', () => {
    it('verifies kill attempts must be within 75px radius', () => {
      const killerPos = { x: 200, y: 200 };
      const closeVictimPos = { x: 250, y: 200 }; // 50px away
      const farVictimPos = { x: 300, y: 200 }; // 100px away

      expect(isWithinRadius(killerPos, closeVictimPos, GAMEPLAY_CONSTANTS.KILL_DISTANCE)).toBe(true);
      expect(isWithinRadius(killerPos, farVictimPos, GAMEPLAY_CONSTANTS.KILL_DISTANCE)).toBe(false);
    });

    it('verifies dead body reports must be within 85px radius', () => {
      const reporterPos = { x: 300, y: 300 };
      const nearbyBody = { x: 350, y: 300 }; // 50px
      const distantBody = { x: 450, y: 300 }; // 150px

      expect(isWithinRadius(reporterPos, nearbyBody, GAMEPLAY_CONSTANTS.REPORT_BODY_DISTANCE)).toBe(true);
      expect(isWithinRadius(reporterPos, distantBody, GAMEPLAY_CONSTANTS.REPORT_BODY_DISTANCE)).toBe(false);
    });

    it('verifies task interaction must be within 65px radius', () => {
      const playerPos = { x: 150, y: 150 };
      const consolePos = { x: 190, y: 150 }; // 40px away
      const outOfReachConsole = { x: 250, y: 150 }; // 100px away

      expect(isWithinRadius(playerPos, consolePos, GAMEPLAY_CONSTANTS.INTERACT_RADIUS)).toBe(true);
      expect(isWithinRadius(playerPos, outOfReachConsole, GAMEPLAY_CONSTANTS.INTERACT_RADIUS)).toBe(false);
    });
  });
});
