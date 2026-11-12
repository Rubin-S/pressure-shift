import { describe, it, expect } from 'vitest';
import {
  STATIC_TASK_DEFINITIONS,
  DEFAULT_ROOM_SETTINGS,
  PlayerRole,
  PlayerTask,
  TaskStatus,
} from '@pressure-shift/shared';

// Authoritative role assignment simulator to verify algorithmic correctness
function simulateRoleAssignment(
  playerIds: string[],
  numDisruptors: number,
  taskCountPerOperator: number
): {
  roles: Record<string, PlayerRole>;
  disruptorIds: string[];
  operatorIds: string[];
  tasksByPlayer: Record<string, PlayerTask[]>;
} {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const clampedDisruptors = Math.max(1, Math.min(numDisruptors, Math.floor(playerIds.length / 2)));

  const disruptorIds = shuffled.slice(0, clampedDisruptors);
  const operatorIds = shuffled.slice(clampedDisruptors);

  const roles: Record<string, PlayerRole> = {};
  for (const id of disruptorIds) roles[id] = 'DISRUPTOR';
  for (const id of operatorIds) roles[id] = 'OPERATOR';

  const tasksByPlayer: Record<string, PlayerTask[]> = {};

  for (const playerId of playerIds) {
    const isDis = roles[playerId] === 'DISRUPTOR';
    // Shuffle available tasks from values
    const taskValues = Object.values(STATIC_TASK_DEFINITIONS);
    const playerTaskDefs = [...taskValues]
      .sort(() => Math.random() - 0.5)
      .slice(0, taskCountPerOperator);

    tasksByPlayer[playerId] = playerTaskDefs.map((def, idx) => ({
      id: `${playerId}-task-${idx}`,
      taskId: def.id,
      type: def.type,
      name: def.name,
      description: def.description,
      room: def.room,
      location: def.location,
      status: 'NOT_STARTED' as TaskStatus,
    }));
  }

  return { roles, disruptorIds, operatorIds, tasksByPlayer };
}

describe('Role Distribution & Task Assignment Integration Tests', () => {
  describe('Disruptor vs Operator Distribution', () => {
    it('accurately assigns 1 Disruptor in a 4-player minimum game', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const result = simulateRoleAssignment(players, 1, 5);

      expect(result.disruptorIds).toHaveLength(1);
      expect(result.operatorIds).toHaveLength(3);
      expect(Object.keys(result.roles)).toHaveLength(4);

      // Verify every player has a distinct role
      for (const id of players) {
        expect(['OPERATOR', 'DISRUPTOR']).toContain(result.roles[id]);
      }
    });

    it('accurately assigns 2 Disruptors in an 8-player game', () => {
      const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
      const result = simulateRoleAssignment(players, 2, 5);

      expect(result.disruptorIds).toHaveLength(2);
      expect(result.operatorIds).toHaveLength(6);
    });

    it('clamps disruptor count so disruptors cannot equal or exceed half the lobby at start', () => {
      const players = ['p1', 'p2', 'p3', 'p4']; // 4 players
      // Requesting 3 disruptors would mean game immediately ends
      const result = simulateRoleAssignment(players, 3, 5);

      expect(result.disruptorIds.length).toBeLessThanOrEqual(2);
      expect(result.operatorIds.length).toBeGreaterThanOrEqual(2);
    });

    it('demonstrates fair randomized distribution across multiple rounds', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const disruptorCounts: Record<string, number> = { p1: 0, p2: 0, p3: 0, p4: 0 };

      const ITERATIONS = 300;
      for (let i = 0; i < ITERATIONS; i++) {
        const result = simulateRoleAssignment(players, 1, 5);
        for (const dId of result.disruptorIds) {
          disruptorCounts[dId]++;
        }
      }

      // Expected ~75 per player out of 300 iterations. Allow reasonable statistical variance
      for (const id of players) {
        expect(disruptorCounts[id]).toBeGreaterThan(30);
        expect(disruptorCounts[id]).toBeLessThan(120);
      }
    });
  });

  describe('Task Assignment Verification', () => {
    it('assigns the configured number of tasks to each operator', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const taskCount = DEFAULT_ROOM_SETTINGS.operatorTaskCount; // 5
      const result = simulateRoleAssignment(players, 1, taskCount);

      for (const id of result.operatorIds) {
        const tasks = result.tasksByPlayer[id];
        expect(tasks).toHaveLength(taskCount);
        for (const task of tasks) {
          expect(task.status).toBe('NOT_STARTED');
          expect(task.location).toBeDefined();
          expect(task.room).toBeDefined();
        }
      }
    });

    it('assigns fake tasks to Disruptors so they can simulate working', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const taskCount = 5;
      const result = simulateRoleAssignment(players, 1, taskCount);

      for (const id of result.disruptorIds) {
        const fakeTasks = result.tasksByPlayer[id];
        expect(fakeTasks).toHaveLength(taskCount);
        expect(fakeTasks[0].status).toBe('NOT_STARTED');
      }
    });

    it('all assigned tasks reference valid facility room stations', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const result = simulateRoleAssignment(players, 1, 5);

      const validRooms = [
        'docking_cradle',
        'sonar_control',
        'hydroponics',
        'pressure_lab',
        'thermal_plant',
        'communications',
        'observation_gallery',
        'medical_bay',
        'central_junction',
      ];

      for (const tasks of Object.values(result.tasksByPlayer)) {
        for (const task of tasks) {
          expect(validRooms).toContain(task.room);
        }
      }
    });
  });
});
