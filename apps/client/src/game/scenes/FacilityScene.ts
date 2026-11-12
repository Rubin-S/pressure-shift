import Phaser from 'phaser';
import {
  FACILITY_ROOMS,
  FACILITY_VENTS,
  STATIC_TASK_DEFINITIONS,
  SABOTAGE_DEFINITIONS,
  MAP_DIMENSIONS,
  FacilityRoomId,
  PlayerPublicView,
  DeadBody,
} from '@pressure-shift/shared';
import { GameBridge, gameBridge } from '../GameBridge.js';
import { LocalPlayer } from '../entities/LocalPlayer.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';
import { DeadBodyEntity } from '../entities/DeadBodyEntity.js';
import { InteractableStation } from '../entities/InteractableStation.js';
import { InteractableInfo, KillTargetInfo } from '../types.js';

export class FacilityScene extends Phaser.Scene {
  private bridge: GameBridge = gameBridge;
  public localPlayer?: LocalPlayer;
  public remotePlayers: Map<string, RemotePlayer> = new Map();
  public deadBodies: Map<string, DeadBodyEntity> = new Map();
  public interactables: Map<string, InteractableStation> = new Map();

  private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private lockedDoorColliders: Map<FacilityRoomId, Phaser.GameObjects.Rectangle[]> = new Map();
  private lockedDoorSprites: Map<FacilityRoomId, Phaser.GameObjects.Sprite[]> = new Map();

  // Atmosphere & Lighting
  private alarmOverlay!: Phaser.GameObjects.Rectangle;
  private alarmTween?: Phaser.Tweens.Tween;
  private bubbleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private steamEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Active interaction tracking
  private nearestInteractable: InteractableInfo | null = null;
  private nearestKillTarget: KillTargetInfo | null = null;

  constructor() {
    super('FacilityScene');
  }

  public create(): void {
    const { width, height } = MAP_DIMENSIONS;

    // Set world and physics bounds
    this.physics.world.setBounds(0, 0, width, height);

    // 1. Render Facility Floor, Corridors, Viewports & Labels
    this.createAtmosphere(width, height);
    this.createFloorsAndCorridors();
    this.createBulkheadWalls();
    this.createRoomLabels();
    this.createDecorativeProps();

    // 2. Spawn Interactive Task Stations, Vents, and Emergency Button
    this.createInteractableStations();

    // 3. Setup Particles (Bubbles, Steam)
    this.createParticles();

    // 4. Setup Local Player & Camera
    this.setupLocalPlayer();

    // 5. Setup Ambient Lighting & Emergency Siren Overlay
    this.setupLightingAndAlarms(width, height);

    // Notify GameBridge that game is loaded and ready
    this.bridge.emitGameReady();
  }

  // ----------------------------------------------------
  // Atmosphere & Backdrop
  // ----------------------------------------------------

  private createAtmosphere(width: number, height: number): void {
    // Deep oceanic abyssal trench background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x020712, 0x020712, 0x051329, 0x051329, 1);
    bg.fillRect(0, 0, width, height);
    bg.setDepth(-100);
  }

  // ----------------------------------------------------
  // Floors and Corridors
  // ----------------------------------------------------

