const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function run() {
  console.log('Starting local server on port 3010...');
  const serverProcess = spawn('node', ['apps/server/dist/index.js'], {
    cwd: '/home/rubins/.gemini/antigravity/scratch/pressure-shift',
    env: { ...process.env, PORT: '3010' },
    stdio: 'inherit'
  });

  await new Promise(r => setTimeout(r, 2500));

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  
  // Host
  const c1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p1 = await c1.newPage();
  p1.on('console', m => console.log('[HOST]', m.text()));

  // Client 2
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p2 = await c2.newPage();
  p2.on('console', m => console.log('[CLIENT 2]', m.text()));

  await p1.goto('http://localhost:3010');
  await p1.waitForTimeout(1000);

  // 1. Main Menu
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_01_main_menu.png' });
  console.log('Saved v2_01_main_menu.png');

  // Host creates room
  await p1.locator('input[placeholder*="callsign" i]').fill('Captain-Nadir');
  await p1.locator('button:has-text("CREATE NEW ROOM")').click();
  const roomCodeBtn = p1.locator('button:has-text("ROOM CODE:")');
  await roomCodeBtn.waitFor({ state: 'visible', timeout: 15000 });
  const roomCode = (await roomCodeBtn.innerText()).match(/([A-Z0-9]{6})/)[1];
  console.log('Room Code:', roomCode);

  // 2. Customization Gear
  const customTab = p1.locator('button:has-text("DIVING SUIT & GEAR")');
  await customTab.click();
  await p1.waitForTimeout(600);
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_02_customization_gear.png' });
  console.log('Saved v2_02_customization_gear.png');
  await p1.locator('button:has-text("CREW ROSTER")').click();

  // Client 2 Joins
  await p2.goto('http://localhost:3010');
  await p2.locator('input[placeholder*="callsign" i]').fill('Dr. Thorne');
  await p2.locator('input[placeholder*="ROOM CODE" i]').fill(roomCode);
  await p2.locator('button:has-text("JOIN")').click();
  await p2.locator('h1:has-text("HABITAT LOBBY")').waitFor({ state: 'visible', timeout: 15000 });

  // Client 2 selects Coral Red suit and clicks SET READY
  const customTab2 = p2.locator('button:has-text("DIVING SUIT & GEAR")');
  await customTab2.click();
  await p2.waitForTimeout(300);
  const coralBtn = p2.locator('button:has-text("Coral Red")');
  if (await coralBtn.isVisible()) await coralBtn.click();
  await p2.locator('button:has-text("CREW ROSTER")').click();
  await p2.locator('button:has-text("SET READY")').click();
  await p1.waitForTimeout(600);

  // 3. Lobby Roster with both divers
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_02b_lobby_roster.png' });
  console.log('Saved v2_02b_lobby_roster.png');

  // Start Expedition!
  await p1.locator('button:has-text("START EXPEDITION")').click();
  console.log('Match started! Waiting for countdown and gameplay scene...');
  await p1.waitForTimeout(4500);

  // 4. In-Game Docking Cradle
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_03_docking_cradle.png' });
  console.log('Saved v2_03_docking_cradle.png');

  // 5. Tactical Minimap
  await p1.keyboard.press('m');
  await p1.waitForTimeout(800);
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_04_tactical_minimap.png' });
  console.log('Saved v2_04_tactical_minimap.png');
  await p1.keyboard.press('m');
  await p1.waitForTimeout(500);

  // Move South into Pressure Lab (hold S)
  console.log('Walking to Pressure Lab...');
  await p1.keyboard.down('s');
  await p1.waitForTimeout(2500);
  await p1.keyboard.up('s');
  await p1.waitForTimeout(600);
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_05_pressure_lab.png' });
  console.log('Saved v2_05_pressure_lab.png');

  // Move East into Central Junction (hold D)
  console.log('Walking to Central Junction...');
  await p1.keyboard.down('d');
  await p1.waitForTimeout(3200);
  await p1.keyboard.up('d');
  await p1.waitForTimeout(600);
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_06_central_junction.png' });
  console.log('Saved v2_06_central_junction.png');

  // Move North into Sonar Control (hold W)
  console.log('Walking to Sonar Control...');
  await p1.keyboard.down('w');
  await p1.waitForTimeout(2800);
  await p1.keyboard.up('w');
  await p1.waitForTimeout(600);
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_07_sonar_control.png' });
  console.log('Saved v2_07_sonar_control.png');

  // Move East into Hydroponics (hold D)
  console.log('Walking to Hydroponics Lab...');
  await p1.keyboard.down('d');
  await p1.waitForTimeout(3200);
  await p1.keyboard.up('d');
  await p1.waitForTimeout(600);
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_08_hydroponics.png' });
  console.log('Saved v2_08_hydroponics.png');

  // Move South into Observation Gallery (hold S)
  console.log('Walking to Observation Gallery...');
  await p1.keyboard.down('s');
  await p1.waitForTimeout(2800);
  await p1.keyboard.up('s');
  await p1.waitForTimeout(600);
  await p1.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/v2_09_observation_gallery.png' });
  console.log('Saved v2_09_observation_gallery.png');

  await browser.close();
  serverProcess.kill('SIGINT');
  console.log('DONE! ALL 9 SCREENSHOTS CAPTURED AND SAVED!');
}

run().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
