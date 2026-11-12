import { describe, it, expect } from 'vitest';
import {
  canTransition,
  checkWinCondition,
  tallyVotes,
  PlayerRole,
} from '../index.js';

describe('Round State Machine & Transitions', () => {
  it('allows valid state transitions', () => {
    expect(canTransition('LOBBY', 'STARTING')).toBe(true);
    expect(canTransition('STARTING', 'PLAYING')).toBe(true);
    expect(canTransition('PLAYING', 'MEETING')).toBe(true);
    expect(canTransition('MEETING', 'VOTING_RESULTS')).toBe(true);
    expect(canTransition('VOTING_RESULTS', 'PLAYING')).toBe(true);
    expect(canTransition('VOTING_RESULTS', 'GAME_OVER')).toBe(true);
    expect(canTransition('PLAYING', 'GAME_OVER')).toBe(true);
    expect(canTransition('GAME_OVER', 'LOBBY')).toBe(true);
  });

  it('rejects invalid state transitions', () => {
    expect(canTransition('LOBBY', 'PLAYING')).toBe(false);
    expect(canTransition('LOBBY', 'MEETING')).toBe(false);
    expect(canTransition('MEETING', 'LOBBY')).toBe(false);
    expect(canTransition('GAME_OVER', 'PLAYING')).toBe(false);
  });
});

describe('Vote Tallying', () => {
  it('correctly elects player with majority vote', () => {
    const votes = {
      p1: 'p3',
      p2: 'p3',
      p3: 'p1',
      p4: 'p3',
    };
    const res = tallyVotes(votes);
    expect(res.ejectedPlayerId).toBe('p3');
    expect(res.isTie).toBe(false);
    expect(res.isSkip).toBe(false);
    expect(res.voteCounts['p3']).toBe(3);
  });

  it('detects a tie and results in no ejection', () => {
    const votes = {
      p1: 'p2',
      p2: 'p1',
    };
    const res = tallyVotes(votes);
    expect(res.ejectedPlayerId).toBeNull();
    expect(res.isTie).toBe(true);
  });

  it('handles majority skip', () => {
    const votes = {
      p1: 'SKIP',
      p2: 'SKIP',
      p3: 'p2',
    };
    const res = tallyVotes(votes);
    expect(res.ejectedPlayerId).toBeNull();
    expect(res.isSkip).toBe(true);
  });
});

describe('Authoritative Win Conditions', () => {
  const basePlayers = [
    { id: 'p1', name: 'Op1', role: 'OPERATOR' as PlayerRole, isAlive: true },
    { id: 'p2', name: 'Op2', role: 'OPERATOR' as PlayerRole, isAlive: true },
    { id: 'p3', name: 'Op3', role: 'OPERATOR' as PlayerRole, isAlive: true },
    { id: 'p4', name: 'Dis1', role: 'DISRUPTOR' as PlayerRole, isAlive: true },
  ];

  it('triggers Operators win when all Disruptors are eliminated', () => {
    const players = [
      { id: 'p1', name: 'Op1', role: 'OPERATOR' as PlayerRole, isAlive: true },
      { id: 'p2', name: 'Op2', role: 'OPERATOR' as PlayerRole, isAlive: true },
      { id: 'p3', name: 'Dis1', role: 'DISRUPTOR' as PlayerRole, isAlive: false },
    ];
    const win = checkWinCondition({
      players,
      completedTasks: 5,
      totalTasks: 10,
      criticalSabotageExpired: false,
    });
    expect(win).not.toBeNull();
    expect(win?.winner).toBe('OPERATORS');
    expect(win?.reason).toBe('ALL_DISRUPTORS_EJECTED');
  });

  it('triggers Operators win when all tasks are completed', () => {
    const win = checkWinCondition({
      players: basePlayers,
      completedTasks: 10,
      totalTasks: 10,
      criticalSabotageExpired: false,
    });
    expect(win).not.toBeNull();
    expect(win?.winner).toBe('OPERATORS');
    expect(win?.reason).toBe('TASKS_COMPLETED');
  });

  it('triggers Disruptors win when Disruptors equal living Operators', () => {
    const players = [
      { id: 'p1', name: 'Op1', role: 'OPERATOR' as PlayerRole, isAlive: true },
      { id: 'p2', name: 'Op2', role: 'OPERATOR' as PlayerRole, isAlive: false },
      { id: 'p3', name: 'Dis1', role: 'DISRUPTOR' as PlayerRole, isAlive: true },
    ];
    const win = checkWinCondition({
      players,
      completedTasks: 2,
      totalTasks: 10,
      criticalSabotageExpired: false,
    });
    expect(win).not.toBeNull();
    expect(win?.winner).toBe('DISRUPTORS');
    expect(win?.reason).toBe('DISRUPTORS_EQUAL_OR_OUTNUMBER');
  });

  it('triggers Disruptors win when critical sabotage countdown hits 0', () => {
    const win = checkWinCondition({
      players: basePlayers,
      completedTasks: 0,
      totalTasks: 10,
      criticalSabotageExpired: true,
    });
    expect(win).not.toBeNull();
    expect(win?.winner).toBe('DISRUPTORS');
    expect(win?.reason).toBe('CRITICAL_SABOTAGE_COLLAPSE');
  });

  it('returns null when game is ongoing with no winner yet', () => {
    const win = checkWinCondition({
      players: basePlayers,
      completedTasks: 2,
      totalTasks: 10,
      criticalSabotageExpired: false,
    });
    expect(win).toBeNull();
  });
});
