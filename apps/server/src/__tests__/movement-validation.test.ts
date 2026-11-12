import { describe, it, expect } from 'vitest';
import {
  validateMovement,
  findCurrentFacilityRoom,
  isPositionWithinMapBounds,
} from '../game/movement.js';
import { FACILITY_ROOMS, MAP_DIMENSIONS } from '@pressure-shift/shared';

describe('Movement Validation & Anti-Cheat Unit Tests', () => {
  const baseSpeed = 200; // 200 units/second

  describe('Speed & Delta Time Validation', () => {
    it('approves legitimate movement within speed limit', () => {
      const from = { x: 500, y: 500 };
      // Move 20 units in 100ms = 200 units/sec
      const to = { x: 520, y: 500 };
      const res = validateMovement(from, to, 100, baseSpeed);
      expect(res.valid).toBe(true);
    });

    it('approves movement with network jitter within tolerance multiplier', () => {
      const from = { x: 500, y: 500 };
      // Move 25 units in 100ms = 250 units/sec (within 1.35x tolerance = 270)
      const to = { x: 525, y: 500 };
      const res = validateMovement(from, to, 100, baseSpeed);
      expect(res.valid).toBe(true);
    });

    it('rejects speed hacks exceeding speed limit + tolerance', () => {
      const from = { x: 500, y: 500 };
      // Move 100 units in 100ms = 1000 units/sec
      const to = { x: 600, y: 500 };
      const res = validateMovement(from, to, 100, baseSpeed);
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/speed violation/i);
    });

    it('rejects non-positive delta time', () => {
      const from = { x: 500, y: 500 };
      const to = { x: 510, y: 500 };
      expect(validateMovement(from, to, 0, baseSpeed).valid).toBe(false);
      expect(validateMovement(from, to, -50, baseSpeed).valid).toBe(false);
    });

    it('rejects excessive delta intervals that attempt long-distance warp', () => {
      const from = { x: 500, y: 500 };
      const to = { x: 1500, y: 500 };
      const res = validateMovement(from, to, 6000, baseSpeed);
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/exceeded maximum allowed interval/i);
    });
  });

  describe('Facility Boundaries & Room Detection', () => {
    it('rejects coordinates outside map boundaries', () => {
      expect(isPositionWithinMapBounds({ x: -10, y: 500 })).toBe(false);
      expect(isPositionWithinMapBounds({ x: 500, y: -10 })).toBe(false);
      expect(isPositionWithinMapBounds({ x: MAP_DIMENSIONS.width + 10, y: 500 })).toBe(false);
      expect(isPositionWithinMapBounds({ x: 500, y: MAP_DIMENSIONS.height + 10 })).toBe(false);

      const outOfBounds = validateMovement(
        { x: 500, y: 500 },
        { x: MAP_DIMENSIONS.width + 50, y: 500 },
        100,
        baseSpeed
      );
      expect(outOfBounds.valid).toBe(false);
      expect(outOfBounds.reason).toMatch(/out of facility bounds/i);
    });

    it('identifies facility room when inside its bounds', () => {
      // Docking Cradle: bounds { x: 100, y: 100, width: 500, height: 400 }
      const dockingPoint = { x: 300, y: 250 };
      expect(findCurrentFacilityRoom(dockingPoint)).toBe('docking_cradle');

      // Central Junction: bounds { x: 900, y: 700, width: 600, height: 400 }
      const junctionPoint = { x: 1200, y: 900 };
      expect(findCurrentFacilityRoom(junctionPoint)).toBe('central_junction');

      // Corridor outside any room bounds
      const corridorPoint = { x: 750, y: 250 };
      expect(findCurrentFacilityRoom(corridorPoint)).toBeNull();
    });
  });
});
