import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoomManager } from '../game/room-manager.js';
import { GameRoom } from '../game/room.js';
import { ServerPlayer } from '../types.js';

describe('Sabotage & Tasks Mechanics Unit Tests', () => {
  let roomManager: RoomManager;
  let room: GameRoom;
  let disruptor: ServerPlayer;
  let operator: ServerPlayer;

  beforeEach(() => {
    roomManager = new RoomManager();
    const created = roomManager.createRoom({ playerName: 'P1', socketId: 's1' });
    room = created.room;
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P2', socketId: 's2' });
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P3', socketId: 's3' });
    roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'P4', socketId: 's4' });

    for (const p of room.getAllPlayersList()) room.setPlayerReady(p.id, true);

    room.startMatch({ numDisruptors: 1, operatorTaskCount: 3 });

    disruptor = room.getAllPlayersList().find((p) => p.role === 'DISRUPTOR')!;
    operator = room.getAllPlayersList().find((p) => p.role === 'OPERATOR')!;
  });

  afterEach(() => {
    room.destroy();
  });

  describe('Sabotage Mechanics', () => {
    it('allows Disruptor to trigger communications interference and Operators to repair it', () => {
      disruptor.sabotageCooldownRemaining = 0;
      const trig = room.handleTriggerSabotage(disruptor.id, 'communications_interference');
      expect(trig.success).toBe(true);

      const active = room.sabotageManager.getActiveSabotage();
      expect(active).not.toBeNull();
      expect(active?.type).toBe('communications_interference');
      expect(active?.isCritical).toBe(false);

      // Operator moves to communications terminal to repair
      const station = active!.requiredStations[0];
      operator.position = { x: station.location.x, y: station.location.y };

      const repair = room.handleRepairSabotage(operator.id, 'communications_interference', station.id);
      expect(repair.success).toBe(true);
      expect(room.sabotageManager.getActiveSabotage()).toBeNull();
    });

    it('handles multi-station critical sabotages requiring all consoles to clear', () => {
      disruptor.sabotageCooldownRemaining = 0;
      const trig = room.handleTriggerSabotage(disruptor.id, 'oxygen_depletion');
      expect(trig.success).toBe(true);

      const active = room.sabotageManager.getActiveSabotage()!;
      expect(active.requiredStations).toHaveLength(2);

      const st1 = active.requiredStations[0];
      const st2 = active.requiredStations[1];

      // Operator repairs station 1
      operator.position = { x: st1.location.x, y: st1.location.y };
      const rep1 = room.handleRepairSabotage(operator.id, 'oxygen_depletion', st1.id);
      expect(rep1.success).toBe(true);
      expect(room.sabotageManager.getActiveSabotage()).not.toBeNull(); // Still 1 remaining!

      // Operator repairs station 2
      operator.position = { x: st2.location.x, y: st2.location.y };
      const rep2 = room.handleRepairSabotage(operator.id, 'oxygen_depletion', st2.id);
      expect(rep2.success).toBe(true);
      expect(room.sabotageManager.getActiveSabotage()).toBeNull(); // Now cleared!
    });

    it('clears bulkhead door lockdown automatically when duration expires', () => {
      disruptor.sabotageCooldownRemaining = 0;
      const trig = room.handleTriggerSabotage(disruptor.id, 'door_lockdown', 'medical_bay');
      expect(trig.success).toBe(true);

      expect(room.sabotageManager.getActiveSabotage()?.type).toBe('door_lockdown');

      // Tick past 13 seconds (door lockdown lasts 12s)
      room.tick(13);
      expect(room.sabotageManager.getActiveSabotage()).toBeNull();
    });
  });

  describe('Task Interaction & Progression', () => {
    it('manages task start and cancel state transitions', () => {
      const task = operator.tasks[0];
      operator.position = { x: task.location.x, y: task.location.y };

      const startRes = room.handleTaskInteract(operator.id, task.taskId, 'start');
      expect(startRes.success).toBe(true);
      expect(operator.currentTask).toBe(task.taskId);

      const cancelRes = room.handleTaskInteract(operator.id, task.taskId, 'cancel');
      expect(cancelRes.success).toBe(true);
      expect(operator.currentTask).toBeNull();
    });

    it('rejects task interaction when player is out of interaction range', () => {
      const task = operator.tasks[0];
      operator.position = { x: task.location.x + 300, y: task.location.y + 300 };

      const startRes = room.handleTaskInteract(operator.id, task.taskId, 'start');
      expect(startRes.success).toBe(false);
      expect(startRes.error).toMatch(/too far/i);
    });
  });
});
