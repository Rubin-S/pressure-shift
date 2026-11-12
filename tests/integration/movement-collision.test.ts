import { describe, it, expect } from 'vitest';
import {
  FACILITY_ROOMS,
  FACILITY_VENTS,
  MAP_DIMENSIONS,
  validateSpeedDelta,
  FacilityRoomId,
  DEFAULT_ROOM_SETTINGS,
} from '@pressure-shift/shared';

// Helper to determine which room a coordinate resides in
function resolveCurrentRoom(x: number, y: number): FacilityRoomId | 'hallway' {
  for (const [roomId, info] of Object.entries(FACILITY_ROOMS)) {
    const { bounds } = info;
    if (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    ) {
      return roomId as FacilityRoomId;
    }
  }
  return 'hallway';
}

describe('Movement, Bounds & Collision Integration Tests', () => {
  describe('Facility Room Bounding Boxes & Spatial Queries', () => {
    it('resolves coordinates inside room bounding boxes', () => {
      // Spawn point of docking cradle: { x: 350, y: 300 }
      expect(resolveCurrentRoom(350, 300)).toBe('docking_cradle');

      // Spawn point of sonar control: { x: 1200, y: 300 }
      expect(resolveCurrentRoom(1200, 300)).toBe('sonar_control');

      // Spawn point of hydroponics: { x: 2050, y: 300 }
      expect(resolveCurrentRoom(2050, 300)).toBe('hydroponics');

      // Spawn point of central junction: { x: 1200, y: 900 }
      expect(resolveCurrentRoom(1200, 900)).toBe('central_junction');
    });

    it('identifies coordinates outside defined room bounds as hallway/corridor', () => {
      // Corridor between docking_cradle (ends at x=600) and central_junction (starts at x=900)
      expect(resolveCurrentRoom(750, 300)).toBe('hallway');
      expect(resolveCurrentRoom(750, 800)).toBe('hallway');
    });

    it('enforces that all facility rooms fit within the total map dimensions', () => {
      for (const [id, room] of Object.entries(FACILITY_ROOMS)) {
        expect(room.bounds.x).toBeGreaterThanOrEqual(0);
        expect(room.bounds.y).toBeGreaterThanOrEqual(0);
        expect(room.bounds.x + room.bounds.width).toBeLessThanOrEqual(MAP_DIMENSIONS.width);
        expect(room.bounds.y + room.bounds.height).toBeLessThanOrEqual(MAP_DIMENSIONS.height);
      }
    });
  });

  describe('Ventilation Network Topology', () => {
    it('all vents connect bidirectionally to existing valid vents', () => {
      for (const [ventId, vent] of Object.entries(FACILITY_VENTS)) {
        expect(vent.connectedVentIds.length).toBeGreaterThan(0);

        for (const targetVentId of vent.connectedVentIds) {
          const targetVent = FACILITY_VENTS[targetVentId];
          expect(targetVent).toBeDefined();
          // Ensure bidirectional link
          expect(targetVent.connectedVentIds).toContain(ventId);
        }
      }
    });

    it('all vents are situated within their designated facility rooms', () => {
      for (const vent of Object.values(FACILITY_VENTS)) {
        const detectedRoom = resolveCurrentRoom(vent.position.x, vent.position.y);
        expect(detectedRoom).toBe(vent.room);
      }
    });
  });

  describe('Authoritative Speed & Boundary Enforcement', () => {
    const baseSpeed = DEFAULT_ROOM_SETTINGS.playerSpeed; // 200

    it('validates player movement across successive client ticks (50ms interval)', () => {
      let currentPos = { x: 350, y: 300 }; // docking_cradle
      const tickDeltaMs = 50;

      // Simulate 10 ticks moving right at 180 px/sec (9 px per 50ms)
      for (let i = 0; i < 10; i++) {
        const nextPos = { x: currentPos.x + 9, y: currentPos.y };
        const valid = validateSpeedDelta(currentPos, nextPos, tickDeltaMs, baseSpeed);
        expect(valid).toBe(true);
        currentPos = nextPos;
      }

      expect(currentPos.x).toBe(440);
    });

    it('catches and flags speed bursts exceeding anti-cheat buffer', () => {
      const p1 = { x: 500, y: 500 };
      // 50ms tick with jump of 60px -> 1200 px/sec! (Speedhack)
      const p2 = { x: 560, y: 500 };
      expect(validateSpeedDelta(p1, p2, 50, baseSpeed)).toBe(false);
    });

    it('flags wall boundary breaches outside map dimensions', () => {
      const isWithinStation = (pos: { x: number; y: number }) =>
        pos.x >= 0 && pos.x <= MAP_DIMENSIONS.width && pos.y >= 0 && pos.y <= MAP_DIMENSIONS.height;

      expect(isWithinStation({ x: 100, y: 100 })).toBe(true);
      expect(isWithinStation({ x: 2399, y: 1799 })).toBe(true);
      expect(isWithinStation({ x: -10, y: 100 })).toBe(false);
      expect(isWithinStation({ x: 100, y: 1850 })).toBe(false);
      expect(isWithinStation({ x: 2500, y: 500 })).toBe(false);
    });
  });
});
