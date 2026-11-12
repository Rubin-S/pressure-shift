import Phaser from 'phaser';
import { FacilityRoomId, Position2D } from '@pressure-shift/shared';
import { InteractableType } from '../types.js';

export interface StationConfig {
  type: InteractableType;
  id: string;
  name: string;
  room: FacilityRoomId;
  position: Position2D;
  texture: string;
  interactRadius: number;
  promptKey: string;
  promptText: string;
}

export class InteractableStation extends Phaser.GameObjects.Container {
  public config: StationConfig;
  public sprite: Phaser.GameObjects.Sprite;
  public aura: Phaser.GameObjects.Arc;
  public labelText: Phaser.GameObjects.Text;
  public isHighlighted = false;

  constructor(scene: Phaser.Scene, config: StationConfig) {
    super(scene, config.position.x, config.position.y);
    this.config = config;

    // Glowing aura circle (for active / nearby state)
    this.aura = scene.add.circle(0, 0, config.interactRadius, 0x00f3ff, 0.12);
    this.aura.setVisible(false);
    this.add(this.aura);

    // Station sprite
    this.sprite = scene.add.sprite(0, 0, config.texture);
    this.add(this.sprite);

    // Station floating name label
    this.labelText = scene.add.text(0, -28, config.name, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#a0c4e8',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    });
    this.labelText.setOrigin(0.5, 0.5);
    this.labelText.setVisible(false);
    this.add(this.labelText);

    scene.add.existing(this);
  }

  public setHighlighted(highlighted: boolean, color = 0x00f3ff): void {
    if (this.isHighlighted === highlighted) return;
    this.isHighlighted = highlighted;

    this.aura.setFillStyle(color, highlighted ? 0.22 : 0.0);
    this.aura.setVisible(highlighted);
    this.labelText.setVisible(highlighted);

    if (highlighted) {
      this.scene.tweens.add({
        targets: this.aura,
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 0.1,
        yoyo: true,
        repeat: -1,
        duration: 800,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.scene.tweens.killTweensOf(this.aura);
      this.aura.setScale(1);
    }
  }
}
