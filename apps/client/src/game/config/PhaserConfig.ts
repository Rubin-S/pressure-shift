import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.js';
import { FacilityScene } from '../scenes/FacilityScene.js';

export function createGameConfig(container: HTMLElement | string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: container,
    width: '100%',
    height: '100%',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#020712',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, FacilityScene],
  };
}
