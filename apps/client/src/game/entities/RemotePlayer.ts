import Phaser from 'phaser';
import {
  PlayerPublicView,
  PlayerFacing,
  PLAYER_COLORS,
} from '@pressure-shift/shared';

export class RemotePlayer extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite;
  public cosmeticSprite?: Phaser.GameObjects.Sprite;
  public nameText: Phaser.GameObjects.Text;

  public playerData: PlayerPublicView;
  public targetX: number;
  public targetY: number;
  public facing: PlayerFacing = 'down';
  public isAlive: boolean;

  private prevX: number;
  private prevY: number;

  constructor(scene: Phaser.Scene, playerData: PlayerPublicView) {
    super(scene, playerData.position.x, playerData.position.y);
    this.playerData = playerData;
    this.targetX = playerData.position.x;
    this.targetY = playerData.position.y;
    this.prevX = playerData.position.x;
    this.prevY = playerData.position.y;
    this.facing = playerData.facing;
    this.isAlive = playerData.isAlive;

    // 1. Diver sprite
    this.sprite = scene.add.sprite(0, 0, 'player_diver_sheet', 0);
    this.add(this.sprite);

    // 2. Cosmetic overlay
    if (playerData.cosmetic && playerData.cosmetic !== 'standard_helm') {
      const cosmeticIndex = this.getCosmeticIndex(playerData.cosmetic);
      if (cosmeticIndex >= 0) {
        this.cosmeticSprite = scene.add.sprite(0, -16, 'cosmetics_sheet', cosmeticIndex);
        this.add(this.cosmeticSprite);
      }
    }

    // 3. Name tag
    this.nameText = scene.add.text(0, -32, playerData.name, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // Apply color tint
    this.applyPlayerColor(playerData.color);

    // Set alive/ghost state
    this.setAliveState(playerData.isAlive);

    scene.add.existing(this);
  }

  private getCosmeticIndex(cosmetic: string): number {
    const list = [
      'standard_helm',
      'deep_diver',
      'welding_mask',
      'captain_cap',
      'biologist_goggles',
      'hazard_rebreather',
      'aquanaut_beret',
      'sonar_headset',
    ];
    return list.indexOf(cosmetic);
  }

  public applyPlayerColor(colorId: string): void {
    const colorDef = (PLAYER_COLORS as any)[colorId];
    if (colorDef) {
      const tint = Phaser.Display.Color.HexStringToColor(colorDef.hex).color;
      this.sprite.setTint(tint);
    }
  }

  public setAliveState(isAlive: boolean): void {
    this.isAlive = isAlive;
    this.playerData.isAlive = isAlive;

    if (!isAlive) {
      this.sprite.setTexture('player_ghost_sheet', 0);
      this.sprite.play('ghost-hover', true);
      this.setAlpha(0.65);
      if (this.cosmeticSprite) {
        this.cosmeticSprite.setVisible(false);
      }
    } else {
      this.sprite.setTexture('player_diver_sheet', 0);
      this.setAlpha(1.0);
      if (this.cosmeticSprite) {
        this.cosmeticSprite.setVisible(true);
      }
    }
  }

  public updateTargetPosition(x: number, y: number, facing: PlayerFacing): void {
    this.targetX = x;
    this.targetY = y;
    this.facing = facing;
  }

  public update(_time: number, delta: number): void {
    this.prevX = this.x;
    this.prevY = this.y;

    // Smooth authoritative interpolation: exponential damping towards target
    const factor = Math.min(1.0, 1.0 - Math.exp(-15 * (delta / 1000)));
    this.x = Phaser.Math.Linear(this.x, this.targetX, factor);
    this.y = Phaser.Math.Linear(this.y, this.targetY, factor);

    const vx = this.x - this.prevX;
    const vy = this.y - this.prevY;
    const speed = Math.sqrt(vx * vx + vy * vy);

    const isMoving = speed > 0.3;

    if (isMoving) {
      if (Math.abs(vy) > Math.abs(vx)) {
        this.facing = vy > 0 ? 'down' : 'up';
      } else {
        this.facing = vx > 0 ? 'right' : 'left';
      }
      this.playWalkingAnimation();
    } else {
      this.stopWalkingAnimation();
    }

    // Cosmetic offset
    if (this.cosmeticSprite) {
      if (this.facing === 'left') {
        this.cosmeticSprite.setX(-2);
        this.cosmeticSprite.setFlipX(true);
      } else if (this.facing === 'right') {
        this.cosmeticSprite.setX(2);
        this.cosmeticSprite.setFlipX(false);
      } else {
        this.cosmeticSprite.setX(0);
        this.cosmeticSprite.setFlipX(false);
      }
    }
  }

  private playWalkingAnimation(): void {
    if (!this.isAlive) {
      this.sprite.play('ghost-hover', true);
      return;
    }

    switch (this.facing) {
      case 'down':
        this.sprite.play('player-walk-down', true);
        break;
      case 'up':
        this.sprite.play('player-walk-up', true);
        break;
      case 'left':
        this.sprite.play('player-walk-left', true);
        break;
      case 'right':
        this.sprite.play('player-walk-right', true);
        break;
    }
  }

  private stopWalkingAnimation(): void {
    if (!this.isAlive) return;

    switch (this.facing) {
      case 'down':
        this.sprite.setFrame(0);
        break;
      case 'left':
        this.sprite.setFrame(4);
        break;
      case 'right':
        this.sprite.setFrame(8);
        break;
      case 'up':
        this.sprite.setFrame(12);
        break;
    }
    this.sprite.stop();
  }
}
