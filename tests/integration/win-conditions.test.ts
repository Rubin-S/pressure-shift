import { describe, it, expect } from 'vitest';
import { checkWinCondition, PlayerRole } from '@pressure-shift/shared';

describe('Win Conditions Authoritative Evaluation Tests', () => {
  const basePlayers = [
    { id: 'op1', name: 'Alice', role: 'OPERATOR' as PlayerRole, isAlive: true },
    { id: 'op2', name: 'Bob', role: 'OPERATOR' as PlayerRole, isAlive: true },
    { id: 'op3', name: 'Charlie', role: 'OPERATOR' as PlayerRole, isAlive: true },
    { id: 'dis1', name: 'Diana', role: 'DISRUPTOR' as PlayerRole, isAlive: true },
  ];

  it('Condition 1: Operators Win when All Disruptors are ejected', () => {
    const players = basePlayers.map((p) => (p.id === 'dis1' ? { ...p, isAlive: false } : p));

    const result = checkWinCondition({
      players,
      completedTasks: 3,
      totalTasks: 15,
      criticalSabotageExpired: false,
    });

    expect(result).not.toBeNull();
    expect(result?.winner).toBe('OPERATORS');
    expect(result?.reason).toBe('ALL_DISRUPTORS_EJECTED');
    expect(result?.disruptorIds).toEqual(['dis1']);
  });

  it('Condition 2: Operators Win when all Operator tasks reach 100%', () => {
    const result = checkWinCondition({
      players: basePlayers,
      completedTasks: 15,
      totalTasks: 15,
      criticalSabotageExpired: false,
    });

    expect(result).not.toBeNull();
    expect(result?.winner).toBe('OPERATORS');
    expect(result?.reason).toBe('TASKS_COMPLETED');
  });

  it('Condition 3: Disruptors Win when Disruptor count equals or exceeds living Operators', () => {
    // 2 living Operators, 1 living Disruptor -> Eliminate 1 Operator -> 1 Op, 1 Disruptor
    const players = [
      { id: 'op1', name: 'Alice', role: 'OPERATOR' as PlayerRole, isAlive: true },
      { id: 'op2', name: 'Bob', role: 'OPERATOR' as PlayerRole, isAlive: false }, // Killed
      { id: 'op3', name: 'Charlie', role: 'OPERATOR' as PlayerRole, isAlive: false }, // Killed
      { id: 'dis1', name: 'Diana', role: 'DISRUPTOR' as PlayerRole, isAlive: true },
    ];

    const result = checkWinCondition({
      players,
      completedTasks: 5,
      totalTasks: 15,
      criticalSabotageExpired: false,
    });

    expect(result).not.toBeNull();
    expect(result?.winner).toBe('DISRUPTORS');
    expect(result?.reason).toBe('DISRUPTORS_EQUAL_OR_OUTNUMBER');
  });

  it('Condition 3b: Disruptors Win when 2 Disruptors outnumber 1 Operator', () => {
    const players = [
      { id: 'op1', name: 'Alice', role: 'OPERATOR' as PlayerRole, isAlive: true },
      { id: 'dis1', name: 'Diana', role: 'DISRUPTOR' as PlayerRole, isAlive: true },
      { id: 'dis2', name: 'Evan', role: 'DISRUPTOR' as PlayerRole, isAlive: true },
    ];

    const result = checkWinCondition({
      players,
      completedTasks: 4,
      totalTasks: 15,
      criticalSabotageExpired: false,
    });

    expect(result).not.toBeNull();
    expect(result?.winner).toBe('DISRUPTORS');
    expect(result?.reason).toBe('DISRUPTORS_EQUAL_OR_OUTNUMBER');
  });

  it('Condition 4: Disruptors Win when Critical Sabotage timer reaches 0', () => {
    const result = checkWinCondition({
      players: basePlayers,
      completedTasks: 10,
      totalTasks: 15,
      criticalSabotageExpired: true, // Emergency timer elapsed!
    });

    expect(result).not.toBeNull();
    expect(result?.winner).toBe('DISRUPTORS');
    expect(result?.reason).toBe('CRITICAL_SABOTAGE_COLLAPSE');
  });

  it('Ongoing Match returns null when no win condition is satisfied', () => {
    const result = checkWinCondition({
      players: basePlayers,
      completedTasks: 7,
      totalTasks: 15,
      criticalSabotageExpired: false,
    });

    expect(result).toBeNull();
  });
});
