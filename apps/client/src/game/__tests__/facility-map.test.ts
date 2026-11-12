import { describe, it, expect } from 'vitest';
import {
  FACILITY_ROOMS,
  FACILITY_VENTS,
  STATIC_TASK_DEFINITIONS,
  SABOTAGE_DEFINITIONS,
  MAP_DIMENSIONS,
} from '@pressure-shift/shared';

describe('Facility Map Geometry & Interactive Stations', () => {
  it('has valid map dimensions for the underwater station', () => {
    expect(MAP_DIMENSIONS.width).toBe(2400);
    expect(MAP_DIMENSIONS.height).toBe(1800);
  });

  it('contains all 9 facility rooms with positive bounds within map boundaries', () => {
    const requiredRooms = [
      'central_junction',
      'docking_cradle',
      'sonar_control',
      'hydroponics',
      'pressure_lab',
      'observation_gallery',
      'thermal_plant',
      'communications',
      'medical_bay',
    ];

    expect(Object.keys(FACILITY_ROOMS)).toHaveLength(9);

    for (const roomId of requiredRooms) {
      const room = (FACILITY_ROOMS as any)[roomId];
      expect(room).toBeDefined();
      expect(room.bounds.x).toBeGreaterThanOrEqual(0);
      expect(room.bounds.y).toBeGreaterThanOrEqual(0);
      expect(room.bounds.x + room.bounds.width).toBeLessThanOrEqual(MAP_DIMENSIONS.width);
      expect(room.bounds.y + room.bounds.height).toBeLessThanOrEqual(MAP_DIMENSIONS.height);
      expect(room.spawnPoint.x).toBeGreaterThanOrEqual(room.bounds.x);
      expect(room.spawnPoint.x).toBeLessThanOrEqual(room.bounds.x + room.bounds.width);
      expect(room.spawnPoint.y).toBeGreaterThanOrEqual(room.bounds.y);
      expect(room.spawnPoint.y).toBeLessThanOrEqual(room.bounds.y + room.bounds.height);
    }
  });

  it('places all 8 mini-game task stations inside their designated rooms', () => {
    for (const [taskId, task] of Object.entries(STATIC_TASK_DEFINITIONS)) {
      const room = FACILITY_ROOMS[task.room];
      expect(room, `Room for ${taskId} must exist`).toBeDefined();

      const b = room.bounds;
      const insideX = task.location.x >= b.x && task.location.x <= b.x + b.width;
      const insideY = task.location.y >= b.y && task.location.y <= b.y + b.height;

      expect(insideX, `Task ${taskId} X (${task.location.x}) must be inside ${task.room} bounds [${b.x}, ${b.x + b.width}]`).toBe(true);
      expect(insideY, `Task ${taskId} Y (${task.location.y}) must be inside ${task.room} bounds [${b.y}, ${b.y + b.height}]`).toBe(true);
      expect(task.interactRadius).toBeGreaterThanOrEqual(40);
    }
  });

  it('places all facility vents inside their designated rooms', () => {
    for (const [ventId, vent] of Object.entries(FACILITY_VENTS)) {
      const room = FACILITY_ROOMS[vent.room];
      expect(room, `Room for ${ventId} must exist`).toBeDefined();

      const b = room.bounds;
      const insideX = vent.position.x >= b.x && vent.position.x <= b.x + b.width;
      const insideY = vent.position.y >= b.y && vent.position.y <= b.y + b.height;

      expect(insideX, `Vent ${ventId} X (${vent.position.x}) must be inside ${vent.room} bounds`).toBe(true);
      expect(insideY, `Vent ${ventId} Y (${vent.position.y}) must be inside ${vent.room} bounds`).toBe(true);
    }
  });

  it('places emergency dispatch console at central junction table', () => {
    const central = FACILITY_ROOMS.central_junction;
    expect(central.emergencyConsole).toBeDefined();
    expect(central.emergencyConsole?.x).toBe(1200);
    expect(central.emergencyConsole?.y).toBe(900);
  });

  it('defines sabotage stations with valid coordinates in designated rooms', () => {
    for (const [, sabotage] of Object.entries(SABOTAGE_DEFINITIONS)) {
      for (const station of sabotage.defaultStations) {
        const room = FACILITY_ROOMS[station.room];
        expect(room, `Room for sabotage station ${station.id} must exist`).toBeDefined();
        const b = room.bounds;
        expect(station.location.x >= b.x && station.location.x <= b.x + b.width).toBe(true);
        expect(station.location.y >= b.y && station.location.y <= b.y + b.height).toBe(true);
      }
    }
  });
});