  private createFloorsAndCorridors(): void {
    const floorGraphics = this.add.graphics();
    floorGraphics.setDepth(-50);

    // Render floor tiling for all 9 rooms
    for (const [roomId, room] of Object.entries(FACILITY_ROOMS)) {
      const { x, y, width, height } = room.bounds;

      let tileType = 'tile_floor_plate';
      if (roomId === 'docking_cradle' || roomId === 'pressure_lab') {
        tileType = 'tile_floor_grate';
      } else if (roomId === 'thermal_plant') {
        tileType = 'tile_floor_hazard';
      } else if (roomId === 'hydroponics' || roomId === 'medical_bay') {
        tileType = 'tile_floor_hex';
      }

      // Tiled floor fill
      for (let tx = x; tx < x + width; tx += 32) {
        for (let ty = y; ty < y + height; ty += 32) {
          const tw = Math.min(32, x + width - tx);
          const th = Math.min(32, y + height - ty);
          if (tw === 32 && th === 32) {
            this.add.image(tx + 16, ty + 16, tileType).setDepth(-50);
          }
        }
      }

      // Room border highlight
      floorGraphics.lineStyle(2, 0x00f3ff, 0.4);
      floorGraphics.strokeRect(x, y, width, height);
    }

    // Connect Corridors (width: 100px)
    // Horizontal Corridors
    // Row 1: Docking Cradle (x:600) -> Sonar (x:950) at y:250-350
    this.renderCorridor(600, 250, 350, 100, true);
    // Sonar (x:1450) -> Hydroponics (x:1800) at y:250-350
    this.renderCorridor(1450, 250, 350, 100, true);

    // Row 2: Pressure Lab (x:600) -> Central Junction (x:900) at y:850-950
    this.renderCorridor(600, 850, 300, 100, true);
    // Central Junction (x:1500) -> Observation Gallery (x:1800) at y:850-950
    this.renderCorridor(1500, 850, 300, 100, true);

    // Row 3: Thermal Plant (x:600) -> Comms (x:950) at y:1450-1550
    this.renderCorridor(600, 1450, 350, 100, true);
    // Comms (x:1450) -> Medical Bay (x:1800) at y:1450-1550
    this.renderCorridor(1450, 1450, 350, 100, true);

    // Vertical Corridors
    // Col 1: Docking Cradle (y:500) -> Pressure Lab (y:700) at x:300-400
    this.renderCorridor(300, 500, 100, 200, false);
    // Pressure Lab (y:1100) -> Thermal Plant (y:1300) at x:300-400
    this.renderCorridor(300, 1100, 100, 200, false);

    // Col 2: Sonar (y:500) -> Central Junction (y:700) at x:1150-1250
    this.renderCorridor(1150, 500, 100, 200, false);
    // Central Junction (y:1100) -> Comms (y:1300) at x:1150-1250
    this.renderCorridor(1150, 1100, 100, 200, false);

    // Col 3: Hydroponics (y:500) -> Observation Gallery (y:700) at x:2000-2100
    this.renderCorridor(2000, 500, 100, 200, false);
    // Observation Gallery (y:1100) -> Medical Bay (y:1300) at x:2000-2100
    this.renderCorridor(2000, 1100, 100, 200, false);
  }

  private renderCorridor(x: number, y: number, w: number, h: number, horizontal: boolean): void {
    const tile = horizontal ? 'tile_floor_grate' : 'tile_floor_plate';
    for (let tx = x; tx < x + w; tx += 32) {
      for (let ty = y; ty < y + h; ty += 32) {
        this.add.image(tx + 16, ty + 16, tile).setDepth(-50);
      }
    }
  }

  // ----------------------------------------------------
  // Bulkhead Walls & Collision Boundaries
  // ----------------------------------------------------

