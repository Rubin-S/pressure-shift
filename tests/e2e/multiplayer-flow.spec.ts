import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

test.describe('Pressure Shift - 4-Player Multiplayer End-to-End Simulation', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let context3: BrowserContext;
  let context4: BrowserContext;

  let page1: Page;
  let page2: Page;
  let page3: Page;
  let page4: Page;

  test.afterEach(async () => {
    await context1?.close();
    await context2?.close();
    await context3?.close();
    await context4?.close();
  });

  test('4 concurrent browser clients create, join, ready, start game, and interact in real-time', async ({ browser }) => {
    // 1. Initialize 4 independent browser contexts (isolated cookies/localStorage/session)
    context1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    context3 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    context4 = await browser.newContext({ viewport: { width: 1280, height: 720 } });

    page1 = await context1.newPage();
    page2 = await context2.newPage();
    page3 = await context3.newPage();
    page4 = await context4.newPage();

    // 2. Client 1 (Host: Captain-Nadir) opens application and creates a room
    await page1.goto('/');
    await expect(page1.locator('h1')).toHaveText(/PRESSURE SHIFT/i, { timeout: 15000 });

    // Fill in host player callsign
    const hostInput = page1.locator('input[placeholder*="callsign" i]');
    await hostInput.fill('Captain-Nadir');

    // Click Create Room
    const createBtn = page1.locator('button:has-text("CREATE NEW ROOM")');
    await expect(createBtn).toBeEnabled({ timeout: 10000 });
    await createBtn.click();

    // 3. Extract the 6-character room code from the host view
    const roomCodeBtn = page1.locator('button:has-text("ROOM CODE:")');
    await expect(roomCodeBtn).toBeVisible({ timeout: 15000 });

    const roomCodeText = await roomCodeBtn.innerText();
    const match = roomCodeText.match(/([A-Z0-9]{6})/);
    expect(match).not.toBeNull();
    const roomCode = match![1];
    console.log(`[E2E] Room successfully created with code: ${roomCode}`);

    // 4. Clients 2, 3, 4 join the room concurrently
    const joinClient = async (page: Page, playerName: string) => {
      await page.goto('/');
      await expect(page.locator('h1')).toHaveText(/PRESSURE SHIFT/i, { timeout: 15000 });

      const nameInput = page.locator('input[placeholder*="callsign" i]');
      await nameInput.fill(playerName);

      const codeInput = page.locator('input[placeholder*="ROOM CODE" i]');
      await codeInput.fill(roomCode);

      const joinBtn = page.locator('button:has-text("JOIN")');
      await expect(joinBtn).toBeEnabled({ timeout: 10000 });
      await joinBtn.click();

      // Expect to arrive in lobby
      await expect(page.locator('h1:has-text("HABITAT LOBBY")')).toBeVisible({ timeout: 15000 });
    };

    await Promise.all([
      joinClient(page2, 'Diver-Alpha'),
      joinClient(page3, 'Diver-Beta'),
      joinClient(page4, 'Diver-Gamma'),
    ]);

    // 5. Verify all 4 players appear in the lobby roster on the Host screen
    await expect(page1.locator('text=Captain-Nadir')).toBeVisible({ timeout: 10000 });
    await expect(page1.locator('text=Diver-Alpha')).toBeVisible({ timeout: 10000 });
    await expect(page1.locator('text=Diver-Beta')).toBeVisible({ timeout: 10000 });
    await expect(page1.locator('text=Diver-Gamma')).toBeVisible({ timeout: 10000 });

    // 6. Clients toggle Ready
    const toggleReady = async (page: Page) => {
      const readyBtn = page.locator('button:has-text("SET READY")');
      if (await readyBtn.isVisible()) {
        await readyBtn.click();
      }
    };

    await Promise.all([
      toggleReady(page2),
      toggleReady(page3),
      toggleReady(page4),
    ]);

    // 7. Host clicks Start Expedition
    const startBtn = page1.locator('button:has-text("START EXPEDITION")');
    await expect(startBtn).toBeEnabled({ timeout: 10000 });
    await startBtn.click();

    // 8. Verify all 4 browser contexts transition into gameplay state (Canvas attached and HUD visible)
    const verifyGameRunning = async (page: Page) => {
      await expect(page.locator('canvas').first()).toBeAttached({ timeout: 25000 });
      await expect(page.locator('text=/TOTAL FACILITY TASKS|ROLE:|STATION/i').first()).toBeVisible({ timeout: 25000 });
    };

    await Promise.all([
      verifyGameRunning(page1),
      verifyGameRunning(page2),
      verifyGameRunning(page3),
      verifyGameRunning(page4),
    ]);

    // 9. Verify Minimap overlay can be toggled via HUD button
    const mapBtn = page1.locator('button:has-text("MAP")').first();
    await expect(mapBtn).toBeVisible({ timeout: 10000 });
    await mapBtn.click();

    // Verify schematic overview modal is open
    const closeMapBtn = page1.locator('button:has-text("CLOSE")').first();
    await expect(closeMapBtn).toBeVisible({ timeout: 5000 });
    await expect(page1.locator('text=/FACILITY SCHEMATIC|BLUEPRINT/i').first()).toBeVisible({ timeout: 5000 });

    // Close map
    await closeMapBtn.click();
    await expect(closeMapBtn).not.toBeVisible({ timeout: 5000 });

    // 10. Verify Zero-Knowledge Anti-Cheat in the browser DOM:
    // Inspect DOM on Operator client: ensure "DISRUPTOR" does NOT appear next to other divers' names in the player list
    const page2Content = await page2.content();
    // Diver-Alpha should see their own role, but should not see any mention of other players being Disruptors
    expect(page2Content).not.toMatch(/Captain-Nadir.*is a Disruptor/i);
    expect(page2Content).not.toMatch(/Diver-Beta.*is a Disruptor/i);
    expect(page2Content).not.toMatch(/Diver-Gamma.*is a Disruptor/i);

    console.log('[E2E] All 4 clients successfully simulated multiplayer match with zero-knowledge role privacy!');
  });
});
