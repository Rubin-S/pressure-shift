import Phaser from 'phaser';

/**
 * Procedural Pixel Art and Retro-Futuristic Texture Generator
 * Studio-Grade Minimalist Aesthetic for Nadir-7 Research Station.
 * High-definition procedural canvas textures, balanced color palettes,
 * clean bevels, glowing conduits, and sci-fi diving personnel.
 */
export class AssetGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // 1. Particles & Lighting
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
    if (!tm.exists('vision_mask')) {
      this.generateVisionMask(scene);
    }

    // 2. Tiles & Floor Materials
    if (!tm.exists('tile_floor_plate')) {
      this.generateFloorPlate(scene);
    }
    if (!tm.exists('tile_floor_grate')) {
      this.generateFloorGrate(scene);
    }
    if (!tm.exists('tile_floor_rubber')) {
      this.generateFloorRubber(scene);
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
    if (!tm.exists('tile_conduit_h')) {
      this.generateConduitH(scene);
    }
    if (!tm.exists('tile_conduit_v')) {
      this.generateConduitV(scene);
    }

    // 3. Sector Props & Task Stations
    if (!tm.exists('prop_emergency_table')) {
      this.generateEmergencyTable(scene);
    }
    if (!tm.exists('prop_docking_clamp')) {
      this.generateDockingClamp(scene);
    }
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
    if (!tm.exists('prop_server_rack')) {
      this.generateServerRack(scene);
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

  private static createCanvas(w: number, h: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  // ----------------------------------------------------
  // Particles & Soft Vision Mask
  // ----------------------------------------------------

  private static generateBubble(scene: Phaser.Scene): void {
    const c = this.createCanvas(16, 16);
    const ctx = c.getContext('2d')!;

    const grad = ctx.createRadialGradient(8, 8, 2, 8, 8, 7);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.35, 'rgba(0, 240, 255, 0.65)');
    grad.addColorStop(0.75, 'rgba(0, 140, 220, 0.25)');
    grad.addColorStop(1, 'rgba(0, 80, 160, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Specular curved reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(6, 6, 2, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('particle_bubble', c);
  }

  private static generateSteam(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    const grad = ctx.createRadialGradient(16, 16, 3, 16, 16, 15);
    grad.addColorStop(0, 'rgba(220, 245, 255, 0.6)');
    grad.addColorStop(0.5, 'rgba(100, 190, 230, 0.25)');
    grad.addColorStop(1, 'rgba(20, 80, 140, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('particle_steam', c);
  }

  private static generateSpark(scene: Phaser.Scene): void {
    const c = this.createCanvas(16, 16);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(7, 1, 2, 14);
    ctx.fillRect(1, 7, 14, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 4, 4);

    scene.textures.addCanvas('particle_spark', c);
  }

  private static generateSpore(scene: Phaser.Scene): void {
    const c = this.createCanvas(12, 12);
    const ctx = c.getContext('2d')!;

    const grad = ctx.createRadialGradient(6, 6, 1, 6, 6, 5);
    grad.addColorStop(0, 'rgba(0, 255, 180, 0.95)');
    grad.addColorStop(0.6, 'rgba(0, 200, 120, 0.4)');
    grad.addColorStop(1, 'rgba(0, 60, 40, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(6, 6, 5, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('particle_spore', c);
  }

  private static generateVisionMask(scene: Phaser.Scene): void {
    // 512x512 radial gradient mask for smooth cinematic ambient lighting
    const c = this.createCanvas(512, 512);
    const ctx = c.getContext('2d')!;

    const grad = ctx.createRadialGradient(256, 256, 80, 256, 256, 256);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.5, 'rgba(0, 4, 12, 0.2)');
    grad.addColorStop(0.85, 'rgba(0, 4, 12, 0.65)');
    grad.addColorStop(1, 'rgba(0, 4, 12, 0.9)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    scene.textures.addCanvas('vision_mask', c);
  }

  // ----------------------------------------------------
  // Modern Studio Tiles & Flooring
  // ----------------------------------------------------

  private static generateFloorPlate(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    // Minimalist titanium-navy composite plate
    ctx.fillStyle = '#141d28';
    ctx.fillRect(0, 0, 32, 32);

    // Subtle beveled inner panel
    ctx.fillStyle = '#182330';
    ctx.fillRect(1, 1, 30, 30);

    // Micro-texture crossline
    ctx.strokeStyle = '#1d2b3c';
    ctx.lineWidth = 1;
    ctx.strokeRect(4.5, 4.5, 23, 23);

    // Clean seam joint border
    ctx.strokeStyle = '#0e151e';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    // Subtle corner recessed micro-fasteners
    ctx.fillStyle = '#26384e';
    ctx.fillRect(3, 3, 1, 1);
    ctx.fillRect(28, 3, 1, 1);
    ctx.fillRect(3, 28, 1, 1);
    ctx.fillRect(28, 28, 1, 1);

    scene.textures.addCanvas('tile_floor_plate', c);
  }

  private static generateFloorGrate(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    // Stainless steel drainage floor with dark abyss drainage beneath
    ctx.fillStyle = '#0d131b';
    ctx.fillRect(0, 0, 32, 32);

    // Parallel clean precision ventilation slits
    ctx.fillStyle = '#1c2838';
    for (let y = 3; y < 30; y += 4) {
      ctx.fillRect(3, y, 26, 2);
    }

    // Outer structural rim
    ctx.strokeStyle = '#223246';
    ctx.lineWidth = 1;
    ctx.strokeRect(1.5, 1.5, 29, 29);

    ctx.strokeStyle = '#0a0e14';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    scene.textures.addCanvas('tile_floor_grate', c);
  }

  private static generateFloorRubber(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    // Polished deep matte rubber walkway
    ctx.fillStyle = '#111722';
    ctx.fillRect(0, 0, 32, 32);

    // Center guide runners
    ctx.fillStyle = '#161e2b';
    ctx.fillRect(2, 2, 28, 28);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(32, 16);
    ctx.stroke();

    ctx.strokeStyle = '#0a0f16';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    scene.textures.addCanvas('tile_floor_rubber', c);
  }

  private static generateFloorHazard(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#101720';
    ctx.fillRect(0, 0, 32, 32);

    // Precision 45-degree laser safety chevrons (amber/gold)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(10, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 18);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(26, 0);
    ctx.lineTo(32, 0);
    ctx.lineTo(0, 32);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, 32);
    ctx.lineTo(32, 10);
    ctx.lineTo(32, 18);
    ctx.lineTo(18, 32);
    ctx.fill();

    // Subtle edge framing
    ctx.strokeStyle = '#0a0f15';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    scene.textures.addCanvas('tile_floor_hazard', c);
  }

  private static generateFloorHex(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    // High-tech sanitary composite tile
    ctx.fillStyle = '#131e2c';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#172435';
    ctx.fillRect(1, 1, 30, 30);

    // Recessed bioluminescent / power micro-circuit
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(16, 12);
    ctx.lineTo(26, 18);
    ctx.lineTo(26, 32);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(16, 12);
    ctx.lineTo(6, 18);
    ctx.lineTo(6, 32);
    ctx.stroke();

    // Node LED
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(15, 11, 3, 3);

    ctx.strokeStyle = '#0c131d';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    scene.textures.addCanvas('tile_floor_hex', c);
  }

  private static generateWallBulkhead(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    // Clean titanium structural wall
    ctx.fillStyle = '#1b2533';
    ctx.fillRect(0, 0, 32, 32);

    // Upper beveled armor cap (depth illusion)
    ctx.fillStyle = '#2d3d52';
    ctx.fillRect(0, 0, 32, 6);
    ctx.fillStyle = '#3a4e69';
    ctx.fillRect(0, 0, 32, 2);

    // Recessed center panel
    ctx.fillStyle = '#141c27';
    ctx.fillRect(3, 8, 26, 19);

    // High-tech recessed cyan LED status accent strip
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(4, 28, 24, 2);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.fillRect(2, 27, 28, 4);

    // Titanium mounting bolts
    ctx.fillStyle = '#4c6482';
    ctx.fillRect(4, 10, 2, 2);
    ctx.fillRect(26, 10, 2, 2);

    scene.textures.addCanvas('tile_wall_bulkhead', c);
  }

  private static generateWallCorner(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#223042';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#2d3d52';
    ctx.fillRect(2, 2, 28, 28);

    // Beveled cross rib
    ctx.strokeStyle = '#3d526e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(28, 28);
    ctx.moveTo(28, 4);
    ctx.lineTo(4, 28);
    ctx.stroke();

    // Central beacon LED
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(16, 16, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f1722';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);

    scene.textures.addCanvas('tile_wall_corner', c);
  }

  private static generateDoorBulkhead(scene: Phaser.Scene): void {
    const c = this.createCanvas(64, 32);
    const ctx = c.getContext('2d')!;

    // Sliding hydraulic airlock blast door
    ctx.fillStyle = '#172230';
    ctx.fillRect(0, 0, 64, 32);

    // Left and right composite blast plates
    ctx.fillStyle = '#243447';
    ctx.fillRect(3, 4, 27, 24);
    ctx.fillRect(34, 4, 27, 24);

    // Center interlocking seal line
    ctx.fillStyle = '#0d131c';
    ctx.fillRect(31, 0, 2, 32);

    // Status bar indicator
    ctx.fillStyle = '#00e676';
    ctx.fillRect(26, 6, 12, 3);

    // Subtle safety stripes along threshold
    ctx.fillStyle = '#cca500';
    ctx.fillRect(5, 25, 23, 2);
    ctx.fillRect(36, 25, 23, 2);

    scene.textures.addCanvas('tile_door_bulkhead', c);
  }

  private static generateViewportWindow(scene: Phaser.Scene): void {
    const c = this.createCanvas(160, 56);
    const ctx = c.getContext('2d')!;

    // Sleek titanium flange frame
    ctx.fillStyle = '#131d2a';
    ctx.fillRect(0, 0, 160, 56);

    // Panoramic quartz glass view into the abyssal ocean
    const seaGrad = ctx.createLinearGradient(0, 6, 0, 50);
    seaGrad.addColorStop(0, '#041022');
    seaGrad.addColorStop(0.5, '#020a18');
    seaGrad.addColorStop(1, '#01050e');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(6, 6, 148, 44);

    // Soft distant oceanic caustics
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 18);
    ctx.bezierCurveTo(45, 28, 85, 12, 120, 24);
    ctx.bezierCurveTo(135, 28, 145, 16, 152, 20);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 180, 0.1)';
    ctx.beginPath();
    ctx.moveTo(20, 36);
    ctx.bezierCurveTo(60, 44, 100, 32, 145, 38);
    ctx.stroke();

    // Subtle distant bioluminescent floating specks
    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.fillRect(40, 22, 2, 2);
    ctx.fillRect(105, 30, 2, 2);
    ctx.fillRect(135, 16, 1.5, 1.5);

    // Glass specular reflection slash
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(100, 6);
    ctx.lineTo(135, 6);
    ctx.lineTo(95, 50);
    ctx.lineTo(60, 50);
    ctx.closePath();
    ctx.fill();

    // Precision retaining bolts
    ctx.fillStyle = '#3b4e67';
    for (let x = 12; x < 155; x += 16) {
      ctx.fillRect(x, 2, 2, 2);
      ctx.fillRect(x, 52, 2, 2);
    }

    scene.textures.addCanvas('viewport_window', c);
  }

  private static generateConduitH(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#141d28';
    ctx.fillRect(0, 0, 32, 32);

    // Horizontal glowing cyan power conduit channel
    ctx.fillStyle = '#0e151e';
    ctx.fillRect(0, 13, 32, 6);

    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.fillRect(0, 14, 32, 4);

    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(0, 15, 32, 2);

    scene.textures.addCanvas('tile_conduit_h', c);
  }

  private static generateConduitV(scene: Phaser.Scene): void {
    const c = this.createCanvas(32, 32);
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#141d28';
    ctx.fillRect(0, 0, 32, 32);

    // Vertical glowing cyan power conduit channel
    ctx.fillStyle = '#0e151e';
    ctx.fillRect(13, 0, 6, 32);

    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.fillRect(14, 0, 4, 32);

    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(15, 0, 2, 32);

    scene.textures.addCanvas('tile_conduit_v', c);
  }

  // ----------------------------------------------------
  // Distinct Sector Props & Task Stations
  // ----------------------------------------------------

  private static generateEmergencyTable(scene: Phaser.Scene): void {
    const c = this.createCanvas(88, 88);
    const ctx = c.getContext('2d')!;

    // Central Junction: Striking octagonal command table
    ctx.fillStyle = '#172332';
    ctx.beginPath();
    ctx.moveTo(26, 4);
    ctx.lineTo(62, 4);
    ctx.lineTo(84, 26);
    ctx.lineTo(84, 62);
    ctx.lineTo(62, 84);
    ctx.lineTo(26, 84);
    ctx.lineTo(4, 62);
    ctx.lineTo(4, 26);
    ctx.closePath();
    ctx.fill();

    // Beveled rim
    ctx.strokeStyle = '#2b3f57';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Illuminated cyan floor compass ring
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(44, 44, 28, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Station terminal notches
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const tx = 44 + Math.cos(angle) * 32;
      const ty = 44 + Math.sin(angle) * 32;
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(tx - 2, ty - 2, 4, 4);
    }

    // Glass domed emergency housing
    const domeGrad = ctx.createRadialGradient(44, 44, 2, 44, 44, 18);
    domeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    domeGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.35)');
    domeGrad.addColorStop(1, 'rgba(0, 80, 160, 0.2)');
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(44, 44, 18, 0, Math.PI * 2);
    ctx.fill();

    // EMERGENCY DISPATCH RED BUTTON
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(44, 44, 10, 0, Math.PI * 2);
    ctx.fill();

    // Specular shine
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.arc(42, 42, 3, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('prop_emergency_table', c);
  }

  private static generateDockingClamp(scene: Phaser.Scene): void {
    const c = this.createCanvas(56, 48);
    const ctx = c.getContext('2d')!;

    // Docking bay submersible clamp & gantry
    ctx.fillStyle = '#1c2838';
    ctx.fillRect(4, 8, 48, 32);

    // Yellow gantry arm rails
    ctx.fillStyle = '#cca500';
    ctx.fillRect(8, 12, 40, 4);
    ctx.fillRect(8, 32, 40, 4);

    // Heavy pneumatic locking clamp arms
    ctx.fillStyle = '#3a4e69';
    ctx.fillRect(18, 4, 8, 40);
    ctx.fillRect(30, 4, 8, 40);

    // Cyan umbilical power coupler
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(26, 20, 4, 8);

    scene.textures.addCanvas('prop_docking_clamp', c);
  }

  private static generateSonarConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Sleek acoustic telemetry console
    ctx.fillStyle = '#182434';
    ctx.fillRect(4, 6, 40, 38);
    ctx.strokeStyle = '#293d56';
    ctx.strokeRect(4.5, 6.5, 39, 37);

    // Circular radar cathode-ray screen
    ctx.fillStyle = '#031410';
    ctx.beginPath();
    ctx.arc(24, 23, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Radar concentric rings
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
    ctx.beginPath();
    ctx.arc(24, 23, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(24, 23, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing sweep line
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24, 23);
    ctx.lineTo(34, 15);
    ctx.stroke();

    // Echo blip
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(28, 19, 2, 0, Math.PI * 2);
    ctx.fill();

    // Keypad LEDs
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(8, 39, 6, 2);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(18, 39, 6, 2);
    ctx.fillStyle = '#00e676';
    ctx.fillRect(28, 39, 6, 2);

    scene.textures.addCanvas('prop_console_sonar', c);
  }

  private static generateCircuitConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Modern electrical breaker cabinet
    ctx.fillStyle = '#1c2430';
    ctx.fillRect(6, 6, 36, 38);
    ctx.strokeStyle = '#344356';
    ctx.strokeRect(6.5, 6.5, 35, 37);

    // Hazard warning triangle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(24, 9);
    ctx.lineTo(32, 21);
    ctx.lineTo(16, 21);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.fillRect(23, 12, 2, 4);
    ctx.fillRect(22, 15, 4, 2);
    ctx.fillRect(23, 16, 2, 3);

    // Color-coded high-voltage leads
    ctx.strokeStyle = '#00f3ff'; // cyan
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 28);
    ctx.lineTo(18, 38);
    ctx.stroke();

    ctx.strokeStyle = '#ff3864'; // magenta
    ctx.beginPath();
    ctx.moveTo(18, 28);
    ctx.lineTo(26, 38);
    ctx.stroke();

    ctx.strokeStyle = '#ffd700'; // gold
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

    // Hyperbaric manifold & forged steel equalization valve
    ctx.fillStyle = '#222f3e';
    ctx.fillRect(6, 16, 36, 14);
    ctx.fillStyle = '#18222d';
    ctx.fillRect(6, 28, 36, 16);

    // Dual brass Bourdon pressure dials
    ctx.fillStyle = '#3a301a';
    ctx.beginPath();
    ctx.arc(16, 13, 8, 0, Math.PI * 2);
    ctx.arc(32, 13, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cca500';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Red needle indicator
    ctx.strokeStyle = '#ff3333';
    ctx.beginPath();
    ctx.moveTo(16, 13);
    ctx.lineTo(20, 9);
    ctx.moveTo(32, 13);
    ctx.lineTo(30, 7);
    ctx.stroke();

    // Valve wheel
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

    // Geothermal heat exchanger core
    ctx.fillStyle = '#1a222c';
    ctx.fillRect(8, 4, 32, 40);

    // Pulsing geothermal core
    const coreGrad = ctx.createRadialGradient(24, 24, 2, 24, 24, 12);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#ffaa00');
    coreGrad.addColorStop(0.8, '#ff3300');
    coreGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(24, 24, 12, 0, Math.PI * 2);
    ctx.fill();

    // Thermal containment coils
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(24, 24, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Titanium cooling fins
    ctx.fillStyle = '#3a4e67';
    ctx.fillRect(4, 12, 4, 24);
    ctx.fillRect(40, 12, 4, 24);

    scene.textures.addCanvas('prop_console_reactor', c);
  }

  private static generateBioConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Clean lab workbench & bio incubator
    ctx.fillStyle = '#1c2b3d';
    ctx.fillRect(4, 12, 40, 32);

    // Laser spectrometer scanner
    ctx.fillStyle = 'rgba(0, 255, 180, 0.2)';
    ctx.beginPath();
    ctx.ellipse(24, 32, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ffb4';
    ctx.stroke();

    // 4 Specimen tubes with luminous cultures
    const tubeColors = ['#00e676', '#bf55ec', '#ff3864', '#00f3ff'];
    for (let i = 0; i < 4; i++) {
      const tx = 12 + i * 7;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(tx, 14, 4, 12);
      ctx.fillStyle = tubeColors[i];
      ctx.fillRect(tx, 18, 4, 8);
      ctx.fillStyle = '#333';
      ctx.fillRect(tx - 0.5, 13, 5, 2);
    }

    scene.textures.addCanvas('prop_console_bio', c);
  }

  private static generateSensorConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Hydrophone directional acoustic array
    ctx.fillStyle = '#172435';
    ctx.fillRect(6, 10, 36, 34);

    // Target alignment compass dial
    ctx.fillStyle = '#08121d';
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

    // Swivel dish antenna
    ctx.fillStyle = '#3a4e69';
    ctx.fillRect(22, 4, 4, 6);
    ctx.beginPath();
    ctx.arc(24, 4, 6, Math.PI, 0);
    ctx.fill();

    scene.textures.addCanvas('prop_console_sensor', c);
  }

  private static generateBallastConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Ballast purge manifold
    ctx.fillStyle = '#1a2738';
    ctx.fillRect(4, 8, 40, 36);

    // Water level sight tube
    ctx.fillStyle = '#00263a';
    ctx.fillRect(8, 12, 6, 28);
    ctx.fillStyle = 'rgba(0, 200, 255, 0.65)';
    ctx.fillRect(8, 22, 6, 18);
    ctx.strokeStyle = '#00f3ff';
    ctx.strokeRect(8, 12, 6, 28);

    // 4 numbered purge lever switches
    for (let i = 0; i < 4; i++) {
      const lx = 20 + i * 6;
      ctx.fillStyle = '#111';
      ctx.fillRect(lx, 16, 3, 20);
      ctx.fillStyle = '#cca500';
      ctx.fillRect(lx - 1, 22 + (i % 2) * 6, 5, 4);
    }

    scene.textures.addCanvas('prop_console_ballast', c);
  }

  private static generateFiltrationConsole(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    // Turbine filtration intake
    ctx.fillStyle = '#182433';
    ctx.fillRect(4, 4, 40, 40);

    ctx.fillStyle = '#080e16';
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.fill();

    // Turbine blades
    ctx.strokeStyle = '#384d68';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(24, 24);
      ctx.lineTo(24 + Math.cos(angle) * 14, 24 + Math.sin(angle) * 14);
      ctx.stroke();
    }

    // Trapped benthic kelp debris
    ctx.fillStyle = '#008744';
    ctx.fillRect(16, 14, 5, 3);
    ctx.fillRect(26, 26, 6, 4);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(20, 28, 4, 3);

    scene.textures.addCanvas('prop_console_filtration', c);
  }

  private static generateServerRack(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 64);
    const ctx = c.getContext('2d')!;

    // Communications server blade cabinet
    ctx.fillStyle = '#151f2c';
    ctx.fillRect(4, 2, 40, 60);

    // Glass panel
    ctx.fillStyle = '#0a1017';
    ctx.fillRect(8, 6, 32, 52);

    // Server blades with blinking fiber LEDs
    for (let y = 10; y < 54; y += 8) {
      ctx.fillStyle = '#1c2838';
      ctx.fillRect(10, y, 28, 6);

      // Status LEDs
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(12, y + 2, 2, 2);
      ctx.fillStyle = '#00e676';
      ctx.fillRect(16, y + 2, 2, 2);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(20, y + 2, 2, 2);
    }

    scene.textures.addCanvas('prop_server_rack', c);
  }

  private static generateVentGrate(scene: Phaser.Scene): void {
    const c = this.createCanvas(36, 36);
    const ctx = c.getContext('2d')!;

    // Disruptor vent floor grate
    ctx.fillStyle = '#1b2533';
    ctx.fillRect(0, 0, 36, 36);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 35, 35);

    ctx.fillStyle = '#060a10';
    ctx.fillRect(4, 4, 28, 28);

    // Horizontal slotted bars
    ctx.fillStyle = '#394d67';
    for (let y = 7; y < 32; y += 5) {
      ctx.fillRect(5, y, 26, 2);
    }

    // Discreet LED indicator
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(2, 2, 2, 2);

    scene.textures.addCanvas('prop_vent_grate', c);
  }

  private static generateAlgaeVat(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 64);
    const ctx = c.getContext('2d')!;

    // Hydroponics spirulina bioreactor column
    ctx.fillStyle = '#1a2636';
    ctx.fillRect(4, 2, 40, 8);
    ctx.fillRect(4, 54, 40, 8);

    // Glowing emerald algae solution
    const vatGrad = ctx.createLinearGradient(8, 10, 40, 10);
    vatGrad.addColorStop(0, 'rgba(0, 255, 150, 0.3)');
    vatGrad.addColorStop(0.3, 'rgba(0, 255, 180, 0.7)');
    vatGrad.addColorStop(0.7, 'rgba(0, 200, 120, 0.8)');
    vatGrad.addColorStop(1, 'rgba(0, 140, 70, 0.4)');
    ctx.fillStyle = vatGrad;
    ctx.fillRect(8, 10, 32, 44);

    // Spirulina algae coils
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

    // Spores / microbubbles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 20, 2, 2);
    ctx.fillRect(26, 38, 2, 2);
    ctx.fillRect(22, 46, 2, 2);

    scene.textures.addCanvas('prop_algae_vat', c);
  }

  private static generateMedBed(scene: Phaser.Scene): void {
    const c = this.createCanvas(56, 36);
    const ctx = c.getContext('2d')!;

    // Medical Bay diagnostic scanner pod
    ctx.fillStyle = '#1a2636';
    ctx.fillRect(2, 6, 52, 24);

    // Sterile white contour mattress
    ctx.fillStyle = '#e8f7fa';
    ctx.fillRect(6, 9, 44, 18);

    // Headrest
    ctx.fillStyle = '#bcebf3';
    ctx.fillRect(8, 11, 8, 14);

    // Holographic ECG screen
    ctx.fillStyle = '#071522';
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

    ctx.fillStyle = '#181f2a';
    ctx.fillRect(6, 16, 12, 6);

    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    ctx.arc(12, 12, 8, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffaa44';
    ctx.fillRect(10, 6, 4, 6);

    scene.textures.addCanvas('prop_siren_beacon', c);
  }

  // ----------------------------------------------------
  // Character Spritesheets (Sci-Fi Diver, Ghost, Dead Body)
  // ----------------------------------------------------

  private static generateDiverSpritesheet(scene: Phaser.Scene): void {
    const fw = 48;
    const fh = 48;
    const cols = 4;
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

    const texture = scene.textures.addCanvas('player_diver_sheet', c);
    if (texture) {
      let frameIndex = 0;
      for (let r = 0; r < rows; r++) {
        for (let f = 0; f < cols; f++) {
          texture.add(frameIndex, 0, f * fw, r * fh, fw, fh);
          frameIndex++;
        }
      }
    }
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

    // 1. Dual compact rebreather canisters on back
    if (dirRow !== 3) {
      ctx.fillStyle = '#6e8092';
      ctx.fillRect(cx - 8, cy - 13, 16, 15);
      // Dual brass pressure valves
      ctx.fillStyle = '#cca500';
      ctx.fillRect(cx - 6, cy - 16, 4, 3);
      ctx.fillRect(cx + 2, cy - 16, 4, 3);
    }

    // 2. Suit legs & weighted boots
    ctx.fillStyle = '#9cb0c4'; // Light base for Phaser color tinting
    ctx.fillRect(cx - 8, cy + 6, 6, 10 + legStride);
    ctx.fillRect(cx + 2, cy + 6, 6, 10 - legStride);

    // Magnetic heavy boots
    ctx.fillStyle = '#3a4a5a';
    ctx.fillRect(cx - 10, cy + 14 + legStride, 8, 4);
    ctx.fillRect(cx + 2, cy + 14 - legStride, 8, 4);

    // 3. Torso & chestplate
    ctx.fillStyle = '#c2d4e6';
    ctx.fillRect(cx - 9, cy - 8, 18, 15);

    // Side shading
    ctx.fillStyle = '#7a8e9f';
    ctx.fillRect(cx - 9, cy - 8, 2, 15);
    ctx.fillRect(cx + 7, cy - 8, 2, 15);

    // Oxygen status LED bar on chest
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(cx - 3, cy - 4, 6, 2);

    // Pressure belt with quick-release buckle
    ctx.fillStyle = '#1e2d3d';
    ctx.fillRect(cx - 9, cy + 3, 18, 3);
    ctx.fillStyle = '#cca500';
    ctx.fillRect(cx - 2, cy + 3, 4, 3);

    // 4. Arms & Gloves
    ctx.fillStyle = '#9cb0c4';
    if (dirRow === 0) { // Down
      ctx.fillRect(cx - 12, cy - 6 + walkOffset, 4, 11);
      ctx.fillRect(cx + 8, cy - 6 - walkOffset, 4, 11);
      ctx.fillStyle = '#334455';
      ctx.fillRect(cx - 12, cy + 4 + walkOffset, 4, 3);
      ctx.fillRect(cx + 8, cy + 4 - walkOffset, 4, 3);
    } else if (dirRow === 1) { // Left
      ctx.fillRect(cx - 7 + legStride, cy - 5, 5, 11);
      ctx.fillStyle = '#334455';
      ctx.fillRect(cx - 7 + legStride, cy + 5, 5, 3);
    } else if (dirRow === 2) { // Right
      ctx.fillRect(cx + 2 - legStride, cy - 5, 5, 11);
      ctx.fillStyle = '#334455';
      ctx.fillRect(cx + 2 - legStride, cy + 5, 5, 3);
    } else { // Up
      ctx.fillRect(cx - 12, cy - 6 - walkOffset, 4, 11);
      ctx.fillRect(cx + 8, cy - 6 + walkOffset, 4, 11);
      ctx.fillStyle = '#334455';
      ctx.fillRect(cx - 12, cy + 4 - walkOffset, 4, 3);
      ctx.fillRect(cx + 8, cy + 4 + walkOffset, 4, 3);
    }

    // 5. Brass Collar Ring
    ctx.fillStyle = '#cca500';
    ctx.fillRect(cx - 8, cy - 10, 16, 3);

    // 6. Spherical Pressure Helmet
    ctx.fillStyle = '#d0deea';
    ctx.beginPath();
    ctx.arc(cx, cy - 16, 9, 0, Math.PI * 2);
    ctx.fill();

    // 7. Visor with curved specular reflections
    if (dirRow === 0) {
      // Facing Down: large central glowing cyan visor
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 15, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Curved reflection
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 4, cy - 17, 3, 2);
    } else if (dirRow === 1) {
      // Facing Left
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy - 15, 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 6, cy - 17, 2, 2);
    } else if (dirRow === 2) {
      // Facing Right
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy - 15, 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 4, cy - 17, 2, 2);
    } else {
      // Facing Up: back of helmet & rebreather tubes
      ctx.fillStyle = '#7a8e9f';
      ctx.fillRect(cx - 5, cy - 18, 10, 5);
      ctx.strokeStyle = '#1e2d3d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 14);
      ctx.lineTo(cx - 8, cy - 8);
      ctx.stroke();
    }

    // If facing up, rebreather tanks drawn on top of back
    if (dirRow === 3) {
      ctx.fillStyle = '#6e8092';
      ctx.fillRect(cx - 8, cy - 7, 16, 13);
      ctx.fillStyle = '#cca500';
      ctx.fillRect(cx - 6, cy - 9, 3, 3);
      ctx.fillRect(cx + 3, cy - 9, 3, 3);
    }
  }

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

      // Ethereal glowing aura
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
      grad.addColorStop(0, 'rgba(0, 243, 255, 0.7)');
      grad.addColorStop(0.6, 'rgba(0, 180, 255, 0.35)');
      grad.addColorStop(1, 'rgba(0, 50, 120, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Ghost head & flowing vapor trail
      ctx.fillStyle = 'rgba(230, 250, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 2);
      ctx.lineTo(cx - 6 + (f % 2), cy + 16);
      ctx.lineTo(cx, cy + 12);
      ctx.lineTo(cx + 6 - (f % 2), cy + 16);
      ctx.lineTo(cx + 8, cy - 2);
      ctx.closePath();
      ctx.fill();

      // Spectral cyan eyes
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(cx - 4, cy - 8, 3, 3);
      ctx.fillRect(cx + 2, cy - 8, 3, 3);
    }

    const texture = scene.textures.addCanvas('player_ghost_sheet', c);
    if (texture) {
      for (let f = 0; f < cols; f++) {
        texture.add(f, 0, f * fw, 0, fw, fh);
      }
    }
  }

  private static generateDeadBody(scene: Phaser.Scene): void {
    const c = this.createCanvas(48, 48);
    const ctx = c.getContext('2d')!;

    const cx = 24;
    const cy = 24;

    // Fluid pool
    ctx.fillStyle = 'rgba(200, 20, 40, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Collapsed diving suit
    ctx.fillStyle = '#6b7c8d';
    ctx.fillRect(cx - 14, cy - 2, 20, 12);

    ctx.fillStyle = '#4f5e6d';
    ctx.fillRect(cx - 18, cy + 6, 12, 6);
    ctx.fillRect(cx - 10, cy + 9, 14, 5);

    // Severed hose
    ctx.strokeStyle = '#223344';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 1);
    ctx.quadraticCurveTo(cx + 10, cy - 8, cx + 16, cy - 4);
    ctx.stroke();

    // Slumped helmet & shattered visor
    ctx.fillStyle = '#8ca0b4';
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a1018';
    ctx.beginPath();
    ctx.arc(cx + 9, cy + 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ff3864';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy);
    ctx.lineTo(cx + 10, cy + 4);
    ctx.lineTo(cx + 12, cy + 1);
    ctx.stroke();

    // Blinking distress transponder
    ctx.fillStyle = '#cca500';
    ctx.fillRect(cx - 8, cy - 8, 3, 6);
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(cx - 6.5, cy - 9, 3, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('prop_dead_body', c);
  }

  private static generateCosmeticsSheet(scene: Phaser.Scene): void {
    const c = this.createCanvas(32 * 8, 32);
    const ctx = c.getContext('2d')!;

    // 0: standard_helm
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 12, 16, 8);

    // 1: deep_diver
    ctx.fillStyle = '#cca500';
    ctx.fillRect(32 + 6, 8, 20, 16);
    ctx.fillStyle = '#222';
    ctx.fillRect(32 + 10, 12, 12, 8);
    ctx.strokeStyle = '#cca500';
    ctx.strokeRect(32 + 10, 12, 12, 8);

    // 2: welding_mask
    ctx.fillStyle = '#333';
    ctx.fillRect(64 + 7, 8, 18, 18);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(64 + 10, 14, 12, 4);

    // 3: captain_cap
    ctx.fillStyle = '#002040';
    ctx.fillRect(96 + 6, 8, 20, 8);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(96 + 4, 14, 24, 3);
    ctx.fillRect(96 + 14, 9, 4, 4);

    // 4: biologist_goggles
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.arc(128 + 11, 14, 4, 0, Math.PI * 2);
    ctx.arc(128 + 21, 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // 5: hazard_rebreather
    ctx.fillStyle = '#e65100';
    ctx.fillRect(160 + 5, 14, 6, 10);
    ctx.fillRect(160 + 21, 14, 6, 10);
    ctx.fillStyle = '#222';
    ctx.fillRect(160 + 11, 15, 10, 8);

    // 6: aquanaut_beret
    ctx.fillStyle = '#0077be';
    ctx.beginPath();
    ctx.ellipse(192 + 16, 10, 12, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cca500';
    ctx.fillRect(192 + 10, 9, 3, 3);

    // 7: sonar_headset
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(224 + 5, 12, 4, 10);
    ctx.fillRect(224 + 23, 12, 4, 10);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(224 + 16, 14, 11, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(224 + 7, 20);
    ctx.lineTo(224 + 14, 23);
    ctx.stroke();

    const texture = scene.textures.addCanvas('cosmetics_sheet', c);
    if (texture) {
      for (let i = 0; i < 8; i++) {
        texture.add(i, 0, i * 32, 0, 32, 32);
      }
    }
  }

  private static generateInteractionPill(scene: Phaser.Scene): void {
    const c = this.createCanvas(160, 32);
    const ctx = c.getContext('2d')!;

    // Clean glassmorphic HUD pill
    ctx.fillStyle = 'rgba(10, 18, 28, 0.92)';
    ctx.beginPath();
    ctx.roundRect(2, 2, 156, 28, 6);
    ctx.fill();

    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(2, 2, 156, 28, 6);
    ctx.stroke();

    // [E] Keycap
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.roundRect(6, 6, 20, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#05111d';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', 16, 16);

    scene.textures.addCanvas('badge_interaction_pill', c);
  }
}