  private createBulkheadWalls(): void {
    this.wallsGroup = this.physics.add.staticGroup();

    // Helper to add a collision wall segment
    const addWall = (x: number, y: number, w: number, h: number) => {
      // Create visual bulkhead tiles
      for (let tx = x; tx < x + w; tx += 32) {
        for (let ty = y; ty < y + h; ty += 32) {
          this.add.image(tx + 16, ty + 16, 'tile_wall_bulkhead').setDepth(10);
        }
      }
      // Physics static body
      const wallBody = this.add.rectangle(x + w / 2, y + h / 2, w, h);
      this.physics.add.existing(wallBody, true);
      this.wallsGroup.add(wallBody);
      wallBody.setVisible(false);
    };

    // Helper to add corridor walls (prevent players from walking off corridors into the deep sea)
    // Row 1 Horizontal Corridors Walls
    addWall(600, 230, 350, 20); // Top wall Docking->Sonar
    addWall(600, 350, 350, 20); // Bottom wall Docking->Sonar
    addWall(1450, 230, 350, 20); // Top wall Sonar->Hydro
    addWall(1450, 350, 350, 20); // Bottom wall Sonar->Hydro

    // Row 2 Horizontal Corridors Walls
    addWall(600, 830, 300, 20); // Top wall Pressure->Central
    addWall(600, 950, 300, 20); // Bottom wall Pressure->Central
    addWall(1500, 830, 300, 20); // Top wall Central->Obs
    addWall(1500, 950, 300, 20); // Bottom wall Central->Obs

    // Row 3 Horizontal Corridors Walls
    addWall(600, 1430, 350, 20); // Top wall Thermal->Comms
    addWall(600, 1550, 350, 20); // Bottom wall Thermal->Comms
    addWall(1450, 1430, 350, 20); // Top wall Comms->Med
    addWall(1450, 1550, 350, 20); // Bottom wall Comms->Med

    // Vertical Corridors Walls
    // Col 1 Vertical Corridors Walls
    addWall(280, 500, 20, 200); // Left wall Docking->Pressure
    addWall(400, 500, 20, 200); // Right wall Docking->Pressure
    addWall(280, 1100, 20, 200); // Left wall Pressure->Thermal
    addWall(400, 1100, 20, 200); // Right wall Pressure->Thermal

    // Col 2 Vertical Corridors Walls
    addWall(1130, 500, 20, 200); // Left wall Sonar->Central
    addWall(1250, 500, 20, 200); // Right wall Sonar->Central
    addWall(1130, 1100, 20, 200); // Left wall Central->Comms
    addWall(1250, 1100, 20, 200); // Right wall Central->Comms

    // Col 3 Vertical Corridors Walls
    addWall(1980, 500, 20, 200); // Left wall Hydro->Obs
    addWall(2100, 500, 20, 200); // Right wall Hydro->Obs
    addWall(1980, 1100, 20, 200); // Left wall Obs->Med
    addWall(2100, 1100, 20, 200); // Right wall Obs->Med

    // Perimeter and Room Exterior Walls with door openings for corridors:
    for (const [roomId, room] of Object.entries(FACILITY_ROOMS)) {
      const { x, y, width, height } = room.bounds;

      // Top Wall
      if (roomId === 'docking_cradle' || roomId === 'sonar_control' || roomId === 'hydroponics') {
        addWall(x, y - 20, width, 20); // Solid top wall along facility top boundary
      } else {
        // Vertical corridor opens in top wall
        const doorX = (roomId === 'pressure_lab' || roomId === 'thermal_plant') ? 300 :
                      (roomId === 'central_junction' || roomId === 'communications') ? 1150 : 2000;
        addWall(x, y - 20, doorX - x, 20);
        addWall(doorX + 100, y - 20, x + width - (doorX + 100), 20);
      }

      // Bottom Wall
      if (roomId === 'thermal_plant' || roomId === 'communications' || roomId === 'medical_bay') {
        addWall(x, y + height, width, 20); // Solid bottom wall along facility bottom boundary
      } else {
        const doorX = (roomId === 'docking_cradle' || roomId === 'pressure_lab') ? 300 :
                      (roomId === 'sonar_control' || roomId === 'central_junction') ? 1150 : 2000;
        addWall(x, y + height, doorX - x, 20);
        addWall(doorX + 100, y + height, x + width - (doorX + 100), 20);
      }

      // Left Wall
      if (roomId === 'docking_cradle' || roomId === 'pressure_lab' || roomId === 'thermal_plant') {
        addWall(x - 20, y, 20, height); // Solid left boundary
      } else {
        const doorY = (roomId === 'sonar_control' || roomId === 'hydroponics') ? 250 :
                      (roomId === 'central_junction' || roomId === 'observation_gallery') ? 850 : 1450;
        addWall(x - 20, y, 20, doorY - y);
        addWall(x - 20, doorY + 100, 20, y + height - (doorY + 100));
      }

      // Right Wall
      if (roomId === 'hydroponics' || roomId === 'observation_gallery' || roomId === 'medical_bay') {
        addWall(x + width, y, 20, height); // Solid right boundary
      } else {
        const doorY = (roomId === 'docking_cradle' || roomId === 'sonar_control') ? 250 :
                      (roomId === 'pressure_lab' || roomId === 'central_junction') ? 850 : 1450;
        addWall(x + width, y, 20, doorY - y);
        addWall(x + width, doorY + 100, 20, y + height - (doorY + 100));
      }
    }
  }

  // ----------------------------------------------------
  // Room Labels & Decals
  // ----------------------------------------------------

