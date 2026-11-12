import Phaser from 'phaser';

/**
 * Procedural Pixel Art and Retro-Futuristic Texture Generator
 * Generates all spritesheets, tilesets, consoles, props, and particles
 * directly into Phaser's TextureManager so that NO placeholder boxes exist!
 */
export class AssetGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // 1. Particle textures
    if (!tm.exists('particle_bubble')) {
      this.generateBubble(scene);
    }
    if (!tm.exists('particle_steam')) {
      this.generateSteam(scene);
    }
    if (!tm.exists('particle_spark')) {
      this.generateSpark(scene);
    }
    if (!tm.exists('particle_spore')) {
      this.generateSpore(scene);
    }

    // 2. Tiles & Environment
    if (!tm.exists('tile_floor_grate')) {
      this.generateFloorGrate(scene);
    }
    if (!tm.exists('tile_floor_plate')) {
      this.generateFloorPlate(scene);
    }
    if (!tm.exists('tile_floor_hazard')) {
      this.generateFloorHazard(scene);
    }
    if (!tm.exists('tile_floor_hex')) {
      this.generateFloorHex(scene);
    }
    if (!tm.exists('tile_wall_bulkhead')) {
      this.generateWallBulkhead(scene);
    }
    if (!tm.exists('tile_wall_corner')) {
      this.generateWallCorner(scene);
    }
    if (!tm.exists('tile_door_bulkhead')) {
      this.generateDoorBulkhead(scene);
    }
    if (!tm.exists('viewport_window')) {
      this.generateViewportWindow(scene);
    }

    // 3. Consoles & Task Stations
    if (!tm.exists('prop_console_sonar')) {
      this.generateSonarConsole(scene);
    }
    if (!tm.exists('prop_console_circuit')) {
      this.generateCircuitConsole(scene);
    }
    if (!tm.exists('prop_console_valve')) {
      this.generateValveConsole(scene);
    }
    if (!tm.exists('prop_console_reactor')) {
      this.generateReactorConsole(scene);
    }
    if (!tm.exists('prop_console_bio')) {
      this.generateBioConsole(scene);
    }
    if (!tm.exists('prop_console_sensor')) {
      this.generateSensorConsole(scene);
    }
    if (!tm.exists('prop_console_ballast')) {
      this.generateBallastConsole(scene);
    }
    if (!tm.exists('prop_console_filtration')) {
      this.generateFiltrationConsole(scene);
    }
    if (!tm.exists('prop_emergency_table')) {
      this.generateEmergencyTable(scene);
    }
    if (!tm.exists('prop_vent_grate')) {
      this.generateVentGrate(scene);
    }
    if (!tm.exists('prop_algae_vat')) {
      this.generateAlgaeVat(scene);
    }
    if (!tm.exists('prop_med_bed')) {
      this.generateMedBed(scene);
    }
    if (!tm.exists('prop_siren_beacon')) {
      this.generateSirenBeacon(scene);
    }

    // 4. Characters & Entities
    if (!tm.exists('player_diver_sheet')) {
      this.generateDiverSpritesheet(scene);
    }
    if (!tm.exists('player_ghost_sheet')) {
      this.generateGhostSpritesheet(scene);
    }
    if (!tm.exists('prop_dead_body')) {
      this.generateDeadBody(scene);
    }
    if (!tm.exists('cosmetics_sheet')) {
      this.generateCosmeticsSheet(scene);
    }
    if (!tm.exists('badge_interaction_pill')) {
      this.generateInteractionPill(scene);
    }
  }

  // --- Helper to create canvas ---
  private static createCanvas(w: number, h: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  // ----------------------------------------------------
  // Particles
  // ----------------------------------------------------

  private static generateBubble(scene: Phaser.Scene): void {
    const c = this.createCanvas(16, 16);
    const ctx = c.getContext('2d')!;

    // Translucent glowing underwater bubble
    const grad = ctx.createRadialGradient(8, 8, 2, 8, 8, 7);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.4, 'rgba(0, 240, 255, 0.6)');
    grad.addColorStop(0.8, 'rgba(0, 150, 255, 0.3)');
    grad.addColorStop(1, 'rgba(0, 100, 200, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, 6, 2, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('particle_bubble', c);
  }

  private static generateSteam(scene: Phaser.Scene): void {
    const c = this.createCanvas(24, 24);
    const ctx = c.getContext('2d')!;

    const grad = ctx.createRadialGradient(12, 12, 2, 12, 12, 11);
    grad.addColorStop(0, 'rgba(220, 245, 255, 0.7)');
    grad.addColorStop(0.6, 'rgba(120, 200, 240, 0.3)');
    grad.addColorStop(1, 'rgba(50, 100, 150, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(12, 12, 11, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('particle_steam', c);
  }

  private static generateSpark(scene: Phaser.Scene): void {
    const c = this.createCanvas(12, 12);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#ffff66';
    ctx.fillRect(5, 1, 2, 10);
    ctx.fillRect(1, 5, 10, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, 4, 4);

    scene.textures.addCanvas('particle_spark', c);
  }

  private static generateSpore(scene: Phaser.Scene): void {
    const c = this.createCanvas(10, 10);
    const ctx = c.getContext('2d')!;

    const grad = ctx.createRadialGradient(5, 5, 1, 5, 5, 4);
    grad.addColorStop(0, 'rgba(0, 255, 180, 0.9)');
    grad.addColorStop(0.7, 'rgba(0, 200, 100, 0.4)');
    grad.addColorStop(1, 'rgba(0, 50, 50, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(5, 5, 4, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('particle_spore', c);
  }

  // ----------------------------------------------------
  // Environment Tiles & Bulkheads
  // ----------------------------------------------------

  private static generateFloorGrate(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    // Base dark navy metal
    ctx.fillStyle = '#121e2d';
    ctx.fillRect(0, 0, 32, 32);

    // Crosshatch steel mesh
    ctx.strokeStyle = '#080d14';
    ctx.lineWidth = 1;
    for (let i = 0; i < 32; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 32);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(32, i);
      ctx.stroke();
    }

    // Outer panel frame with rivets
    ctx.strokeStyle = '#1b2c40';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);

    // Corner rivets
    ctx.fillStyle = '#2d4460';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(28, 2, 2, 2);
    ctx.fillRect(2, 28, 2, 2);
    ctx.fillRect(28, 28, 2, 2);

    scene.textures.addCanvas('tile_floor_grate', c);
  }

  private static generateFloorPlate(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    // Smooth submarine navy plate
    ctx.fillStyle = '#162436';
    ctx.fillRect(0, 0, 32, 32);

    // Subtle center diamond weld
    ctx.fillStyle = '#1b2e45';
    ctx.fillRect(4, 4, 24, 24);

    ctx.strokeStyle = '#223854';
    ctx.lineWidth = 1;
    ctx.strokeRect(4.5, 4.5, 23, 23);

    // Outer border
    ctx.strokeStyle = '#0e1824';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    // Screws
    ctx.fillStyle = '#334e6e';
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(29, 2, 1, 1);
    ctx.fillRect(2, 29, 1, 1);
    ctx.fillRect(29, 29, 1, 1);

    scene.textures.addCanvas('tile_floor_plate', c);
  }

  private static generateFloorHazard(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#111820';
    ctx.fillRect(0, 0, 32, 32);

    // Yellow hazard diagonal stripes
    ctx.fillStyle = '#cca500';
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(8, 0);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 16);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(24, 0);
    ctx.lineTo(32, 0);
    ctx.lineTo(0, 32);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(8, 32);
    ctx.lineTo(32, 8);
    ctx.lineTo(32, 16);
    ctx.lineTo(16, 32);
    ctx.fill();

    ctx.strokeStyle = '#080d14';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    scene.textures.addCanvas('tile_floor_hazard', c);
  }

  private static generateFloorHex(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#141f2e';
    ctx.fillRect(0, 0, 32, 32);

    // Glowing cyan circuit line
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(16, 12);
    ctx.lineTo(28, 20);
    ctx.lineTo(28, 32);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(16, 12);
    ctx.lineTo(4, 20);
    ctx.stroke();

    // Small node glow
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(15, 11, 3, 3);

    ctx.strokeStyle = '#0a1018';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    scene.textures.addCanvas('tile_floor_hex', c);
  }

  private static generateWallBulkhead(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    // Dark titanium bulkhead wall
    ctx.fillStyle = '#1c2838';
    ctx.fillRect(0, 0, 32, 32);

    // Upper highlight rim (3D depth)
    ctx.fillStyle = '#2f425b';
    ctx.fillRect(0, 0, 32, 6);

    // Shadowed recessed panel
    ctx.fillStyle = '#15202e';
    ctx.fillRect(4, 8, 24, 20);

    // Hazard accent bar along bulkhead bottom
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(0, 29, 32, 3);
    ctx.fillStyle = '#0a1018';
    ctx.fillRect(8, 29, 6, 3);
    ctx.fillRect(20, 29, 6, 3);

    // Heavy rivets
    ctx.fillStyle = '#405878';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(28, 2, 2, 2);
    ctx.fillRect(6, 10, 2, 2);
    ctx.fillRect(24, 10, 2, 2);

    scene.textures.addCanvas('tile_wall_bulkhead', c);
  }

  private static generateWallCorner(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#223247';
    ctx.fillRect(0, 0, 32, 32);

    // Cross bracing
    ctx.strokeStyle = '#324a68';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(30, 30);
    ctx.moveTo(30, 2);
    ctx.lineTo(2, 30);
    ctx.stroke();

    // Riveted steel frame
    ctx.strokeStyle = '#101924';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 30, 30);

    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(14, 14, 4, 4);

    scene.textures.addCanvas('tile_wall_corner', c);
  }

  private static generateDoorBulkhead(scene: Phaser.Scene): void {
    const c = this.createCanvas(64, 32);
    const ctx = c.getContext('2d')!;

    // Hydraulic blast door frame
    ctx.fillStyle = '#162333';
    ctx.fillRect(0, 0, 64, 32);

    // Left and right door panels meeting in center
    ctx.fillStyle = '#2b3d54';
    ctx.fillRect(4, 4, 27, 24);
    ctx.fillRect(33, 4, 27, 24);

    // Center seam
    ctx.fillStyle = '#0c131c';
    ctx.fillRect(31, 0, 2, 32);

    // Status LED indicator in middle
    ctx.fillStyle = '#00ff66';
    ctx.beginPath();
    ctx.arc(32, 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Caution stripes along door edges
    ctx.fillStyle = '#cca500';
    ctx.fillRect(6, 24, 23, 3);
    ctx.fillRect(35, 24, 23, 3);

    scene.textures.addCanvas('tile_door_bulkhead', c);
  }

  private static generateViewportWindow(scene: Phaser.Scene): void {
    const c = this.createCanvas(128, 48);
    const ctx = c.getContext('2d')!;

    // Outer heavy steel flange with bolts
    ctx.fillStyle = '#121d2b';
    ctx.fillRect(0, 0, 128, 48);

    // Window pane showing deep abyssal waters
    const waterGrad = ctx.createLinearGradient(0, 6, 0, 42);
    waterGrad.addColorStop(0, '#041020');
    waterGrad.addColorStop(0.5, '#020b17');
    waterGrad.addColorStop(1, '#01050d');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(6, 6, 116, 36);

    // Distant caustic light refraction
    ctx.strokeStyle = 'rgba(0, 230, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 14);
    ctx.quadraticCurveTo(40, 22, 70, 12);
    ctx.quadraticCurveTo(100, 24, 120, 16);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, 28);
    ctx.quadraticCurveTo(60, 36, 100, 26);
    ctx.stroke();

    // Glass specular reflection highlight across window
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(80, 6);
    ctx.lineTo(110, 6);
    ctx.lineTo(70, 42);
    ctx.lineTo(40, 42);
    ctx.closePath();
    ctx.fill();

    // Bolts on frame
    ctx.fillStyle = '#334c6b';
    for (let x = 10; x < 120; x += 16) {
      ctx.fillRect(x, 2, 2, 2);
      ctx.fillRect(x, 44, 2, 2);
    }

    scene.textures.addCanvas('viewport_window', c);
  }

  // ----------------------------------------------------
  // Consoles & Task Stations
  // ----------------------------------------------------

  private static generateSonarConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Console desk
    ctx.fillStyle = '#1a2738';
    ctx.fillRect(4, 8, 40, 36);
    ctx.strokeStyle = '#2b3f59';
    ctx.strokeRect(4.5, 8.5, 39, 35);

    // Circular radar screen
    ctx.fillStyle = '#041512';
    ctx.beginPath();
    ctx.arc(24, 24, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Radar concentric rings
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
    ctx.beginPath();
    ctx.arc(24, 24, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(24, 24, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Sweep line
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24, 24);
    ctx.lineTo(34, 16);
    ctx.stroke();

    // Blip
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(28, 20, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bottom keypad / buttons
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(8, 40, 4, 2);
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(14, 40, 4, 2);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(20, 40, 4, 2);

    scene.textures.addCanvas('prop_console_sonar', c);
  }

  private static generateCircuitConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Industrial electrical breaker cabinet
    ctx.fillStyle = '#222830';
    ctx.fillRect(6, 6, 36, 38);
    ctx.strokeStyle = '#3d4754';
    ctx.strokeRect(6.5, 6.5, 35, 37);

    // Yellow warning triangle
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(24, 10);
    ctx.lineTo(32, 22);
    ctx.lineTo(16, 22);
    ctx.closePath();
    ctx.fill();

    // Lightning bolt in triangle
    ctx.fillStyle = '#111';
    ctx.fillRect(23, 13, 2, 4);
    ctx.fillRect(22, 16, 4, 2);
    ctx.fillRect(23, 17, 2, 3);

    // Colored terminal wires
    ctx.strokeStyle = '#00f3ff'; // cyan
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 28);
    ctx.lineTo(18, 38);
    ctx.stroke();

    ctx.strokeStyle = '#ff3864'; // magenta/red
    ctx.beginPath();
    ctx.moveTo(18, 28);
    ctx.lineTo(26, 38);
    ctx.stroke();

    ctx.strokeStyle = '#ffd700'; // yellow
    ctx.beginPath();
    ctx.moveTo(26, 28);
    ctx.lineTo(34, 38);
    ctx.stroke();

    ctx.strokeStyle = '#00e676'; // green
    ctx.beginPath();
    ctx.moveTo(34, 28);
    ctx.lineTo(38, 38);
    ctx.stroke();

    scene.textures.addCanvas('prop_console_circuit', c);
  }

  private static generateValveConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Pressure pipe assembly
    ctx.fillStyle = '#2a3545';
    ctx.fillRect(6, 18, 36, 12);
    ctx.fillStyle = '#1c2430';
    ctx.fillRect(6, 28, 36, 16);

    // Dual brass pressure dials
    ctx.fillStyle = '#3a301a';
    ctx.beginPath();
    ctx.arc(16, 14, 8, 0, Math.PI * 2);
    ctx.arc(32, 14, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cca500';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Needles
    ctx.strokeStyle = '#ff3333';
    ctx.beginPath();
    ctx.moveTo(16, 14);
    ctx.lineTo(20, 10);
    ctx.moveTo(32, 14);
    ctx.lineTo(30, 8);
    ctx.stroke();

    // Heavy red hand-wheel valve
    ctx.strokeStyle = '#ff3864';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(24, 34, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 27);
    ctx.lineTo(24, 41);
    ctx.moveTo(17, 34);
    ctx.lineTo(31, 34);
    ctx.stroke();

    scene.textures.addCanvas('prop_console_valve', c);
  }

  private static generateReactorConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Geothermal core housing
    ctx.fillStyle = '#1c222c';
    ctx.fillRect(8, 4, 32, 40);

    // Glowing energy core chamber
    const coreGrad = ctx.createRadialGradient(24, 24, 2, 24, 24, 12);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#ffaa00');
    coreGrad.addColorStop(0.8, '#ff3300');
    coreGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(24, 24, 12, 0, Math.PI * 2);
    ctx.fill();

    // Magnetic containment coils
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(24, 24, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Heavy cooling vents
    ctx.fillStyle = '#3a4a5e';
    ctx.fillRect(4, 14, 4, 20);
    ctx.fillRect(40, 14, 4, 20);

    scene.textures.addCanvas('prop_console_reactor', c);
  }

  private static generateBioConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Clean lab workbench
    ctx.fillStyle = '#203247';
    ctx.fillRect(4, 12, 40, 32);

    // Holographic Petri scanner plate
    ctx.fillStyle = 'rgba(0, 255, 180, 0.2)';
    ctx.beginPath();
    ctx.ellipse(24, 32, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ffb4';
    ctx.stroke();

    // Rack of 4 specimen test tubes
    const tubeColors = ['#00e676', '#bf55ec', '#ff3864', '#00f3ff'];
    for (let i = 0; i < 4; i++) {
      const tx = 12 + i * 7;
      // Glass tube
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(tx, 14, 4, 12);
      // Fluid
      ctx.fillStyle = tubeColors[i];
      ctx.fillRect(tx, 18, 4, 8);
      // Stopper
      ctx.fillStyle = '#333';
      ctx.fillRect(tx - 0.5, 13, 5, 2);
    }

    scene.textures.addCanvas('prop_console_bio', c);
  }

  private static generateSensorConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Telemetry display base
    ctx.fillStyle = '#182434';
    ctx.fillRect(6, 10, 36, 34);

    // Directional alignment compass dial
    ctx.fillStyle = '#0a121e';
    ctx.beginPath();
    ctx.arc(24, 24, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(24, 13);
    ctx.lineTo(24, 35);
    ctx.moveTo(13, 24);
    ctx.lineTo(35, 24);
    ctx.stroke();

    // Bearing target needle
    ctx.strokeStyle = '#ff3864';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 24);
    ctx.lineTo(31, 17);
    ctx.stroke();

    // Swivel dish antenna on top
    ctx.fillStyle = '#3d526e';
    ctx.fillRect(22, 4, 4, 6);
    ctx.beginPath();
    ctx.arc(24, 4, 6, Math.PI, 0);
    ctx.fill();

    scene.textures.addCanvas('prop_console_sensor', c);
  }

  private static generateBallastConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Marine pipe manifold
    ctx.fillStyle = '#1e2b3c';
    ctx.fillRect(4, 8, 40, 36);

    // Water level glass sight tube
    ctx.fillStyle = '#002b40';
    ctx.fillRect(8, 12, 6, 28);
    ctx.fillStyle = 'rgba(0, 200, 255, 0.6)';
    ctx.fillRect(8, 22, 6, 18);
    ctx.strokeStyle = '#00f3ff';
    ctx.strokeRect(8, 12, 6, 28);

    // 4 numbered lever switches
    for (let i = 0; i < 4; i++) {
      const lx = 20 + i * 6;
      ctx.fillStyle = '#111';
      ctx.fillRect(lx, 16, 3, 20);
      // Brass handle
      ctx.fillStyle = '#cca500';
      ctx.fillRect(lx - 1, 22 + (i % 2) * 6, 5, 4);
    }

    scene.textures.addCanvas('prop_console_ballast', c);
  }

  private static generateFiltrationConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Vent housing
    ctx.fillStyle = '#192535';
    ctx.fillRect(4, 4, 40, 40);

    // Circular intake turbine
    ctx.fillStyle = '#090f18';
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.fill();

    // Turbine blades
    ctx.strokeStyle = '#394d68';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(24, 24);
      ctx.lineTo(24 + Math.cos(angle) * 14, 24 + Math.sin(angle) * 14);
      ctx.stroke();
    }

    // Kelp/debris fragments stuck in grill
    ctx.fillStyle = '#008744';
    ctx.fillRect(16, 14, 5, 3);
    ctx.fillRect(26, 26, 6, 4);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(20, 28, 4, 3);

    scene.textures.addCanvas('prop_console_filtration', c);
  }

  private static generateEmergencyTable(scene: Phaser.Scene): void {
    const c = this.createCanvas(80, 80);
    const ctx = c.getContext('2d')!;

    // Octagonal meeting conference desk
    ctx.fillStyle = '#182436';
    ctx.beginPath();
    ctx.moveTo(24, 4);
    ctx.lineTo(56, 4);
    ctx.lineTo(76, 24);
    ctx.lineTo(76, 56);
    ctx.lineTo(56, 76);
    ctx.lineTo(24, 76);
    ctx.lineTo(4, 56);
    ctx.lineTo(4, 24);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner table ring
    ctx.strokeStyle = '#2d4564';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(40, 40, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Raised glass protective dome
    const domeGrad = ctx.createRadialGradient(40, 40, 2, 40, 40, 16);
    domeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    domeGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.4)');
    domeGrad.addColorStop(1, 'rgba(0, 100, 180, 0.2)');
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(40, 40, 16, 0, Math.PI * 2);
    ctx.fill();

    // BIG RED EMERGENCY BUTTON
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(40, 40, 9, 0, Math.PI * 2);
    ctx.fill();

    // Specular shine on button
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.arc(38, 38, 3, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('prop_emergency_table', c);
  }

  private static generateVentGrate(scene: Phaser.Scene): void {
    const c = this.createCanvas(36, 36);
    const ctx = c.getContext('2d')!;

    // Outer steel rim
    ctx.fillStyle = '#1c2838';
    ctx.fillRect(0, 0, 36, 36);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 35, 35);

    // Deep abyss duct void
    ctx.fillStyle = '#060a10';
    ctx.fillRect(4, 4, 28, 28);

    // Slotted metal vent bars
    ctx.fillStyle = '#3a4e69';
    for (let y = 7; y < 32; y += 5) {
      ctx.fillRect(5, y, 26, 2);
    }

    scene.textures.addCanvas('prop_vent_grate', c);
  }

  private static generateAlgaeVat(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 64);
    const ctx = c.getContext('2d')!;

    // Upper and lower industrial steel caps
    ctx.fillStyle = '#1c2838';
    ctx.fillRect(4, 2, 40, 8);
    ctx.fillRect(4, 54, 40, 8);

    // Glass cylinder
    const vatGrad = ctx.createLinearGradient(8, 10, 40, 10);
    vatGrad.addColorStop(0, 'rgba(0, 255, 150, 0.3)');
    vatGrad.addColorStop(0.3, 'rgba(0, 255, 200, 0.7)');
    vatGrad.addColorStop(0.7, 'rgba(0, 200, 120, 0.8)');
    vatGrad.addColorStop(1, 'rgba(0, 150, 80, 0.4)');
    ctx.fillStyle = vatGrad;
    ctx.fillRect(8, 10, 32, 44);

    // Bioluminescent algae coils
    ctx.strokeStyle = '#66ffb2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, 50);
    ctx.quadraticCurveTo(28, 36, 18, 24);
    ctx.quadraticCurveTo(12, 14, 22, 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(30, 48);
    ctx.quadraticCurveTo(18, 32, 28, 16);
    ctx.stroke();

    // Spores / bubbles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 20, 2, 2);
    ctx.fillRect(26, 38, 2, 2);
    ctx.fillRect(22, 46, 2, 2);

    scene.textures.addCanvas('prop_algae_vat', c);
  }

  private static generateMedBed(scene: Phaser.Scene): void {
    const c = this.createCanvas(56, 36);
    const ctx = c.getContext('2d')!;

    // Scanner bed frame
    ctx.fillStyle = '#1c2838';
    ctx.fillRect(2, 6, 52, 24);

    // Sterile white/teal mattress pad
    ctx.fillStyle = '#e0f7fa';
    ctx.fillRect(6, 9, 44, 18);

    // Pillow headrest
    ctx.fillStyle = '#b2ebf2';
    ctx.fillRect(8, 11, 8, 14);

    // Holographic ECG vital monitor screen above bed
    ctx.fillStyle = '#061320';
    ctx.fillRect(36, 0, 16, 10);
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(37, 5);
    ctx.lineTo(41, 5);
    ctx.lineTo(43, 2);
    ctx.lineTo(45, 8);
    ctx.lineTo(47, 5);
    ctx.lineTo(51, 5);
    ctx.stroke();

    scene.textures.addCanvas('prop_med_bed', c);
  }

  private static generateSirenBeacon(scene: Phaser.Scene): void {
    const c = this.createCanvas(24, 24);
    const ctx = c.getContext('2d')!;

    // Base bracket
    ctx.fillStyle = '#222';
    ctx.fillRect(6, 16, 12, 6);

    // Amber/red dome
    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    ctx.arc(12, 12, 8, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Glass sheen
    ctx.fillStyle = '#ffaa44';
    ctx.fillRect(10, 6, 4, 6);

    scene.textures.addCanvas('prop_siren_beacon', c);
  }

  // ----------------------------------------------------
  // Character Spritesheets (Diver, Ghost, Dead Body, Cosmetics)
  // ----------------------------------------------------

  /**
   * Generates a 48x48 4-direction walk cycle sheet for the diving suit:
   * 4 frames per direction (Down, Left, Right, Up).
   * Rendered in light grayscale so Phaser `setTint` seamlessly styles the suit fabric
   * while keeping visor cyan reflections and brass collar highlights gleaming!
   */
  private static generateDiverSpritesheet(scene: Phaser.Scene): void {
    const fw = 48;
    const fh = 48;
    const cols = 4; // 4 walk frames
    const rows = 4; // Down, Left, Right, Up
    const c = this.createCanvas(fw * cols, fh * rows);
    const ctx = c.getContext('2d')!;

    for (let r = 0; r < rows; r++) {
      for (let f = 0; f < cols; f++) {
        const ox = f * fw;
        const oy = r * fh;
        this.drawDiverFrame(ctx, ox, oy, r, f);
      }
    }

    scene.textures.addCanvas('player_diver_sheet', c);
  }

  private static drawDiverFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    dirRow: number, // 0 = Down, 1 = Left, 2 = Right, 3 = Up
    frame: number
  ): void {
    const walkOffset = (frame % 2 === 1) ? 1 : -1;
    const legStride = (frame === 1) ? 3 : (frame === 3) ? -3 : 0;

    const cx = ox + 24;
    const cy = oy + 26 + (frame % 2 === 1 ? 1 : 0);

    // 1. Oxygen tank backpack (drawn behind diver when facing down/sides, or in front when facing up)
    if (dirRow !== 3) {
      // Behind diver
      ctx.fillStyle = '#7a8c9e';
      ctx.fillRect(cx - 9, cy - 12, 18, 14);
      // Dual brass tank valves on top
      ctx.fillStyle = '#cca500';
      ctx.fillRect(cx - 7, cy - 15, 4, 3);
      ctx.fillRect(cx + 3, cy - 15, 4, 3);
    }

    // 2. Heavy dive suit legs / boots
    ctx.fillStyle = '#9cb0c4'; // Tintable suit fabric base
    // Left leg
    ctx.fillRect(cx - 8, cy + 6, 6, 10 + legStride);
    // Right leg
    ctx.fillRect(cx + 2, cy + 6, 6, 10 - legStride);

    // Heavy weighted magnetic boots
    ctx.fillStyle = '#405060';
    ctx.fillRect(cx - 10, cy + 14 + legStride, 8, 4);
    ctx.fillRect(cx + 2, cy + 14 - legStride, 8, 4);

    // 3. Dive suit torso & chest plate
    ctx.fillStyle = '#c0d2e2'; // Light base for Phaser color tinting
    ctx.fillRect(cx - 9, cy - 8, 18, 15);

    // Shading on edges
    ctx.fillStyle = '#7a8c9e';
    ctx.fillRect(cx - 9, cy - 8, 2, 15);
    ctx.fillRect(cx + 7, cy - 8, 2, 15);

    // Harness straps & pressure belt
    ctx.fillStyle = '#223344';
    ctx.fillRect(cx - 9, cy + 3, 18, 3); // Belt
    ctx.fillStyle = '#cca500'; // Belt buckle
    ctx.fillRect(cx - 2, cy + 3, 4, 3);

    // 4. Arms
    ctx.fillStyle = '#9cb0c4';
    if (dirRow === 0) { // Down
      ctx.fillRect(cx - 12, cy - 6 + walkOffset, 4, 11);
      ctx.fillRect(cx + 8, cy - 6 - walkOffset, 4, 11);
      // Gloves
      ctx.fillStyle = '#3a4a5a';
      ctx.fillRect(cx - 12, cy + 4 + walkOffset, 4, 3);
      ctx.fillRect(cx + 8, cy + 4 - walkOffset, 4, 3);
    } else if (dirRow === 1) { // Left
      ctx.fillRect(cx - 7 + legStride, cy - 5, 5, 11);
      ctx.fillStyle = '#3a4a5a';
      ctx.fillRect(cx - 7 + legStride, cy + 5, 5, 3);
    } else if (dirRow === 2) { // Right
      ctx.fillRect(cx + 2 - legStride, cy - 5, 5, 11);
      ctx.fillStyle = '#3a4a5a';
      ctx.fillRect(cx + 2 - legStride, cy + 5, 5, 3);
    } else { // Up
      ctx.fillRect(cx - 12, cy - 6 - walkOffset, 4, 11);
      ctx.fillRect(cx + 8, cy - 6 + walkOffset, 4, 11);
      ctx.fillStyle = '#3a4a5a';
      ctx.fillRect(cx - 12, cy + 4 - walkOffset, 4, 3);
      ctx.fillRect(cx + 8, cy + 4 + walkOffset, 4, 3);
    }

    // 5. Heavy Collar / Helmet Ring
    ctx.fillStyle = '#cca500'; // Brass collar ring
    ctx.fillRect(cx - 8, cy - 10, 16, 4);

    // 6. Spherical Pressure Helmet
    ctx.fillStyle = '#cddbe8';
    ctx.beginPath();
    ctx.arc(cx, cy - 16, 9, 0, Math.PI * 2);
    ctx.fill();

    // 7. Glass Visor according to facing direction
    if (dirRow === 0) {
      // Facing Down: large central glowing cyan visor
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 15, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Curved reflection shine
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 4, cy - 17, 3, 2);
    } else if (dirRow === 1) {
      // Facing Left: visor on left side
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy - 15, 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 6, cy - 17, 2, 2);
    } else if (dirRow === 2) {
      // Facing Right: visor on right side
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy - 15, 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 4, cy - 17, 2, 2);
    } else {
      // Facing Up: back of helmet + oxygen manifold
      ctx.fillStyle = '#7a8c9e';
      ctx.fillRect(cx - 5, cy - 18, 10, 5);
      // Regulating hose
      ctx.strokeStyle = '#223344';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 14);
      ctx.lineTo(cx - 8, cy - 8);
      ctx.stroke();
    }

    // If facing up, oxygen tank backpack is drawn on back
    if (dirRow === 3) {
      ctx.fillStyle = '#7a8c9e';
      ctx.fillRect(cx - 8, cy - 7, 16, 13);
      ctx.fillStyle = '#cca500';
      ctx.fillRect(cx - 6, cy - 9, 3, 3);
      ctx.fillRect(cx + 3, cy - 9, 3, 3);
    }
  }

  /**
   * Generates a 4-frame floating Ghost Spritesheet
   */
  private static generateGhostSpritesheet(scene: Phaser.Scene): void {
    const fw = 48;
    const fh = 48;
    const cols = 4;
    const c = this.createCanvas(fw * cols, fh);
    const ctx = c.getContext('2d')!;

    for (let f = 0; f < cols; f++) {
      const ox = f * fw;
      const hoverY = Math.sin((f * Math.PI) / 2) * 2;
      const cx = ox + 24;
      const cy = 24 + hoverY;

      // Ethereal translucent aura
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
      grad.addColorStop(0, 'rgba(0, 243, 255, 0.7)');
      grad.addColorStop(0.6, 'rgba(0, 180, 255, 0.4)');
      grad.addColorStop(1, 'rgba(0, 50, 120, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Ghost head / torso
      ctx.fillStyle = 'rgba(230, 250, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 9, 0, Math.PI * 2);
      ctx.fill();

      // Flowing ghostly vapor trail
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 2);
      ctx.lineTo(cx - 6 + (f % 2), cy + 16);
      ctx.lineTo(cx, cy + 12);
      ctx.lineTo(cx + 6 - (f % 2), cy + 16);
      ctx.lineTo(cx + 8, cy - 2);
      ctx.closePath();
      ctx.fill();

      // Glowing spectral eyes
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(cx - 4, cy - 8, 3, 3);
      ctx.fillRect(cx + 2, cy - 8, 3, 3);
    }

    scene.textures.addCanvas('player_ghost_sheet', c);
  }

  /**
   * Generates Dead Body prop (collapsed suit with broken visor & distress beacon)
   */
  private static generateDeadBody(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    const cx = 24;
    const cy = 24;

    // Blood / hydraulic oil pool
    ctx.fillStyle = 'rgba(200, 20, 40, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Collapsed diving suit torso
    ctx.fillStyle = '#6b7c8d';
    ctx.fillRect(cx - 14, cy - 2, 20, 12);

    // Crumpled legs
    ctx.fillStyle = '#4f5e6d';
    ctx.fillRect(cx - 18, cy + 6, 12, 6);
    ctx.fillRect(cx - 10, cy + 9, 14, 5);

    // Severed oxygen hose with trailing bubbles
    ctx.strokeStyle = '#223344';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 1);
    ctx.quadraticCurveTo(cx + 10, cy - 8, cx + 16, cy - 4);
    ctx.stroke();

    // Slumped helmet with cracked visor
    ctx.fillStyle = '#8ca0b4';
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Visor dark / shattered
    ctx.fillStyle = '#0a1018';
    ctx.beginPath();
    ctx.arc(cx + 9, cy + 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Crack line
    ctx.strokeStyle = '#ff3864';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy);
    ctx.lineTo(cx + 10, cy + 4);
    ctx.lineTo(cx + 12, cy + 1);
    ctx.stroke();

    // Pulsing distress beacon antenna
    ctx.fillStyle = '#cca500';
    ctx.fillRect(cx - 8, cy - 8, 3, 6);
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(cx - 6.5, cy - 9, 3, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('prop_dead_body', c);
  }

  /**
   * Generates Cosmetic Overlays (hats, helmets, goggles)
   */
  private static generateCosmeticsSheet(scene: Phaser.Scene): void {
    // 8 cosmetics, 32x32 each
    const c = this.createCanvas(32 * 8, 32);
    const ctx = c.getContext('2d')!;

    // 0: standard_helm (LED visor ring)
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 12, 16, 8);

    // 1: deep_diver (heavy brass porthole helmet cage)
    ctx.fillStyle = '#cca500';
    ctx.fillRect(32 + 6, 8, 20, 16);
    ctx.fillStyle = '#222';
    ctx.fillRect(32 + 10, 12, 12, 8);
    ctx.strokeStyle = '#cca500';
    ctx.strokeRect(32 + 10, 12, 12, 8);

    // 2: welding_mask (gold plated shield)
    ctx.fillStyle = '#333';
    ctx.fillRect(64 + 7, 8, 18, 18);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(64 + 10, 14, 12, 4);

    // 3: captain_cap (navy naval hat)
    ctx.fillStyle = '#002040';
    ctx.fillRect(96 + 6, 8, 20, 8);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(96 + 4, 14, 24, 3); // Brim
    ctx.fillRect(96 + 14, 9, 4, 4); // Anchor badge

    // 4: biologist_goggles (dual glowing green lenses)
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.arc(128 + 11, 14, 4, 0, Math.PI * 2);
    ctx.arc(128 + 21, 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // 5: hazard_rebreather (dual side filtration canisters)
    ctx.fillStyle = '#e65100';
    ctx.fillRect(160 + 5, 14, 6, 10);
    ctx.fillRect(160 + 21, 14, 6, 10);
    ctx.fillStyle = '#222';
    ctx.fillRect(160 + 11, 15, 10, 8);

    // 6: aquanaut_beret (teal tactical beret)
    ctx.fillStyle = '#0077be';
    ctx.beginPath();
    ctx.ellipse(192 + 16, 10, 12, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cca500';
    ctx.fillRect(192 + 10, 9, 3, 3);

    // 7: sonar_headset (acoustic headphones with boom mic)
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(224 + 5, 12, 4, 10);
    ctx.fillRect(224 + 23, 12, 4, 10);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(224 + 16, 14, 11, Math.PI, 0);
    ctx.stroke();
    // Mic boom
    ctx.beginPath();
    ctx.moveTo(224 + 7, 20);
    ctx.lineTo(224 + 14, 23);
    ctx.stroke();

    scene.textures.addCanvas('cosmetics_sheet', c);
  }

  /**
   * Generates glowing UI badge for interactions: [E] CALIBRATE SONAR, etc.
   */
  private static generateInteractionPill(scene: Phaser.Scene): void {
    const c = this.createCanvas(160, 32);
    const ctx = c.getContext('2d')!;

    // Pill background
    ctx.fillStyle = 'rgba(8, 20, 36, 0.9)';
    ctx.beginPath();
    ctx.roundRect(2, 2, 156, 28, 8);
    ctx.fill();

    // Glowing cyan border
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2, 2, 156, 28, 8);
    ctx.stroke();

    // Key cap [E]
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.roundRect(6, 6, 20, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', 16, 16);

    scene.textures.addCanvas('badge_interaction_pill', c);
  }
}
