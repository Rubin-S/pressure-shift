// Event bridge connecting React UI overlays with Phaser Game Canvas
import { gameBridge as phaserGameBridge, GameBridge } from '../../game/GameBridge.js';
import { InteractableInfo } from '../../game/types.js';

export type InteractableTarget = {
  type: 'task' | 'body' | 'emergency' | 'sabotage_station';
  id: string;
  name: string;
  room?: string;
  details?: Record<string, unknown>;
} | null;

export { phaserGameBridge, GameBridge };
export const gameBridge = phaserGameBridge;