  private createRoomLabels(): void {
    for (const [, room] of Object.entries(FACILITY_ROOMS)) {
      const { x, y, width } = room.bounds;

      const label = this.add.text(x + width / 2, y + 24, room.name.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#00d2ff',
        stroke: '#002233',
        strokeThickness: 3,
        align: 'center',
      });
      label.setOrigin(0.5, 0.5);
      label.setAlpha(0.65);
      label.setDepth(-40);
    }
  }

  // ----------------------------------------------------
  // Decorative Atmosphere Props & Viewports
  // ----------------------------------------------------

  private createDecorativeProps(): void {
    // 1. Panoramic deep ocean viewports in Observation Gallery
    const obs = FACILITY_ROOMS.observation_gallery.bounds;
    this.add.image(obs.x + obs.width / 2, obs.y + 36, 'viewport_window').setDepth(12);

    // 2. Viewports in Sonar Control and Docking Cradle
    const sonar = FACILITY_ROOMS.sonar_control.bounds;
    this.add.image(sonar.x + sonar.width / 2, sonar.y + 36, 'viewport_window').setDepth(12);

    // 3. Bioluminescent Algae vats in Hydroponics
    const hydro = FACILITY_ROOMS.hydroponics.bounds;
    this.add.image(hydro.x + 80, hydro.y + 120, 'prop_algae_vat').setDepth(5);
    this.add.image(hydro.x + 160, hydro.y + 120, 'prop_algae_vat').setDepth(5);
    this.add.image(hydro.x + 340, hydro.y + 120, 'prop_algae_vat').setDepth(5);
    this.add.image(hydro.x + 420, hydro.y + 120, 'prop_algae_vat').setDepth(5);

    // 4. Medical beds in Medical Bay
    const med = FACILITY_ROOMS.medical_bay.bounds;
    this.add.image(med.x + 100, med.y + 120, 'prop_med_bed').setDepth(5);
    this.add.image(med.x + 250, med.y + 120, 'prop_med_bed').setDepth(5);
    this.add.image(med.x + 400, med.y + 120, 'prop_med_bed').setDepth(5);

    // 5. Emergency Siren Beacons on Bulkheads
    for (const [, room] of Object.entries(FACILITY_ROOMS)) {
      this.add.image(room.bounds.x + 30, room.bounds.y + 30, 'prop_siren_beacon').setDepth(15);
      this.add.image(room.bounds.x + room.bounds.width - 30, room.bounds.y + 30, 'prop_siren_beacon').setDepth(15);
    }
  }

  // ----------------------------------------------------
  // Interactive Consoles, Emergency Table, Vents, Sabotages
  // ----------------------------------------------------

  private createInteractableStations(): void {
    // 1. Eight Task Stations from STATIC_TASK_DEFINITIONS
    for (const [, task] of Object.entries(STATIC_TASK_DEFINITIONS)) {
      let texture = 'prop_console_sonar';
      switch (task.type) {
        case 'sonar_calibration':
          texture = 'prop_console_sonar';
          break;
        case 'electrical_circuit':
          texture = 'prop_console_circuit';
          break;
        case 'pressure_valve':
          texture = 'prop_console_valve';
          break;
        case 'power_routing':
          texture = 'prop_console_reactor';
          break;
        case 'bio_sample_sort':
          texture = 'prop_console_bio';
          break;
        case 'sensor_alignment':
          texture = 'prop_console_sensor';
          break;
        case 'ballast_pump':
          texture = 'prop_console_ballast';
          break;
        case 'filtration_clear':
          texture = 'prop_console_filtration';
          break;
      }

      const station = new InteractableStation(this, {
        type: 'task',
        id: task.id,
        name: task.name,
        room: task.room,
        position: task.location,
        texture,
        interactRadius: task.interactRadius,
        promptKey: '[E]',
        promptText: `USE: ${task.name.toUpperCase()}`,
      });
      station.setDepth(5);
      this.interactables.set(task.id, station);
    }

    // 2. Central Emergency Meeting Console
    const emergencyConsole = FACILITY_ROOMS.central_junction.emergencyConsole;
    if (emergencyConsole) {
      const emergencyStation = new InteractableStation(this, {
        type: 'emergency_button',
        id: 'emergency_button',
        name: 'Emergency Dispatch Console',
        room: 'central_junction',
        position: emergencyConsole,
        texture: 'prop_emergency_table',
        interactRadius: 75,
        promptKey: '[E]',
        promptText: 'EMERGENCY DISPATCH',
      });
      emergencyStation.setDepth(6);
      this.interactables.set('emergency_button', emergencyStation);
    }

    // 3. Vents from FACILITY_VENTS (for Disruptors)
    for (const [ventId, vent] of Object.entries(FACILITY_VENTS)) {
      const ventStation = new InteractableStation(this, {
        type: 'vent',
        id: ventId,
        name: 'Ventilation Grate',
        room: vent.room,
        position: vent.position,
        texture: 'prop_vent_grate',
        interactRadius: 65,
        promptKey: '[E]',
        promptText: 'VENT: ENTER DUCT',
      });
      ventStation.setDepth(2);
      this.interactables.set(ventId, ventStation);
    }

    // 4. Sabotage Repair Stations from SABOTAGE_DEFINITIONS
    for (const [, sabotageDef] of Object.entries(SABOTAGE_DEFINITIONS)) {
      for (const st of sabotageDef.defaultStations) {
        if (!this.interactables.has(st.id)) {
          const sabStation = new InteractableStation(this, {
            type: 'sabotage_repair',
            id: st.id,
            name: st.name,
            room: st.room,
            position: st.location,
            texture: 'prop_console_circuit',
            interactRadius: 65,
            promptKey: '[E]',
            promptText: `REPAIR: ${st.name.toUpperCase()}`,
          });
          sabStation.setDepth(5);
          this.interactables.set(st.id, sabStation);
        }
      }
    }
  }

  // ----------------------------------------------------
  // Particles (Bubbles, Steam)
  // ----------------------------------------------------

  private createParticles(): void {
    // Ambient rising underwater bubbles
    this.bubbleEmitter = this.add.particles(0, 0, 'particle_bubble', {
      x: { min: 100, max: 2300 },
      y: { min: 200, max: 1700 },
      speedY: { min: -20, max: -45 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.4, end: 0.9 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 4000,
      frequency: 250,
      quantity: 2,
    });
    this.bubbleEmitter.setDepth(25);

    // Steam vents in Thermal Plant & Pressure Lab
    this.steamEmitter = this.add.particles(0, 0, 'particle_steam', {
      x: 350,
      y: 1400,
      speedY: { min: -30, max: -60 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.5, end: 1.2 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 2500,
      frequency: 400,
    });
    this.steamEmitter.setDepth(25);
  }

  // ----------------------------------------------------
  // Local Player & Camera
  // ----------------------------------------------------

  private setupLocalPlayer(): void {
    // Default initial mock data if not set yet by UI
    const defaultLocalData: PlayerPublicView = (this.bridge.localPlayer as PlayerPublicView) || {
      id: 'local_player',
      name: 'Operator',
      color: 'neon_cyan',
      cosmetic: 'standard_helm',
      role: 'OPERATOR',
      isAlive: true,
      position: { x: 1200, y: 900 },
      facing: 'down',
      currentRoom: 'central_junction',
      currentTask: null,
      isHost: false,
      isReady: true,
      connected: true,
    };

    this.localPlayer = new LocalPlayer(
      this,
      defaultLocalData.position.x,
      defaultLocalData.position.y,
      defaultLocalData,
      this.bridge
    );
    this.localPlayer.setDepth(50);

    // Setup collision with all facility walls!
    this.physics.add.collider(this.localPlayer, this.wallsGroup);

    // Camera follow local player smoothly
    this.cameras.main.startFollow(this.localPlayer, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, MAP_DIMENSIONS.width, MAP_DIMENSIONS.height);
    this.cameras.main.setZoom(1.15);
  }

  // ----------------------------------------------------
  // Ambient Lighting & Emergency Alarms
  // ----------------------------------------------------

  private setupLightingAndAlarms(width: number, height: number): void {
    // Emergency alarm amber/red pulsing overlay
    this.alarmOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xff1744, 0.0);
    this.alarmOverlay.setDepth(200);
    this.alarmOverlay.setScrollFactor(0);
    this.alarmOverlay.setVisible(false);
  }

  public setEmergencyAlarm(active: boolean): void {
    if (active) {
      this.alarmOverlay.setVisible(true);
      if (!this.alarmTween) {
        this.alarmTween = this.tweens.add({
          targets: this.alarmOverlay,
          fillAlpha: 0.28,
          yoyo: true,
          repeat: -1,
          duration: 600,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      if (this.alarmTween) {
        this.alarmTween.stop();
        this.alarmTween = undefined;
      }
      this.alarmOverlay.fillAlpha = 0.0;
      this.alarmOverlay.setVisible(false);
    }
  }

  // ----------------------------------------------------
  // Main Update Loop
  // ----------------------------------------------------

  public update(time: number, delta: number): void {
    if (!this.localPlayer) return;

    // 1. Update Local Player
    this.localPlayer.update(time, delta);

    // 2. Sync Local Player state with bridge changes (e.g. role, alive/dead, speed)
    if (this.bridge.localPlayer) {
      if (this.localPlayer.playerData.isAlive !== this.bridge.localPlayer.isAlive) {
        this.localPlayer.setAliveState(this.bridge.localPlayer.isAlive);
      }
      if (this.localPlayer.playerData.color !== this.bridge.localPlayer.color) {
        this.localPlayer.applyPlayerColor(this.bridge.localPlayer.color);
        this.localPlayer.playerData.color = this.bridge.localPlayer.color;
      }
    }

    // 3. Sync Remote Players
    this.syncRemotePlayers(time, delta);

    // 4. Sync Dead Bodies
    this.syncDeadBodies();

    // 5. Sync Door Lockdowns
    this.syncDoorLockdowns();

    // 6. Sync Emergency Alarm state
    if (this.bridge.isEmergencyAlarmActive !== this.alarmOverlay.visible) {
      this.setEmergencyAlarm(this.bridge.isEmergencyAlarmActive);
    }

    // 7. Check Proximity to Interactables & Kill Targets
    this.checkProximities();
  }

  // ----------------------------------------------------
  // Remote Players Synchronization & Interpolation
  // ----------------------------------------------------

  private syncRemotePlayers(time: number, delta: number): void {
    const bridgePlayers = this.bridge.remotePlayers;

    // Add new remote players or update positions
    for (const [id, pData] of bridgePlayers.entries()) {
      let rPlayer = this.remotePlayers.get(id);
      if (!rPlayer) {
        rPlayer = new RemotePlayer(this, pData);
        rPlayer.setDepth(45);
        this.remotePlayers.set(id, rPlayer);
      } else {
        rPlayer.updateTargetPosition(pData.position.x, pData.position.y, pData.facing);
        if (rPlayer.isAlive !== pData.isAlive) {
          rPlayer.setAliveState(pData.isAlive);
        }
        if (rPlayer.playerData.color !== pData.color) {
          rPlayer.applyPlayerColor(pData.color);
          rPlayer.playerData.color = pData.color;
        }
      }
      rPlayer.update(time, delta);
    }

    // Remove disconnected remote players
    for (const [id, rPlayer] of this.remotePlayers.entries()) {
      if (!bridgePlayers.has(id)) {
        rPlayer.destroy();
        this.remotePlayers.delete(id);
      }
    }
  }

  // ----------------------------------------------------
  // Dead Bodies Synchronization
  // ----------------------------------------------------

  private syncDeadBodies(): void {
    const bridgeBodies = this.bridge.deadBodies;

    for (const [id, bData] of bridgeBodies.entries()) {
      if (!this.deadBodies.has(id)) {
        const bodyEntity = new DeadBodyEntity(this, bData);
        bodyEntity.setDepth(3);
        this.deadBodies.set(id, bodyEntity);
      }
    }

    for (const [id, entity] of this.deadBodies.entries()) {
      if (!bridgeBodies.has(id)) {
        entity.destroy();
        this.deadBodies.delete(id);
      }
    }
  }

  // ----------------------------------------------------
  // Door Lockdowns (Bulkhead Door Slam)
  // ----------------------------------------------------

  private syncDoorLockdowns(): void {
    const lockedRooms = this.bridge.lockedDoors;

    // Check newly locked rooms
    for (const roomId of lockedRooms) {
      if (!this.lockedDoorColliders.has(roomId)) {
        this.spawnLockedDoorsForRoom(roomId);
      }
    }

    // Check unlocked rooms
    for (const [roomId, colliders] of this.lockedDoorColliders.entries()) {
      if (!lockedRooms.has(roomId)) {
        for (const c of colliders) {
          c.destroy();
        }
        this.lockedDoorColliders.delete(roomId);

        const sprites = this.lockedDoorSprites.get(roomId);
        if (sprites) {
          for (const s of sprites) s.destroy();
          this.lockedDoorSprites.delete(roomId);
        }
      }
    }
  }

  private spawnLockedDoorsForRoom(roomId: FacilityRoomId): void {
    const room = FACILITY_ROOMS[roomId];
    if (!room) return;

    const colliders: Phaser.GameObjects.Rectangle[] = [];
    const sprites: Phaser.GameObjects.Sprite[] = [];

    // Helper to spawn door barrier
    const addDoor = (x: number, y: number, w: number, h: number) => {
      const sp = this.add.sprite(x, y, 'tile_door_bulkhead').setDepth(15);
      sprites.push(sp);

      const barrier = this.add.rectangle(x, y, w, h);
      this.physics.add.existing(barrier, true);
      this.physics.add.collider(this.localPlayer!, barrier);
      colliders.push(barrier);
      barrier.setVisible(false);
    };

    // Spawn doors at the room's corridor entries
    const b = room.bounds;
    addDoor(b.x + b.width / 2, b.y, 64, 24);
    addDoor(b.x + b.width / 2, b.y + b.height, 64, 24);

    this.lockedDoorColliders.set(roomId, colliders);
    this.lockedDoorSprites.set(roomId, sprites);
  }

  // ----------------------------------------------------
  // Contextual Proximity Detection (Tasks, Emergency, Bodies, Vents, Kill)
  // ----------------------------------------------------

  private checkProximities(): void {
    if (!this.localPlayer) return;

    const px = this.localPlayer.x;
    const py = this.localPlayer.y;
    const isDisruptor = this.localPlayer.playerData.role === 'DISRUPTOR';
    const isAlive = this.localPlayer.playerData.isAlive;

    let closestInteractable: InteractableInfo | null = null;
    let closestDist = Infinity;

    // 1. Check Dead Bodies first (highest priority for [R] REPORT)
    if (isAlive) {
      for (const [id, bodyEntity] of this.deadBodies.entries()) {
        const dist = Phaser.Math.Distance.Between(px, py, bodyEntity.x, bodyEntity.y);
        if (dist <= 85 && dist < closestDist) {
          closestDist = dist;
          closestInteractable = {
            type: 'body',
            id,
            name: `Dead Body: ${bodyEntity.bodyData.victimName}`,
            promptKey: '[R]',
            promptText: `REPORT DEAD BODY (${bodyEntity.bodyData.victimName})`,
            room: bodyEntity.bodyData.room,
            position: bodyEntity.bodyData.position,
            distance: dist,
          };
        }
      }
    }

    // 2. Check Interactive Consoles, Emergency Table, Sabotage Stations, and Vents
    for (const [id, station] of this.interactables.entries()) {
      // Vents only usable by Disruptors
      if (station.config.type === 'vent' && (!isDisruptor || !isAlive)) {
        continue;
      }

      // Ghosts cannot call emergency meeting
      if (station.config.type === 'emergency_button' && !isAlive) {
        continue;
      }

      const dist = Phaser.Math.Distance.Between(px, py, station.x, station.y);
      if (dist <= station.config.interactRadius) {
        station.setHighlighted(true);
        if (dist < closestDist) {
          closestDist = dist;
          closestInteractable = {
            type: station.config.type,
            id,
            name: station.config.name,
            promptKey: station.config.promptKey,
            promptText: station.config.promptText,
            room: station.config.room,
            position: station.config.position,
            distance: dist,
          };
        }
      } else {
        station.setHighlighted(false);
      }
    }

    // Update interactable state
    if (closestInteractable) {
      this.nearestInteractable = closestInteractable;
      this.localPlayer.showInteractionPrompt(closestInteractable);
      this.bridge.emitInteractableInRange(closestInteractable);
    } else if (this.nearestInteractable) {
      this.nearestInteractable = null;
      this.localPlayer.showInteractionPrompt(null);
      this.bridge.emitInteractableOutOfRange();
    }

    // 3. Check Kill Target proximity for Disruptors
    if (isDisruptor && isAlive) {
      let closestTarget: KillTargetInfo | null = null;
      let targetDist = Infinity;

      for (const [id, rPlayer] of this.remotePlayers.entries()) {
        if (!rPlayer.isAlive) continue;
        const dist = Phaser.Math.Distance.Between(px, py, rPlayer.x, rPlayer.y);
        if (dist <= 75 && dist < targetDist) {
          targetDist = dist;
          closestTarget = {
            targetId: id,
            targetName: rPlayer.playerData.name,
            position: { x: rPlayer.x, y: rPlayer.y },
            distance: dist,
          };
        }
      }

      if (
        closestTarget?.targetId !== this.nearestKillTarget?.targetId ||
        (closestTarget && Math.abs((closestTarget.distance - (this.nearestKillTarget?.distance || 0))) > 5)
      ) {
        this.nearestKillTarget = closestTarget;
        this.bridge.emitKillTargetUpdated(closestTarget);
      }
    } else if (this.nearestKillTarget) {
      this.nearestKillTarget = null;
      this.bridge.emitKillTargetUpdated(null);
    }
  }
}
