import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Pressure Shift 2.0 - Current Stage Visual Capture', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  const artifactDir = '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee';

  test.afterEach(async () => {
    await context1?.close();
    await context2?.close();
  });

  test('captures all current in-game stage centerpieces, rooms, and minimap', async ({ browser }) => {
    context1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // 1. Host creates room
    await page1.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page1.locator('h1')).toHaveText(/PRESSURE SHIFT/i, { timeout: 15000 });
    const hostInput = page1.locator('input[placeholder*="callsign" i]');
    await hostInput.fill('Commander-Nadir');
    const createBtn = page1.locator('button:has-text("CREATE NEW ROOM")');
    await expect(createBtn).toBeEnabled({ timeout: 10000 });
    await createBtn.click();

    // Extract Room Code
    const roomCodeBtn = page1.locator('button:has-text("ROOM CODE:")');
    await expect(roomCodeBtn).toBeVisible({ timeout: 15000 });
    const roomCodeText = await roomCodeBtn.innerText();
    const match = roomCodeText.match(/([A-Z0-9]{6})/);
    expect(match).not.toBeNull();
    const roomCode = match![1];

    // 2. Client 2 Joins & Readies
    await page2.goto('/', { waitUntil: 'domcontentloaded' });
    await page2.locator('input[placeholder*="callsign" i]').fill('Diver-Beta');
    await page2.locator('input[placeholder*="ROOM CODE" i]').fill(roomCode);
    const joinBtn = page2.locator('button:has-text("JOIN")');
    await expect(joinBtn).toBeEnabled({ timeout: 10000 });
    await joinBtn.click();
    await expect(page2.locator('h1:has-text("HABITAT LOBBY")')).toBeVisible({ timeout: 15000 });

    const readyBtn2 = page2.locator('button:has-text("SET READY")');
    if (await readyBtn2.isVisible()) {
      await readyBtn2.click();
    }

    // 3. Host launches game
    const startBtn = page1.locator('button:has-text("START EXPEDITION")');
    await expect(startBtn).toBeEnabled({ timeout: 10000 });
    await startBtn.click();

    // Wait for in-game canvas & HUD
    await expect(page1.locator('canvas').first()).toBeAttached({ timeout: 25000 });
    await expect(page1.locator('text=/TOTAL FACILITY TASKS|ROLE:|STATION/i').first()).toBeVisible({ timeout: 25000 });
    await page1.waitForTimeout(2500);

    // SCREENSHOT 1: Moon Pool Wet Dock (SEC-01) with circular open ocean pool & gantry rails
    await page1.screenshot({ path: `${artifactDir}/current_stage_01_docking_moonpool.png` });
    console.log('[STAGE] Saved current_stage_01_docking_moonpool.png');

    // SCREENSHOT 2: Tactical Minimap [M]
    const mapBtn = page1.locator('button:has-text("MAP")').first();
    await mapBtn.click();
    await expect(page1.locator('text=/NADIR-7 FACILITY SCHEMATICS|BLUEPRINT/i').first()).toBeVisible({ timeout: 5000 });
    await page1.waitForTimeout(600);
    await page1.screenshot({ path: `${artifactDir}/current_stage_02_tactical_minimap.png` });
    console.log('[STAGE] Saved current_stage_02_tactical_minimap.png');
    const closeMapBtn = page1.locator('button:has-text("CLOSE")').first();
    await closeMapBtn.click();
    await page1.waitForTimeout(500);

    // Navigate to Pressure Lab (SEC-04) - walk South
    console.log('[STAGE] Walking to Pressure Lab (Anomaly Vault)...');
    await page1.keyboard.down('s');
    await page1.waitForTimeout(2600);
    await page1.keyboard.up('s');
    await page1.waitForTimeout(600);
    // SCREENSHOT 3: Pressure Lab with Anomaly Levitation Pedestal
    await page1.screenshot({ path: `${artifactDir}/current_stage_03_pressure_anomaly.png` });
    console.log('[STAGE] Saved current_stage_03_pressure_anomaly.png');

    // Navigate to Thermal Plant (SEC-05) - walk South further
    console.log('[STAGE] Walking to Thermal Plant (Magma Catwalk)...');
    await page1.keyboard.down('s');
    await page1.waitForTimeout(2600);
    await page1.keyboard.up('s');
    await page1.waitForTimeout(600);
    // SCREENSHOT 4: Thermal Plant with Magma Rift & Catwalk
    await page1.screenshot({ path: `${artifactDir}/current_stage_04_thermal_magma_catwalk.png` });
    console.log('[STAGE] Saved current_stage_04_thermal_magma_catwalk.png');

    // Walk North back to Pressure Lab, then East to Central Junction
    await page1.keyboard.down('w');
    await page1.waitForTimeout(2600);
    await page1.keyboard.up('w');
    await page1.keyboard.down('d');
    await page1.waitForTimeout(3500);
    await page1.keyboard.up('d');
    await page1.waitForTimeout(800);
    // SCREENSHOT 5: Central Dispatch (CMD-00) with Rotunda Command Dais & Holographic Projection
    await page1.screenshot({ path: `${artifactDir}/current_stage_05_central_rotunda_dais.png` });
    console.log('[STAGE] Saved current_stage_05_central_rotunda_dais.png');

    // Navigate North into Sonar Control (SEC-02)
    console.log('[STAGE] Walking to Sonar Control...');
    await page1.keyboard.down('w');
    await page1.waitForTimeout(2800);
    await page1.keyboard.up('w');
    await page1.waitForTimeout(600);
    // SCREENSHOT 6: Sonar Control
    await page1.screenshot({ path: `${artifactDir}/current_stage_06_sonar_control.png` });
    console.log('[STAGE] Saved current_stage_06_sonar_control.png');

    // Navigate East into Hydroponics (SEC-03)
    console.log('[STAGE] Walking to Hydroponics Bio-Dome...');
    await page1.keyboard.down('d');
    await page1.waitForTimeout(3400);
    await page1.keyboard.up('d');
    await page1.waitForTimeout(600);
    // SCREENSHOT 7: Hydroponics with Spirulina Columns
    await page1.screenshot({ path: `${artifactDir}/current_stage_07_hydroponics_spirulina.png` });
    console.log('[STAGE] Saved current_stage_07_hydroponics_spirulina.png');

    // Navigate South into Observation Gallery (SEC-06)
    console.log('[STAGE] Walking to Observation Gallery...');
    await page1.keyboard.down('s');
    await page1.waitForTimeout(2800);
    await page1.keyboard.up('s');
    await page1.waitForTimeout(600);
    // SCREENSHOT 8: Observation Gallery with Panoramic Trench Viewport
    await page1.screenshot({ path: `${artifactDir}/current_stage_08_observation_panorama.png` });
    console.log('[STAGE] Saved current_stage_08_observation_panorama.png');

    console.log('[STAGE] ALL CURRENT STAGE VISUALS CAPTURED!');
  });
});
