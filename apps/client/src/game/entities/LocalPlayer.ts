import Phaser from 'phaser';
import {
  FacilityRoomId,
  PlayerFacing,
  PlayerPrivateView,
  PlayerPublicView,
  FACILITY_ROOMS,
  PLAYER_COLORS,
  DEFAULT_ROOM_SETTINGS,
} from '@pressure-shift/shared';
import { GameBridge } from '../GameBridge.js';
import { InteractableInfo } from '../types.js';

export class LocalPlayer extends Phaser.GameObjects.Container {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public cosmeticSprite?: Phaser.GameObjects.Sprite;
  public nameText: Phaser.GameObjects.Text;
  public promptContainer: Phaser.GameObjects.Container;
  public promptText: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;
  private keyQ!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  public playerData: PlayerPrivateView | PlayerPublicView;
  public currentRoom: FacilityRoomId = 'central_junction';
  public facing: PlayerFacing = 'down';
  public speed: number = DEFAULT_ROOM_SETTINGS.playerSpeed ?? 200;

  private lastNetworkEmitTime = 0;
  private lastEmitX = 0;
  private lastEmitY = 0;
  private lastEmitFacing: PlayerFacing = 'down';
  private bridge: GameBridge;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerData: PlayerPrivateView | PlayerPublicView,
    bridge: GameBridge
  ) {
    super(scene, x, y);
    this.playerData = playerData;
    this.bridge = bridge;

    // 1. Base diver physics sprite
    this.sprite = scene.physics.add.sprite(0, 0, 'player_diver_sheet', 0);
    this.sprite.setSize(24, 28);
    this.sprite.setOffset(12, 16);
    this.add(this.sprite);

    // 2. Cosmetic hat/helmet overlay if set
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

    // 4. Proximity Interaction HUD Bubble
    this.promptContainer = scene.add.container(0, -52);
    const promptBg = scene.add.graphics();
    promptBg.fillStyle(0x06111e, 0.88);
    promptBg.lineStyle(1.5, 0x00f3ff, 1);
    promptBg.fillRoundedRect(-70, -12, 140, 24, 6);
    promptBg.strokeRoundedRect(-70, -12, 140, 24, 6);

    this.promptText = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00f3ff',
      align: 'center',
    });
    this.promptText.setOrigin(0.5, 0.5);

    this.promptContainer.add([promptBg, this.promptText]);
    this.promptContainer.setVisible(false);
    this.add(this.promptContainer);

    // Apply color tint
    this.applyPlayerColor(playerData.color);

    // Add to scene and enable physics on the container
    scene.add.existing(this);
    scene.physics.world.enable(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(24, 28);
    body.setOffset(-12, -8);

    // Setup input keys
    this.setupInput(scene);

    // Detect initial room
    this.updateCurrentRoom();
  }

  private setupInput(scene: Phaser.Scene): void {
    if (!scene.input.keyboard) return;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyR = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyQ = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Interaction key listener
    this.keyE.on('down', () => this.handleActionKey('E'));
    this.keySpace.on('down', () => this.handleActionKey('SPACE'));
    this.keyR.on('down', () => this.handleActionKey('R'));
    this.keyQ.on('down', () => this.handleActionKey('Q'));
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
    this.playerData.isAlive = isAlive;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!isAlive) {
      // Switch to ghost appearance
      this.sprite.setTexture('player_ghost_sheet', 0);
      this.sprite.play('ghost-hover', true);
      this.setAlpha(0.7);
      if (this.cosmeticSprite) {
        this.cosmeticSprite.setVisible(false);
      }
      // Ghosts can pass through walls
      if (body) {
        body.checkCollision.none = true;
      }
    } else {
      this.sprite.setTexture('player_diver_sheet', 0);
      this.setAlpha(1.0);
      if (this.cosmeticSprite) {
        this.cosmeticSprite.setVisible(true);
      }
      if (body) {
        body.checkCollision.none = false;
      }
    }
  }

  public update(time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    if (!this.bridge.movementEnabled) {
      body.setVelocity(0, 0);
      this.stopWalkingAnimation();
      return;
    }

    let vx = 0;
    let vy = 0;

    const left = this.cursors.left?.isDown || this.keyA?.isDown;
    const right = this.cursors.right?.isDown || this.keyD?.isDown;
    const up = this.cursors.up?.isDown || this.keyW?.isDown;
    const down = this.cursors.down?.isDown || this.keyS?.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    const currentSpeed = this.speed || (DEFAULT_ROOM_SETTINGS.playerSpeed ?? 200);
    body.setVelocity(vx * currentSpeed, vy * currentSpeed);

    // Update animations and facing
    const isMoving = vx !== 0 || vy !== 0;

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

    // Update cosmetic positioning
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

    // Room transition check
    this.updateCurrentRoom();

    // Throttled network sync: 20Hz (every 50ms)
    if (time - this.lastNetworkEmitTime >= 50) {
      const movedDist = Phaser.Math.Distance.Between(this.x, this.y, this.lastEmitX, this.lastEmitY);
      const facingChanged = this.facing !== this.lastEmitFacing;

      if (movedDist > 1.0 || facingChanged) {
        this.lastNetworkEmitTime = time;
        this.lastEmitX = this.x;
        this.lastEmitY = this.y;
        this.lastEmitFacing = this.facing;

        this.bridge.emitPlayerMoved({
          x: Math.round(this.x),
          y: Math.round(this.y),
          facing: this.facing,
          room: this.currentRoom,
          timestamp: Date.now(),
        });
      }
    }
  }

  private playWalkingAnimation(): void {
    if (!this.playerData.isAlive) {
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
    if (!this.playerData.isAlive) {
      return;
    }

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

  public showInteractionPrompt(info: InteractableInfo | null): void {
    if (!info) {
      this.promptContainer.setVisible(false);
      return;
    }

    this.promptText.setText(`${info.promptKey} ${info.promptText}`);
    this.promptContainer.setVisible(true);
  }

  private handleActionKey(key: string): void {
    if (!this.bridge.movementEnabled) return;

    if (key === 'E' || key === 'SPACE') {
      if (this.bridge.currentInteractable) {
        this.bridge.emitInteractTriggered(this.bridge.currentInteractable);
      }
    } else if (key === 'R') {
      if (this.bridge.currentInteractable?.type === 'body') {
        this.bridge.emitBodyReported(this.bridge.currentInteractable.id);
      }
    } else if (key === 'Q') {
      if (this.bridge.currentKillTarget) {
        this.bridge.emitKillAttempted(this.bridge.currentKillTarget.targetId);
      }
    }
  }

  private updateCurrentRoom(): void {
    let detectedRoom: FacilityRoomId = this.currentRoom;

    for (const [roomId, roomInfo] of Object.entries(FACILITY_ROOMS)) {
      const b = roomInfo.bounds;
      if (this.x >= b.x && this.x <= b.x + b.width && this.y >= b.y && this.y <= b.y + b.height) {
        detectedRoom = roomId as FacilityRoomId;
        break;
      }
    }

    if (detectedRoom !== this.currentRoom) {
      this.currentRoom = detectedRoom;
      this.bridge.emitRoomChanged(this.currentRoom);
    }
  }
}
