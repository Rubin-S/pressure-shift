import { describe, it, expect } from 'vitest';
import {
  distance2D,
  isWithinRadius,
  clamp,
  calculateAngleDeg,
  validateSpeedDelta,
} from '../index.js';

describe('Math & Anti-Cheat Utilities', () => {
  it('calculates 2D distance accurately', () => {
    expect(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('checks radius correctly', () => {
    expect(isWithinRadius({ x: 0, y: 0 }, { x: 5, y: 5 }, 10)).toBe(true);
    expect(isWithinRadius({ x: 0, y: 0 }, { x: 10, y: 10 }, 5)).toBe(false);
  });

  it('clamps values within bounds', () => {
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('calculates angle in degrees', () => {
    // From (0,0) to (0, -10) is straight up (North) -> 0 deg
    expect(calculateAngleDeg({ x: 0, y: 0 }, { x: 0, y: -10 })).toBe(0);
    // From (0,0) to (10, 0) is East -> 90 deg
    expect(calculateAngleDeg({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(90);
  });

  it('validates movement speed within anti-cheat thresholds', () => {
    // 200 units/sec, delta 500ms -> normal max distance = 100. With 1.35 tolerance = 135.
    const p1 = { x: 0, y: 0 };
    const pNormal = { x: 100, y: 0 };
    const pFast = { x: 130, y: 0 };
    const pTeleport = { x: 500, y: 0 };

    expect(validateSpeedDelta(p1, pNormal, 500, 200)).toBe(true);
    expect(validateSpeedDelta(p1, pFast, 500, 200)).toBe(true);
    expect(validateSpeedDelta(p1, pTeleport, 500, 200)).toBe(false);
    expect(validateSpeedDelta(p1, pNormal, 0, 200)).toBe(false);
  });
});
