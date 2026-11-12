import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameBridge } from '../GameBridge.js';
import {
  PlayerPublicView,
  PlayerPrivateView,
  DeadBody,
  PlayerTask,
  ActiveSabotage,
} from '@pressure-shift/shared';
import { InteractableInfo, KillTargetInfo } from '../types.js';

describe('GameBridge', () => {
  let bridge: GameBridge;

  beforeEach(() => {
    bridge = GameBridge.getInstance();
    bridge.reset();
  });

  it('maintains singleton pattern', () => {
    const instanceA = GameBridge.getInstance();
    const instanceB = GameBridge.getInstance();
    expect(instanceA).toBe(instanceB);
  });

  it('manages local player state and resets cleanly', () => {
    const mockPlayer: PlayerPrivateView = {
      id: 'p_local',
      name: 'Tester',
      color: 'neon_cyan',
      cosmetic: 'standard_helm',
      role: 'OPERATOR',
      isAlive: true,
      isReady: true,
      position: { x: 1200, y: 900 },
      facing: 'down',
      currentRoom: 'central_junction',
      currentTask: null,
      isHost: true,
      connected: true,
      assignedTasks: [],
      emergencyMeetingsRemaining: 1,
    };

    bridge.setLocalPlayer(mockPlayer);
    expect(bridge.localPlayer?.id).toBe('p_local');
    expect(bridge.localPlayer?.role).toBe('OPERATOR');

    bridge.reset();
    expect(bridge.localPlayer).toBeNull();
  });

  it('manages remote players roster without including local player', () => {
    const local: PlayerPublicView = {
      id: 'p_local',
      name: 'LocalPlayer',
      color: 'neon_cyan',
      cosmetic: 'standard_helm',
      isAlive: true,
      isReady: true,
      position: { x: 100, y: 100 },
      facing: 'down',
      currentRoom: 'docking_cradle',
      currentTask: null,
      isHost: false,
      connected: true,
    };

    const remote1: PlayerPublicView = {
      id: 'p_remote1',
      name: 'Remote1',
      color: 'coral_red',
      cosmetic: 'deep_diver',
      isAlive: true,
      isReady: true,
      position: { x: 200, y: 200 },
      facing: 'left',
      currentRoom: 'sonar_control',
      currentTask: null,
      isHost: false,
      connected: true,
    };

    bridge.setLocalPlayer(local);
    bridge.setRemotePlayers([local, remote1]);

    expect(bridge.remotePlayers.size).toBe(1);
    expect(bridge.remotePlayers.has('p_remote1')).toBe(true);
    expect(bridge.remotePlayers.has('p_local')).toBe(false);
  });

  it('emits player moved events and room change events', () => {
    const moveListener = vi.fn();
    const roomListener = vi.fn();

    const unsubMove = bridge.on('player:moved', moveListener);
    const unsubRoom = bridge.on('player:room_changed', roomListener);

    bridge.emitPlayerMoved({
      x: 350,
      y: 300,
      facing: 'right',
      room: 'docking_cradle',
      timestamp: 12345678,
    });

    expect(moveListener).toHaveBeenCalledWith({
      x: 350,
      y: 300,
      facing: 'right',
      room: 'docking_cradle',
      timestamp: 12345678,
    });

    bridge.emitRoomChanged('docking_cradle');
    expect(roomListener).toHaveBeenCalledWith('docking_cradle');

    unsubMove();
    unsubRoom();
  });

  it('handles interactables, task trigger, and out-of-range events', () => {
    const inRangeListener = vi.fn();
    const outOfRangeListener = vi.fn();
    const taskListener = vi.fn();

    bridge.on('interactable:in_range', inRangeListener);
    bridge.on('interactable:out_of_range', outOfRangeListener);
    bridge.on('task:triggered', taskListener);

    const taskInfo: InteractableInfo = {
      type: 'task',
      id: 'task_sonar_cal',
      name: 'Sonar Calibration',
      promptKey: '[E]',
      promptText: 'USE: SONAR CALIBRATION',
      room: 'sonar_control',
      position: { x: 1200, y: 250 },
      distance: 35,
    };

    bridge.emitInteractableInRange(taskInfo);
    expect(inRangeListener).toHaveBeenCalledWith(taskInfo);
    expect(bridge.currentInteractable).toEqual(taskInfo);

    // Trigger action
    bridge.triggerAction('use');
    expect(taskListener).toHaveBeenCalledWith('task_sonar_cal');

    bridge.emitInteractableOutOfRange();
    expect(outOfRangeListener).toHaveBeenCalled();
    expect(bridge.currentInteractable).toBeNull();
  });

  it('handles kill target updates and kill attempts for Disruptor', () => {
    const killTargetListener = vi.fn();
    const killAttemptListener = vi.fn();

    bridge.on('kill_target:updated', killTargetListener);
    bridge.on('kill:attempted', killAttemptListener);

    const killTarget: KillTargetInfo = {
      targetId: 'victim_123',
      targetName: 'Innocent Operator',
      position: { x: 300, y: 300 },
      distance: 40,
    };

    bridge.emitKillTargetUpdated(killTarget);
    expect(killTargetListener).toHaveBeenCalledWith(killTarget);
    expect(bridge.currentKillTarget).toEqual(killTarget);

    bridge.triggerAction('kill');
    expect(killAttemptListener).toHaveBeenCalledWith('victim_123');
  });

  it('handles dead bodies and reporting', () => {
    const reportListener = vi.fn();
    bridge.on('body:reported', reportListener);

    const deadBody: DeadBody = {
      id: 'body_1',
      victimId: 'victim_123',
      victimName: 'Innocent Operator',
      victimColor: 'kelp_green',
      position: { x: 500, y: 500 },
      room: 'docking_cradle',
      reported: false,
      createdAt: Date.now(),
    };

    bridge.setDeadBodies([deadBody]);
    expect(bridge.deadBodies.size).toBe(1);

    const bodyInteractable: InteractableInfo = {
      type: 'body',
      id: 'body_1',
      name: 'Dead Body: Innocent Operator',
      promptKey: '[R]',
      promptText: 'REPORT DEAD BODY',
      room: 'docking_cradle',
      position: { x: 500, y: 500 },
      distance: 30,
    };

    bridge.emitInteractableInRange(bodyInteractable);
    bridge.triggerAction('report');
    expect(reportListener).toHaveBeenCalledWith('body_1');
  });

  it('updates sabotage and toggles emergency alarm flag on critical sabotages', () => {
    const criticalSabotage: ActiveSabotage = {
      type: 'oxygen_depletion',
      name: 'Oxygen / Pressure Depletion Emergency',
      isCritical: true,
      timeRemaining: 45,
      totalDuration: 45,
      triggeredAt: Date.now(),
      requiredStations: [],
    };

    bridge.setSabotage(criticalSabotage);
    expect(bridge.activeSabotage?.type).toBe('oxygen_depletion');
    expect(bridge.isEmergencyAlarmActive).toBe(true);

    bridge.setSabotage(null);
    expect(bridge.activeSabotage).toBeNull();
    expect(bridge.isEmergencyAlarmActive).toBe(false);
  });

  it('tracks door lockdowns for rooms', () => {
    bridge.setDoorLockdowns(['docking_cradle', 'pressure_lab']);
    expect(bridge.lockedDoors.has('docking_cradle')).toBe(true);
    expect(bridge.lockedDoors.has('pressure_lab')).toBe(true);
    expect(bridge.lockedDoors.has('sonar_control')).toBe(false);
  });
});
