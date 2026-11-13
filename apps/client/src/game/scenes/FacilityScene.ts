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
  private visionVignette!: Phaser.GameObjects.Image;
  private bubbleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private steamEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sporeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

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

    // 3. Setup Particles (Bubbles, Steam, Algae Spores)
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

    // Render studio-grade high-resolution reference backgrounds for all 9 rooms
    for (const [roomId, room] of Object.entries(FACILITY_ROOMS)) {
      const { x, y, width, height } = room.bounds;

      const bgKey = `room_bg_${roomId}`;
      if (this.textures.exists(bgKey)) {
        // High-resolution studio artwork matching the approved visual reference exactly
        const bgImg = this.add.image(x + width / 2, y + height / 2, bgKey);
        bgImg.setDisplaySize(width, height);
        bgImg.setDepth(-40);
      } else {
        // Fallback procedural floor fill
        let tileType = 'tile_floor_plate';
        if (roomId === 'docking_cradle' || roomId === 'pressure_lab') {
          tileType = 'tile_floor_grate';
        } else if (roomId === 'thermal_plant') {
          tileType = 'tile_floor_hazard';
        } else if (roomId === 'hydroponics' || roomId === 'medical_bay') {
          tileType = 'tile_floor_hex';
        } else if (roomId === 'observation_gallery') {
          tileType = 'tile_floor_rubber';
        }

        for (let tx = x; tx < x + width; tx += 32) {
          for (let ty = y; ty < y + height; ty += 32) {
            const tw = Math.min(32, x + width - tx);
            const th = Math.min(32, y + height - ty);
            if (tw === 32 && th === 32) {
              this.add.image(tx + 16, ty + 16, tileType).setDepth(-50);
            }
          }
        }
      }

      // Precision room perimeter border highlight
      floorGraphics.lineStyle(2, 0x00f3ff, 0.45);
      floorGraphics.strokeRect(x, y, width, height);
    }

    // Connect Corridors (width: 100px) with glowing power conduits
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
    const tile = horizontal ? 'tile_floor_plate' : 'tile_floor_rubber';
    for (let tx = x; tx < x + w; tx += 32) {
      for (let ty = y; ty < y + h; ty += 32) {
        this.add.image(tx + 16, ty + 16, tile).setDepth(-50);
      }
    }

    // Glowing cyan power conduit running along corridor center line
    if (horizontal) {
      const midY = y + 48;
      for (let tx = x; tx < x + w; tx += 32) {
        this.add.image(tx + 16, midY, 'tile_conduit_h').setDepth(-48);
      }
    } else {
      const midX = x + 48;
      for (let ty = y; ty < y + h; ty += 32) {
        this.add.image(midX, ty + 16, 'tile_conduit_v').setDepth(-48);
      }
    }
  }

  // ----------------------------------------------------
  // Bulkhead Walls & Collision Boundaries
  // ----------------------------------------------------

  private createBulkheadWalls(): void {
    this.wallsGroup = this.physics.add.staticGroup();

    const addWall = (x: number, y: number, w: number, h: number) => {
      // Visual bulkhead tiles
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

    // Horizontal Corridors Walls
    addWall(600, 230, 350, 20);
    addWall(600, 350, 350, 20);
    addWall(1450, 230, 350, 20);
    addWall(1450, 350, 350, 20);

    addWall(600, 830, 300, 20);
    addWall(600, 950, 300, 20);
    addWall(1500, 830, 300, 20);
    addWall(1500, 950, 300, 20);

    addWall(600, 1430, 350, 20);
    addWall(600, 1550, 350, 20);
    addWall(1450, 1430, 350, 20);
    addWall(1450, 1550, 350, 20);

    // Vertical Corridors Walls
    addWall(280, 500, 20, 200);
    addWall(400, 500, 20, 200);
    addWall(280, 1100, 20, 200);
    addWall(400, 1100, 20, 200);

    addWall(1130, 500, 20, 200);
    addWall(1250, 500, 20, 200);
    addWall(1130, 1100, 20, 200);
    addWall(1250, 1100, 20, 200);

    addWall(1980, 500, 20, 200);
    addWall(2100, 500, 20, 200);
    addWall(1980, 1100, 20, 200);
    addWall(2100, 1100, 20, 200);

    // Perimeter and Room Walls with doorway gaps
    for (const [roomId, room] of Object.entries(FACILITY_ROOMS)) {
      const { x, y, width, height } = room.bounds;

      // Top Wall
      if (roomId === 'docking_cradle' || roomId === 'sonar_control' || roomId === 'hydroponics') {
        addWall(x, y - 20, width, 20);
      } else {
        const doorX = (roomId === 'pressure_lab' || roomId === 'thermal_plant') ? 300 :
                      (roomId === 'central_junction' || roomId === 'communications') ? 1150 : 2000;
        addWall(x, y - 20, doorX - x, 20);
        addWall(doorX + 100, y - 20, x + width - (doorX + 100), 20);
      }

      // Bottom Wall
      if (roomId === 'thermal_plant' || roomId === 'communications' || roomId === 'medical_bay') {
        addWall(x, y + height, width, 20);
      } else {
        const doorX = (roomId === 'docking_cradle' || roomId === 'pressure_lab') ? 300 :
                      (roomId === 'sonar_control' || roomId === 'central_junction') ? 1150 : 2000;
        addWall(x, y + height, doorX - x, 20);
        addWall(doorX + 100, y + height, x + width - (doorX + 100), 20);
      }

      // Left Wall
      if (roomId === 'docking_cradle' || roomId === 'pressure_lab' || roomId === 'thermal_plant') {
        addWall(x - 20, y, 20, height);
      } else {
        const doorY = (roomId === 'sonar_control' || roomId === 'hydroponics') ? 250 :
                      (roomId === 'central_junction' || roomId === 'observation_gallery') ? 850 : 1450;
        addWall(x - 20, y, 20, doorY - y);
        addWall(x - 20, doorY + 100, 20, y + height - (doorY + 100));
      }

      // Right Wall
      if (roomId === 'hydroponics' || roomId === 'observation_gallery' || roomId === 'medical_bay') {
        addWall(x + width, y, 20, height);
      } else {
        const doorY = (roomId === 'docking_cradle' || roomId === 'sonar_control') ? 250 :
                      (roomId === 'pressure_lab' || roomId === 'central_junction') ? 850 : 1450;
        addWall(x + width, y, 20, doorY - y);
        addWall(x + width, doorY + 100, 20, y + height - (doorY + 100));
      }
    }
  }

  // ----------------------------------------------------
  // Room Floor Stencils & Architecture Labels
  // ----------------------------------------------------

  private createRoomLabels(): void {
    for (const [, room] of Object.entries(FACILITY_ROOMS)) {
      const { x, y, width } = room.bounds;
      const sectorTag = room.sectorCode ? `${room.sectorCode} // ${room.name.toUpperCase()}` : room.name.toUpperCase();

      // Clean futuristic sector title
      const title = this.add.text(x + width / 2, y + 26, sectorTag, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#00f3ff',
        stroke: '#001a2c',
        strokeThickness: 3,
        align: 'center',
      });
      title.setOrigin(0.5, 0.5);
      title.setAlpha(0.75);
      title.setDepth(-40);

      // Sub-label telemetry from room description
      const sub = this.add.text(x + width / 2, y + 42, room.description.toUpperCase().slice(0, 48), {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#5b82a6',
        align: 'center',
      });
      sub.setOrigin(0.5, 0.5);
      sub.setAlpha(0.65);
      sub.setDepth(-40);
    }
  }

  // ----------------------------------------------------
  // Distinct Sector Decorative Props & Centerpieces
  // ----------------------------------------------------

  private createDecorativeProps(): void {
    const hasStudioArt = this.textures.exists('room_bg_central_junction');

    // Only render procedural fallback stamps if studio reference art is missing
    if (!hasStudioArt) {
      // 1. SEC-06 Observation Dome: Massive Panoramic Trench Viewport
      const obs = FACILITY_ROOMS.observation_gallery.bounds;
      this.add.image(obs.x + obs.width / 2, obs.y + 40, 'viewport_window_panoramic').setDepth(12);

      // 2. SEC-02 Sonar Telemetry: Viewport & Server Blade Racks
      const sonar = FACILITY_ROOMS.sonar_control.bounds;
      this.add.image(sonar.x + sonar.width / 2, sonar.y + 40, 'viewport_window').setDepth(12);
      this.add.image(sonar.x + 80, sonar.y + 120, 'prop_server_rack').setDepth(5);

      // 3. SEC-01 Submersible Docking Bay: Circular Moon Pool & Docking Clamps
      const dock = FACILITY_ROOMS.docking_cradle.bounds;
      this.add.image(dock.x + dock.width / 2, dock.y + 190, 'prop_moon_pool').setDepth(-45);
      this.add.image(dock.x + 80, dock.y + 190, 'prop_docking_clamp').setDepth(5);
      this.add.image(dock.x + dock.width - 80, dock.y + 190, 'prop_docking_clamp').setDepth(5);

      // 4. SEC-04 Hydrostatic Testing Rig: Vitreous Electrum Anomaly Levitation Pedestal
      const pressure = FACILITY_ROOMS.pressure_lab.bounds;
      this.add.image(pressure.x + pressure.width / 2, pressure.y + 180, 'prop_anomaly_pedestal').setDepth(5);

      // 5. SEC-05 Geothermal Vent Generator: Magma Rift & Catwalk
      const thermal = FACILITY_ROOMS.thermal_plant.bounds;
      this.add.image(thermal.x + thermal.width / 2, thermal.y + 190, 'prop_magma_rift').setDepth(-45);

      // 6. SEC-03 Hadal Bio-Dome Lab: Vertical Spirulina Photobioreactors
      const hydro = FACILITY_ROOMS.hydroponics.bounds;
      this.add.image(hydro.x + 80, hydro.y + 130, 'prop_spirulina_column').setDepth(5);
      this.add.image(hydro.x + 160, hydro.y + 130, 'prop_spirulina_column').setDepth(5);
      this.add.image(hydro.x + 340, hydro.y + 130, 'prop_spirulina_column').setDepth(5);
      this.add.image(hydro.x + 420, hydro.y + 130, 'prop_spirulina_column').setDepth(5);

      // 7. SEC-07 Trans-Oceanic Relay: Server Blade Cabinets
      const comms = FACILITY_ROOMS.communications.bounds;
      this.add.image(comms.x + 100, comms.y + 130, 'prop_server_rack').setDepth(5);
      this.add.image(comms.x + 400, comms.y + 130, 'prop_server_rack').setDepth(5);

      // 8. SEC-08 Hyperbaric Cryo-Lab: Diagnostic Pods
      const med = FACILITY_ROOMS.medical_bay.bounds;
      this.add.image(med.x + 100, med.y + 130, 'prop_med_bed').setDepth(5);
      this.add.image(med.x + 250, med.y + 130, 'prop_med_bed').setDepth(5);
      this.add.image(med.x + 400, med.y + 130, 'prop_med_bed').setDepth(5);
    }

    // 9. Emergency Siren Beacons on Bulkheads
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
  // Atmospheric Particles (Bubbles, Steam, Spores)
  // ----------------------------------------------------

  private createParticles(): void {
    // Ambient rising underwater bubbles
    this.bubbleEmitter = this.add.particles(0, 0, 'particle_bubble', {
      x: { min: 100, max: 2300 },
      y: { min: 200, max: 1700 },
      speedY: { min: -20, max: -45 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.35, end: 0.8 },
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
      scale: { start: 0.4, end: 1.1 },
      alpha: { start: 0.45, end: 0 },
      lifespan: 2500,
      frequency: 400,
    });
    this.steamEmitter.setDepth(25);

    // Glowing emerald spores in Hydroponics
    this.sporeEmitter = this.add.particles(0, 0, 'particle_spore', {
      x: { min: 1820, max: 2280 },
      y: { min: 120, max: 480 },
      speedY: { min: -10, max: 10 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.5, end: 1.0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 3000,
      frequency: 350,
    });
    this.sporeEmitter.setDepth(25);
  }

  // ----------------------------------------------------
  // Local Player & Camera
  // ----------------------------------------------------

  private setupLocalPlayer(): void {
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

    // Setup collision with all facility walls
    this.physics.add.collider(this.localPlayer, this.wallsGroup);

    // Camera follow local player smoothly
    this.cameras.main.startFollow(this.localPlayer, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, MAP_DIMENSIONS.width, MAP_DIMENSIONS.height);
    this.cameras.main.setZoom(1.15);
  }

  // ----------------------------------------------------
  // Soft Radial Vision & Emergency Siren Lighting
  // ----------------------------------------------------

  private setupLightingAndAlarms(width: number, height: number): void {
    // Soft radial vision vignette following local player
    this.visionVignette = this.add.image(1200, 900, 'vision_mask');
    this.visionVignette.setScale(3.5);
    this.visionVignette.setAlpha(0.45);
    this.visionVignette.setDepth(150);

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

    // 2. Smoothly follow local player with vision vignette
    if (this.visionVignette) {
      this.visionVignette.setPosition(this.localPlayer.x, this.localPlayer.y);
    }

    // 3. Sync Local Player state with bridge changes
    if (this.bridge.localPlayer) {
      if (this.localPlayer.playerData.isAlive !== this.bridge.localPlayer.isAlive) {
        this.localPlayer.setAliveState(this.bridge.localPlayer.isAlive);
      }
      if (this.localPlayer.playerData.color !== this.bridge.localPlayer.color) {
        this.localPlayer.applyPlayerColor(this.bridge.localPlayer.color);
        this.localPlayer.playerData.color = this.bridge.localPlayer.color;
      }
    }

    // 4. Sync Remote Players
    this.syncRemotePlayers(time, delta);

    // 5. Sync Dead Bodies
    this.syncDeadBodies();

    // 6. Sync Door Lockdowns
    this.syncDoorLockdowns();

    // 7. Sync Emergency Alarm state
    if (this.bridge.isEmergencyAlarmActive !== this.alarmOverlay.visible) {
      this.setEmergencyAlarm(this.bridge.isEmergencyAlarmActive);
    }

    // 8. Check Proximity to Interactables & Kill Targets
    this.checkProximities();
  }

  // ----------------------------------------------------
  // Remote Players Synchronization & Interpolation
  // ----------------------------------------------------

  private syncRemotePlayers(time: number, delta: number): void {
    const bridgePlayers = this.bridge.remotePlayers;

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

    for (const roomId of lockedRooms) {
      if (!this.lockedDoorColliders.has(roomId)) {
        this.spawnLockedDoorsForRoom(roomId);
      }
    }

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

    const addDoor = (x: number, y: number, w: number, h: number) => {
      const sp = this.add.sprite(x, y, 'tile_door_bulkhead').setDepth(15);
      sprites.push(sp);

      const barrier = this.add.rectangle(x, y, w, h);
      this.physics.add.existing(barrier, true);
      this.physics.add.collider(this.localPlayer!, barrier);
      colliders.push(barrier);
      barrier.setVisible(false);
    };

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
      if (station.config.type === 'vent' && (!isDisruptor || !isAlive)) {
        continue;
      }

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
