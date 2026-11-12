import {
  Position2D,
  FacilityRoomId,
  FACILITY_ROOMS,
  MAP_DIMENSIONS,
  validateSpeedDelta,
  GAMEPLAY_CONSTANTS,
  distance2D,
} from '@pressure-shift/shared';

export interface MovementValidationResult {
  valid: boolean;
  reason?: string;
  detectedRoom?: FacilityRoomId | null;
}

/**
 * Determines which facility room (if any) contains the given 2D coordinates.
 */
export function findCurrentFacilityRoom(pos: Position2D): FacilityRoomId | null {
  for (const [roomId, roomInfo] of Object.entries(FACILITY_ROOMS)) {
    const { x, y, width, height } = roomInfo.bounds;
    if (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height) {
      return roomId as FacilityRoomId;
    }
  }
  return null;
}

/**
 * Checks whether coordinates lie strictly within the facility map dimensions.
 */
export function isPositionWithinMapBounds(pos: Position2D): boolean {
  return (
    pos.x >= 0 &&
    pos.x <= MAP_DIMENSIONS.width &&
    pos.y >= 0 &&
    pos.y <= MAP_DIMENSIONS.height
  );
}

/**
 * Authoritatively validates a player's movement update against speed, time delta, and boundaries.
 */
export function validateMovement(
  from: Position2D,
  to: Position2D,
  deltaTimeMs: number,
  maxSpeedUnitsPerSec: number,
  toleranceMultiplier: number = GAMEPLAY_CONSTANTS.SPEED_TOLERANCE_MULTIPLIER
): MovementValidationResult {
  // 1. Boundary check
  if (!isPositionWithinMapBounds(to)) {
    return {
      valid: false,
      reason: `Position (${to.x}, ${to.y}) is out of facility bounds [0..${MAP_DIMENSIONS.width}, 0..${MAP_DIMENSIONS.height}]`,
    };
  }

  // 2. Delta time sanity check
  if (deltaTimeMs <= 0) {
    return {
      valid: false,
      reason: `Invalid non-positive delta time: ${deltaTimeMs}ms`,
    };
  }

  // Reject excessively large intervals that could hide teleportation
  if (deltaTimeMs > 5000) {
    return {
      valid: false,
      reason: `Delta time ${deltaTimeMs}ms exceeded maximum allowed interval (5000ms)`,
    };
  }

  // 3. Distance check
  const dist = distance2D(from, to);
  if (dist === 0) {
    return {
      valid: true,
      detectedRoom: findCurrentFacilityRoom(to),
    };
  }

  // 4. Speed anti-cheat verification
  const isSpeedLegit = validateSpeedDelta(
    from,
    to,
    deltaTimeMs,
    maxSpeedUnitsPerSec,
    toleranceMultiplier
  );

  if (!isSpeedLegit) {
    const speed = (dist / (deltaTimeMs / 1000)).toFixed(1);
    const maxAllowed = (maxSpeedUnitsPerSec * toleranceMultiplier).toFixed(1);
    return {
      valid: false,
      reason: `Speed violation: moved ${dist.toFixed(1)} units in ${deltaTimeMs}ms (${speed} u/s > max allowed ${maxAllowed} u/s)`,
    };
  }

  return {
    valid: true,
    detectedRoom: findCurrentFacilityRoom(to),
  };
}
