import Phaser from 'phaser';
import { createGameConfig } from './config/PhaserConfig.js';
import { gameBridge, GameBridge } from './GameBridge.js';

export function createPressureShiftGame(container: HTMLElement | string): Phaser.Game {
  try {
    const config = createGameConfig(container, Phaser.AUTO);
    return new Phaser.Game(config);
  } catch (err) {
    console.warn('[Phaser] WebGL init failed, falling back to Canvas renderer:', err);
    const fallbackConfig = createGameConfig(container, Phaser.CANVAS);
    return new Phaser.Game(fallbackConfig);
  }
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
