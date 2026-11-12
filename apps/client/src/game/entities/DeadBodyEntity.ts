import Phaser from 'phaser';
import { DeadBody, PLAYER_COLORS } from '@pressure-shift/shared';

export class DeadBodyEntity extends Phaser.GameObjects.Container {
  public bodyData: DeadBody;
  public sprite: Phaser.GameObjects.Sprite;
  public labelText: Phaser.GameObjects.Text;
  public beaconGlow: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, bodyData: DeadBody) {
    super(scene, bodyData.position.x, bodyData.position.y);
    this.bodyData = bodyData;

    // 1. Pulsing distress circle
    this.beaconGlow = scene.add.circle(0, 0, 22, 0xff1744, 0.25);
    scene.tweens.add({
      targets: this.beaconGlow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.0,
      duration: 1000,
      repeat: -1,
      ease: 'Cubic.easeOut',
    });
    this.add(this.beaconGlow);

    // 2. Dead body sprite
    this.sprite = scene.add.sprite(0, 0, 'prop_dead_body');
    // Tint victim's color
    const colorDef = (PLAYER_COLORS as any)[bodyData.victimColor];
    if (colorDef) {
      const tint = Phaser.Display.Color.HexStringToColor(colorDef.hex).color;
      this.sprite.setTint(tint);
    }
    this.add(this.sprite);

    // 3. Name label
    this.labelText = scene.add.text(0, -22, `${bodyData.victimName} (DEAD)`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ff3864',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    this.labelText.setOrigin(0.5, 0.5);
    this.add(this.labelText);

    scene.add.existing(this);
  }
}
