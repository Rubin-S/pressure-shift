import { RoomState, VALID_STATE_TRANSITIONS, GameOverReason, GameOverSummary } from '../types/state-machine.js';
import { PlayerRole } from '../types/player.js';

/**
 * Validates if a state transition is legal according to the game state machine.
 */
export function canTransition(from: RoomState, to: RoomState): boolean {
  const allowed = VALID_STATE_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Returns whether the game state represents an ongoing active gameplay match.
 */
export function isMatchInProgress(state: RoomState): boolean {
  return state === 'PLAYING' || state === 'MEETING' || state === 'VOTING_RESULTS';
}

/**
 * Checks whether any win condition has been satisfied.
 */
export function checkWinCondition(params: {
  players: Array<{ id: string; name: string; role: PlayerRole; isAlive: boolean }>;
  completedTasks: number;
  totalTasks: number;
  criticalSabotageExpired: boolean;
}): GameOverSummary | null {
  const { players, completedTasks, totalTasks, criticalSabotageExpired } = params;

  const disruptorIds = players.filter((p) => p.role === 'DISRUPTOR').map((p) => p.id);
  const livingDisruptors = players.filter((p) => p.role === 'DISRUPTOR' && p.isAlive);
  const livingOperators = players.filter((p) => p.role === 'OPERATOR' && p.isAlive);

  // 1. Critical Sabotage expired -> Disruptors Win
  if (criticalSabotageExpired) {
    return {
      winner: 'DISRUPTORS',
      reason: 'CRITICAL_SABOTAGE_COLLAPSE',
      disruptorIds,
      allPlayers: players,
    };
  }

  // 2. All Disruptors dead/ejected -> Operators Win
  if (livingDisruptors.length === 0 && disruptorIds.length > 0) {
    return {
      winner: 'OPERATORS',
      reason: 'ALL_DISRUPTORS_EJECTED',
      disruptorIds,
      allPlayers: players,
    };
  }

  // 3. Disruptors equal or outnumber Operators -> Disruptors Win
  if (livingDisruptors.length >= livingOperators.length && livingDisruptors.length > 0) {
    return {
      winner: 'DISRUPTORS',
      reason: 'DISRUPTORS_EQUAL_OR_OUTNUMBER',
      disruptorIds,
      allPlayers: players,
    };
  }

  // 4. All tasks completed by Operators -> Operators Win
  if (totalTasks > 0 && completedTasks >= totalTasks) {
    return {
      winner: 'OPERATORS',
      reason: 'TASKS_COMPLETED',
      disruptorIds,
      allPlayers: players,
    };
  }

  return null;
}

/**
 * Tallies votes from a meeting and determines who (if anyone) is ejected.
 */
export function tallyVotes(votes: Record<string, string | 'SKIP'>): {
  ejectedPlayerId: string | null;
  isTie: boolean;
  isSkip: boolean;
  voteCounts: Record<string, number>;
} {
  const voteCounts: Record<string, number> = {};

  for (const targetId of Object.values(votes)) {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }

  let maxVotes = 0;
  let topTarget: string | null = null;
  let isTie = false;

  for (const [target, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      topTarget = target;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  if (isTie || topTarget === null || topTarget === 'SKIP') {
    return {
      ejectedPlayerId: null,
      isTie: isTie && topTarget !== 'SKIP',
      isSkip: topTarget === 'SKIP',
      voteCounts,
    };
  }

  return {
    ejectedPlayerId: topTarget,
    isTie: false,
    isSkip: false,
    voteCounts,
  };
}

/**
 * Generates an uppercase 6-character room code excluding easily confused characters (O, 0, I, 1).
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
