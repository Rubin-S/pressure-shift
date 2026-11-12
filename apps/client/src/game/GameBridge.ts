import {
  PlayerPublicView,
  PlayerPrivateView,
  DeadBody,
  PlayerTask,
  ActiveSabotage,
  FacilityRoomId,
} from '@pressure-shift/shared';
import {
  GameBridgeEvents,
  GameBridgeEventName,
  InteractableInfo,
  KillTargetInfo,
  PlayerMoveEventPayload,
} from './types.js';

export class GameBridge {
  private static instance: GameBridge | null = null;
  private listeners: Map<GameBridgeEventName, Set<(...args: any[]) => void>> = new Map();

  // Synced state caches for scenes to access on boot or transition
  public localPlayer: PlayerPrivateView | PlayerPublicView | null = null;
  public remotePlayers: Map<string, PlayerPublicView> = new Map();
  public deadBodies: Map<string, DeadBody> = new Map();
  public assignedTasks: PlayerTask[] = [];
  public activeSabotage: ActiveSabotage | null = null;
  public lockedDoors: Set<FacilityRoomId> = new Set();
  public movementEnabled = true;
  public isEmergencyAlarmActive = false;
  public currentInteractable: InteractableInfo | null = null;
  public currentKillTarget: KillTargetInfo | null = null;

  public static getInstance(): GameBridge {
    if (!GameBridge.instance) {
      GameBridge.instance = new GameBridge();
    }
    return GameBridge.instance;
  }

  public on<K extends GameBridgeEventName>(event: K, listener: GameBridgeEvents[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as (...args: any[]) => void);
    return () => this.off(event, listener);
  }

  public off<K extends GameBridgeEventName>(event: K, listener: GameBridgeEvents[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener as (...args: any[]) => void);
    }
  }

  public emit<K extends GameBridgeEventName>(event: K, ...args: Parameters<GameBridgeEvents[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of set) {
        try {
          (listener as any)(...args);
        } catch (err) {
          console.error(`Error in GameBridge listener for event '${event}':`, err);
        }
      }
    }
  }

  // --- Methods called by UI / Network layer ---

  public setLocalPlayer(player: PlayerPrivateView | PlayerPublicView | null): void {
    this.localPlayer = player;
  }

  public setRemotePlayers(players: PlayerPublicView[]): void {
    this.remotePlayers.clear();
    const localId = this.localPlayer?.id;
    for (const p of players) {
      if (p.id !== localId) {
        this.remotePlayers.set(p.id, p);
      }
    }
  }

  public setDeadBodies(bodies: DeadBody[]): void {
    this.deadBodies.clear();
    for (const b of bodies) {
      this.deadBodies.set(b.id, b);
    }
  }

  public setTasks(tasks: PlayerTask[]): void {
    this.assignedTasks = [...tasks];
  }

  public setSabotage(sabotage: ActiveSabotage | null): void {
    this.activeSabotage = sabotage;
    this.isEmergencyAlarmActive = !!sabotage && (sabotage.type === 'oxygen_depletion' || sabotage.type === 'reactor_meltdown');
  }

  public setDoorLockdowns(rooms: FacilityRoomId[]): void {
    this.lockedDoors.clear();
    for (const r of rooms) {
      this.lockedDoors.add(r);
    }
  }

  public setMovementEnabled(enabled: boolean): void {
    this.movementEnabled = enabled;
  }

  public triggerAction(action: 'use' | 'kill' | 'report'): void {
    if (action === 'use' && this.currentInteractable) {
      this.emitInteractTriggered(this.currentInteractable);
    } else if (action === 'kill' && this.currentKillTarget) {
      this.emitKillAttempted(this.currentKillTarget.targetId);
    } else if (action === 'report' && this.currentInteractable?.type === 'body') {
      this.emitBodyReported(this.currentInteractable.id);
    }
  }

  // --- Methods called by Phaser scenes ---

  public emitPlayerMoved(payload: PlayerMoveEventPayload): void {
    this.emit('player:moved', payload);
  }

  public emitRoomChanged(room: FacilityRoomId): void {
    this.emit('player:room_changed', room);
  }

  public emitInteractableInRange(info: InteractableInfo): void {
    this.currentInteractable = info;
    this.emit('interactable:in_range', info);
  }

  public emitInteractableOutOfRange(): void {
    this.currentInteractable = null;
    this.emit('interactable:out_of_range');
  }

  public emitInteractTriggered(info: InteractableInfo): void {
    this.emit('interact:triggered', info);
    switch (info.type) {
      case 'task':
        this.emit('task:triggered', info.id);
        break;
      case 'emergency_button':
        this.emit('emergency_button:triggered');
        break;
      case 'body':
        this.emit('body:reported', info.id);
        break;
      case 'vent':
        this.emit('vent:used', info.id);
        break;
      case 'sabotage_repair':
        this.emit('sabotage_repair:triggered', info.id);
        break;
      case 'kill_target':
        this.emit('kill:attempted', info.id);
        break;
    }
  }

  public emitEmergencyButtonTriggered(): void {
    this.emit('emergency_button:triggered');
  }

  public emitBodyReported(bodyId: string): void {
    this.emit('body:reported', bodyId);
  }

  public emitVentUsed(ventId: string): void {
    this.emit('vent:used', ventId);
  }

  public emitSabotageRepairTriggered(stationId: string): void {
    this.emit('sabotage_repair:triggered', stationId);
  }

  public emitKillAttempted(targetId: string): void {
    this.emit('kill:attempted', targetId);
  }

  public emitKillTargetUpdated(target: KillTargetInfo | null): void {
    this.currentKillTarget = target;
    this.emit('kill_target:updated', target);
  }

  public emitGameReady(): void {
    this.emit('game:ready');
  }

  public reset(): void {
    this.localPlayer = null;
    this.remotePlayers.clear();
    this.deadBodies.clear();
    this.assignedTasks = [];
    this.activeSabotage = null;
    this.lockedDoors.clear();
    this.movementEnabled = true;
    this.isEmergencyAlarmActive = false;
    this.currentInteractable = null;
    this.currentKillTarget = null;
    this.listeners.clear();
  }
}

export const gameBridge = GameBridge.getInstance();
