import Phaser from 'phaser';
import { createGameConfig } from './config/PhaserConfig.js';
import { gameBridge, GameBridge } from './GameBridge.js';

export function createPressureShiftGame(container: HTMLElement | string): Phaser.Game {
  const config = createGameConfig(container);
  return new Phaser.Game(config);
}

export { gameBridge, GameBridge };
export * from './types.js';
export * from './scenes/BootScene.js';
export * from './scenes/FacilityScene.js';
export * from './entities/LocalPlayer.js';
export * from './entities/RemotePlayer.js';
export * from './entities/DeadBodyEntity.js';
export * from './entities/InteractableStation.js';
export * from './assets/AssetGenerator.js';
