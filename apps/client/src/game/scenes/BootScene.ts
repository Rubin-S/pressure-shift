import Phaser from 'phaser';
import { AssetGenerator } from '../assets/AssetGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // Generate all procedural pixel art assets
    AssetGenerator.generateAll(this);
  }

  public create(): void {
    // Register diver walk cycle animations
    this.anims.create({
      key: 'player-walk-down',
      frames: this.anims.generateFrameNumbers('player_diver_sheet', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-walk-left',
      frames: this.anims.generateFrameNumbers('player_diver_sheet', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-walk-right',
      frames: this.anims.generateFrameNumbers('player_diver_sheet', { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-walk-up',
      frames: this.anims.generateFrameNumbers('player_diver_sheet', { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1,
    });

    // Ghost floating animation
    this.anims.create({
      key: 'ghost-hover',
      frames: this.anims.generateFrameNumbers('player_ghost_sheet', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });

    // Transition to the main underwater facility scene
    this.scene.start('FacilityScene');
  }
}
