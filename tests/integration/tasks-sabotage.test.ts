import { describe, it, expect } from 'vitest';
import {
  STATIC_TASK_DEFINITIONS,
  SABOTAGE_DEFINITIONS,
  checkWinCondition,
  isWithinRadius,
  TaskType,
  SabotageType,
  ActiveSabotage,
} from '@pressure-shift/shared';

describe('Tasks & Sabotages Integration Tests', () => {
  describe('8 Mini-game Task Specifications', () => {
    it('defines all 8 required mini-game task definitions', () => {
      const taskValues = Object.values(STATIC_TASK_DEFINITIONS);
      const taskTypes = taskValues.map((t) => t.type);
      const expectedTypes: TaskType[] = [
        'sonar_calibration',
        'electrical_circuit',
        'pressure_valve',
        'power_routing',
        'bio_sample_sort',
        'sensor_alignment',
        'ballast_pump',
        'filtration_clear',
      ];

      for (const expected of expectedTypes) {
        expect(taskTypes).toContain(expected);
      }
    });

    it('each task definition has valid position coordinates and interaction radius', () => {
      for (const task of Object.values(STATIC_TASK_DEFINITIONS)) {
        expect(task.location.x).toBeGreaterThan(0);
        expect(task.location.y).toBeGreaterThan(0);
        expect(task.interactRadius).toBeGreaterThanOrEqual(40);
        expect(task.name).toBeTruthy();
        expect(task.room).toBeTruthy();
      }
    });
  });

  describe('Task Progress Meter Calculation', () => {
    it('calculates global task percentage accurately', () => {
      const totalTasks = 15; // 3 operators * 5 tasks each
      let completedTasks = 0;

      const getProgress = () => Math.round((completedTasks / totalTasks) * 100);

      expect(getProgress()).toBe(0);

      completedTasks += 3;
      expect(getProgress()).toBe(20);

      completedTasks += 9;
      expect(getProgress()).toBe(80);

      completedTasks += 3;
      expect(getProgress()).toBe(100);
    });

    it('Operators win immediately when task meter reaches 100%', () => {
      const players = [
        { id: 'op1', name: 'Op1', role: 'OPERATOR' as const, isAlive: true },
        { id: 'op2', name: 'Op2', role: 'OPERATOR' as const, isAlive: true },
        { id: 'dis1', name: 'Disruptor1', role: 'DISRUPTOR' as const, isAlive: true },
      ];

      const outcome = checkWinCondition({
        players,
        completedTasks: 10,
        totalTasks: 10,
        criticalSabotageExpired: false,
      });

      expect(outcome).not.toBeNull();
      expect(outcome?.winner).toBe('OPERATORS');
      expect(outcome?.reason).toBe('TASKS_COMPLETED');
    });

    it('Ghosts/Spectators can complete tasks to help living Operators win', () => {
      const players = [
        { id: 'op1', name: 'Op1', role: 'OPERATOR' as const, isAlive: true },
        { id: 'op2', name: 'Op2', role: 'OPERATOR' as const, isAlive: true },
        { id: 'ghost_op', name: 'KilledOp', role: 'OPERATOR' as const, isAlive: false }, // Ghost!
        { id: 'dis1', name: 'Disruptor1', role: 'DISRUPTOR' as const, isAlive: true },
      ];

      // 2 living operators > 1 disruptor, so parity win doesn't trigger.
      // Ghost finishes their remaining task -> 15/15 complete!
      const outcome = checkWinCondition({
        players,
        completedTasks: 15,
        totalTasks: 15,
        criticalSabotageExpired: false,
      });

      expect(outcome?.winner).toBe('OPERATORS');
      expect(outcome?.reason).toBe('TASKS_COMPLETED');
    });
  });

  describe('Sabotage Mechanics & Critical Countdown', () => {
    it('defines the 4 station sabotage archetypes', () => {
      const sabotageKeys = Object.keys(SABOTAGE_DEFINITIONS) as SabotageType[];
      expect(sabotageKeys).toContain('oxygen_depletion');
      expect(sabotageKeys).toContain('reactor_meltdown');
      expect(sabotageKeys).toContain('communications_interference');
      expect(sabotageKeys).toContain('door_lockdown');
    });

    it('critical sabotages (Oxygen & Reactor) have 45s countdown', () => {
      const oxygenSabotage = SABOTAGE_DEFINITIONS['oxygen_depletion'];
      expect(oxygenSabotage.isCritical).toBe(true);
      expect(oxygenSabotage.criticalTimerSeconds).toBe(45);

      const reactorSabotage = SABOTAGE_DEFINITIONS['reactor_meltdown'];
      expect(reactorSabotage.isCritical).toBe(true);
      expect(reactorSabotage.criticalTimerSeconds).toBe(45);
    });

    it('Disruptors win immediately when critical sabotage countdown reaches 0', () => {
      const players = [
        { id: 'op1', name: 'Op1', role: 'OPERATOR' as const, isAlive: true },
        { id: 'op2', name: 'Op2', role: 'OPERATOR' as const, isAlive: true },
        { id: 'op3', name: 'Op3', role: 'OPERATOR' as const, isAlive: true },
        { id: 'dis1', name: 'Disruptor1', role: 'DISRUPTOR' as const, isAlive: true },
      ];

      const outcome = checkWinCondition({
        players,
        completedTasks: 2,
        totalTasks: 15,
        criticalSabotageExpired: true, // Sabotage expired!
      });

      expect(outcome).not.toBeNull();
      expect(outcome?.winner).toBe('DISRUPTORS');
      expect(outcome?.reason).toBe('CRITICAL_SABOTAGE_COLLAPSE');
    });

    it('requires dual repair stations for oxygen depletion emergency', () => {
      const oxygenDef = SABOTAGE_DEFINITIONS['oxygen_depletion'];
      expect(oxygenDef.defaultStations.length).toBe(2);

      const active: ActiveSabotage = {
        type: 'oxygen_depletion',
        startedAt: Date.now(),
        countdownSeconds: 45,
        expiresAt: Date.now() + 45000,
        isCritical: true,
        repairedStations: ['station_oxy_hydroponics'],
      };

      // 1 station repaired is not fully cleared
      const isCleared = active.repairedStations.length === oxygenDef.defaultStations.length;
      expect(isCleared).toBe(false);

      // 2nd station repaired -> fully cleared!
      active.repairedStations.push('station_oxy_observation');
      const isNowCleared = active.repairedStations.length === oxygenDef.defaultStations.length;
      expect(isNowCleared).toBe(true);
    });
  });
});
