const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function run() {
  const serverProcess = spawn('node', ['apps/server/dist/index.js'], {
    cwd: '/home/rubins/.gemini/antigravity/scratch/pressure-shift',
    env: { ...process.env, PORT: '3009' },
    stdio: 'inherit'
  });
  await new Promise(r => setTimeout(r, 2000));

  const browser = await chromium.launch({ headless: true });
  const c1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p1 = await c1.newPage();
  p1.on('console', m => console.log('[P1]', m.text()));
  
  await p1.goto('http://localhost:3009');
  await p1.locator('input[placeholder*="callsign" i]').fill('Host');
  await p1.locator('button:has-text("CREATE NEW ROOM")').click();
  const roomCodeBtn = p1.locator('button:has-text("ROOM CODE:")');
  await roomCodeBtn.waitFor({ state: 'visible', timeout: 5000 });
  const roomCode = (await roomCodeBtn.innerText()).match(/([A-Z0-9]{6})/)[1];
  console.log('Got room code:', roomCode);

  const c2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p2 = await c2.newPage();
  p2.on('console', m => console.log('[P2]', m.text()));
  p2.on('pageerror', m => console.log('[P2 ERR]', m.message));

  await p2.goto('http://localhost:3009');
  await p2.locator('input[placeholder*="callsign" i]').fill('Guest');
  await p2.locator('input[placeholder*="ROOM CODE" i]').fill(roomCode);
  await p2.locator('button:has-text("JOIN")').click();

  await p2.waitForTimeout(3000);
  console.log('P2 URL / title:', await p2.title());
  console.log('P2 has lobby header:', await p2.locator('h1:has-text("HABITAT LOBBY")').count());

  await browser.close();
  serverProcess.kill('SIGINT');
}
run();
