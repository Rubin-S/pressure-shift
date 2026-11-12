import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.js';
import { FacilityScene } from '../scenes/FacilityScene.js';

export function createGameConfig(
  container: HTMLElement | string,
  renderType: number = Phaser.AUTO
): Phaser.Types.Core.GameConfig {
  const w = typeof window !== 'undefined' ? window.innerWidth || 1280 : 1280;
  const h = typeof window !== 'undefined' ? window.innerHeight || 720 : 720;

  return {
    type: renderType,
    parent: container,
    width: w,
    height: h,
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
