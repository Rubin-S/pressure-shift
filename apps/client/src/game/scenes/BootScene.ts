import Phaser from 'phaser';
import { AssetGenerator } from '../assets/AssetGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // 1. Generate procedural pixel art assets & spritesheets
    AssetGenerator.generateAll(this);

    // 2. Preload studio-grade high-resolution room environments matching the approved visual reference
    this.load.image('room_bg_central_junction', '/assets/v2/mobile_views/01_command_rotunda.jpg');
    this.load.image('room_bg_docking_cradle', '/assets/v2/mobile_views/02_moon_pool_dock.jpg');
    this.load.image('room_bg_sonar_control', '/assets/v2/mobile_views/03_sonar_array.jpg');
    this.load.image('room_bg_communications', '/assets/v2/mobile_views/04_comms_circuit.jpg');
    this.load.image('room_bg_pressure_lab', '/assets/v2/mobile_views/05_black_chamber_anomaly.jpg');
    this.load.image('room_bg_thermal_plant', '/assets/v2/mobile_views/06_geothermal_catwalk.jpg');
    this.load.image('room_bg_hydroponics', '/assets/v2/mobile_views/07_hydroponics_dome.jpg');
    this.load.image('room_bg_observation_gallery', '/assets/v2/mobile_views/08_trench_overlook.jpg');
    this.load.image('room_bg_medical_bay', '/assets/v2/mobile_views/05_black_chamber_anomaly.jpg');
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
