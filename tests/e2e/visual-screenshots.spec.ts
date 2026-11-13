import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Pressure Shift 2.0 - Visual Showcase Screenshot Capture', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  const artifactDir = '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee';

  test.afterEach(async () => {
    await context1?.close();
    await context2?.close();
  });

  test('captures studio-grade visual screenshots across rooms, characters, minimap, and lobby', async ({ browser }) => {
    context1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // 1. Main Menu
    await page1.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page1.locator('h1')).toHaveText(/PRESSURE SHIFT/i, { timeout: 15000 });
    await page1.screenshot({ path: `${artifactDir}/v2_01_main_menu.png` });
    console.log('[VISUAL] Saved v2_01_main_menu.png');

    // Create Room as Host
    const hostInput = page1.locator('input[placeholder*="callsign" i]');
    await hostInput.fill('Captain-Nadir');
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
    console.log(`[VISUAL] Room Code: ${roomCode}`);

    // 2. Customization Tab (Suit Colors & Helmets)
    const customTab = page1.locator('button:has-text("DIVING SUIT & GEAR")');
    if (await customTab.isVisible()) {
      await customTab.click();
      await page1.waitForTimeout(600);
      await page1.screenshot({ path: `${artifactDir}/v2_02_customization_gear.png` });
      console.log('[VISUAL] Saved v2_02_customization_gear.png');
      await page1.locator('button:has-text("CREW ROSTER")').click();
    }

    // Client 2 Joins
    await page2.goto('/', { waitUntil: 'domcontentloaded' });
    await page2.locator('input[placeholder*="callsign" i]').fill('Diver-Alpha');
    await page2.locator('input[placeholder*="ROOM CODE" i]').fill(roomCode);
    const joinBtn = page2.locator('button:has-text("JOIN")');
    await expect(joinBtn).toBeEnabled({ timeout: 10000 });
    await joinBtn.click();
    await expect(page2.locator('h1:has-text("HABITAT LOBBY")')).toBeVisible({ timeout: 15000 });

    // Client 2 Customizes suit to Coral Red and Readies up
    const customTab2 = page2.locator('button:has-text("DIVING SUIT & GEAR")');
    if (await customTab2.isVisible()) {
      await customTab2.click();
      await page2.waitForTimeout(300);
      const coralBtn = page2.locator('button:has-text("Coral Red")');
      if (await coralBtn.isVisible()) await coralBtn.click();
      await page2.locator('button:has-text("CREW ROSTER")').click();
    }

    const readyBtn2 = page2.locator('button:has-text("SET READY")');
    if (await readyBtn2.isVisible()) {
      await readyBtn2.click();
    }

    // 3. Lobby with multiple divers
    await page1.waitForTimeout(600);
    await page1.screenshot({ path: `${artifactDir}/v2_02b_lobby_roster.png` });
    console.log('[VISUAL] Saved v2_02b_lobby_roster.png');

    // Host launches match
    const startBtn = page1.locator('button:has-text("START EXPEDITION")');
    await expect(startBtn).toBeEnabled({ timeout: 10000 });
    await startBtn.click();

    // Wait for in-game canvas & HUD
    await expect(page1.locator('canvas').first()).toBeAttached({ timeout: 25000 });
    await expect(page1.locator('text=/TOTAL FACILITY TASKS|ROLE:|STATION/i').first()).toBeVisible({ timeout: 25000 });
    await page1.waitForTimeout(2000);

    // 4. In-Game Docking Cradle (Airlock & Gantry Rails)
    await page1.screenshot({ path: `${artifactDir}/v2_03_docking_cradle.png` });
    console.log('[VISUAL] Saved v2_03_docking_cradle.png');

    // 5. Tactical Minimap [M]
    const mapBtn = page1.locator('button:has-text("MAP")').first();
    await mapBtn.click();
    await expect(page1.locator('text=/NADIR-7 FACILITY SCHEMATICS|BLUEPRINT/i').first()).toBeVisible({ timeout: 5000 });
    await page1.waitForTimeout(600);
    await page1.screenshot({ path: `${artifactDir}/v2_04_tactical_minimap.png` });
    console.log('[VISUAL] Saved v2_04_tactical_minimap.png');
    const closeMapBtn = page1.locator('button:has-text("CLOSE")').first();
    await closeMapBtn.click();
    await page1.waitForTimeout(500);

    // 6. Navigate to Pressure Lab (hold S)
    console.log('[VISUAL] Walking to Pressure Lab...');
    await page1.keyboard.down('s');
    await page1.waitForTimeout(2600);
    await page1.keyboard.up('s');
    await page1.waitForTimeout(600);
    await page1.screenshot({ path: `${artifactDir}/v2_05_pressure_lab.png` });
    console.log('[VISUAL] Saved v2_05_pressure_lab.png');

    // 7. Navigate to Central Junction (hold D)
    console.log('[VISUAL] Walking to Central Junction...');
    await page1.keyboard.down('d');
    await page1.waitForTimeout(3400);
    await page1.keyboard.up('d');
    await page1.waitForTimeout(600);
    await page1.screenshot({ path: `${artifactDir}/v2_06_central_junction.png` });
    console.log('[VISUAL] Saved v2_06_central_junction.png');

    // 8. Navigate to Sonar Control (hold W)
    console.log('[VISUAL] Walking to Sonar Control...');
    await page1.keyboard.down('w');
    await page1.waitForTimeout(2800);
    await page1.keyboard.up('w');
    await page1.waitForTimeout(600);
    await page1.screenshot({ path: `${artifactDir}/v2_07_sonar_control.png` });
    console.log('[VISUAL] Saved v2_07_sonar_control.png');

    // 9. Navigate to Hydroponics Lab (hold D)
    console.log('[VISUAL] Walking to Hydroponics Lab...');
    await page1.keyboard.down('d');
    await page1.waitForTimeout(3400);
    await page1.keyboard.up('d');
    await page1.waitForTimeout(600);
    await page1.screenshot({ path: `${artifactDir}/v2_08_hydroponics.png` });
    console.log('[VISUAL] Saved v2_08_hydroponics.png');

    // 10. Navigate to Observation Gallery (hold S)
    console.log('[VISUAL] Walking to Observation Gallery...');
    await page1.keyboard.down('s');
    await page1.waitForTimeout(2800);
    await page1.keyboard.up('s');
    await page1.waitForTimeout(600);
    await page1.screenshot({ path: `${artifactDir}/v2_09_observation_gallery.png` });
    console.log('[VISUAL] Saved v2_09_observation_gallery.png');

    console.log('[VISUAL] ALL 10 SCREENSHOTS CAPTURED SUCCESSFULLY!');
  });
});
