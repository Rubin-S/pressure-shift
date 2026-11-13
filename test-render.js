const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log('Navigating to local dev or live site...');
  // Let's test against live or local
  await page.goto('https://pressure-shift.onrender.com');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/rubins/.gemini/antigravity/brain/a1504a86-f731-47ae-a9fb-501db52dd2ee/live_render_landing.png' });
  console.log('Landing page screenshot taken');
  await browser.close();
})();
