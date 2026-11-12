import { Position2D } from '../types/tasks.js';

/**
 * Calculates Euclidean distance between two 2D points.
 */
export function distance2D(p1: Position2D, p2: Position2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks if two points are within a given radius.
 */
export function isWithinRadius(p1: Position2D, p2: Position2D, radius: number): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Calculates angle in degrees from p1 to p2 (0-360 deg, clockwise starting from north/up).
 */
export function calculateAngleDeg(from: Position2D, to: Position2D): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg % 360;
}

/**
 * Validates whether a player's movement between two positions within deltaTimeMs
 * respects the configured maximum speed with an anti-cheat tolerance.
 */
export function validateSpeedDelta(
  p1: Position2D,
  p2: Position2D,
  deltaTimeMs: number,
  maxSpeedUnitsPerSec: number,
  toleranceMultiplier: number = 1.35
): boolean {
  if (deltaTimeMs <= 0) return false;
  const dist = distance2D(p1, p2);
  const deltaSec = deltaTimeMs / 1000;
  const speed = dist / deltaSec;
  return speed <= maxSpeedUnitsPerSec * toleranceMultiplier;
}
