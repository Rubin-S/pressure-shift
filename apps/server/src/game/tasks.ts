import {
  PlayerTask,
  TaskMeterState,
  STATIC_TASK_DEFINITIONS,
  ALL_TASK_IDS,
  Position2D,
  distance2D,
  GAMEPLAY_CONSTANTS,
} from '@pressure-shift/shared';
import { ServerPlayer } from '../types.js';

/**
 * Assigns a random subset of tasks to an Operator.
 */
export function assignTasksToPlayer(
  playerId: string,
  taskCount: number
): PlayerTask[] {
  const shuffledIds = [...ALL_TASK_IDS].sort(() => Math.random() - 0.5);
  const selectedIds = shuffledIds.slice(0, Math.min(taskCount, ALL_TASK_IDS.length));

  return selectedIds.map((taskId) => {
    const def = STATIC_TASK_DEFINITIONS[taskId];
    return {
      id: `${playerId}_${taskId}`,
      taskId: def.id,
      type: def.type,
      name: def.name,
      description: def.description,
      room: def.room,
      location: { ...def.location },
      status: 'NOT_STARTED',
    };
  });
}

/**
 * Calculates current global task meter metrics across all Operator players.
 */
export function calculateTaskMeter(players: ServerPlayer[]): TaskMeterState {
  const operators = players.filter((p) => p.role === 'OPERATOR');
  let totalTasks = 0;
  let completedTasks = 0;

  for (const op of operators) {
    const list = op.tasks || op.assignedTasks || [];
    totalTasks += list.length;
    completedTasks += list.filter((t) => t.status === 'COMPLETED').length;
  }

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    completedTasks,
    totalTasks,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
  };
}

/**
 * Validates distance between player position and task station.
 */
export function isPlayerNearTask(
  playerPosition: Position2D,
  taskId: string,
  toleranceMultiplier: number = 1.4
): boolean {
  const taskDef = STATIC_TASK_DEFINITIONS[taskId];
  if (!taskDef) return false;

  const maxDistance = (taskDef.interactRadius || GAMEPLAY_CONSTANTS.INTERACT_RADIUS) * toleranceMultiplier;
  return distance2D(playerPosition, taskDef.location) <= maxDistance;
}
