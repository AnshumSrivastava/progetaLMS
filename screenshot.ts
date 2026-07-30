import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  // Wait a tiny bit for animations to settle
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: '/home/ducus/.gemini/antigravity-ide/brain/62cd194d-7008-44fa-8c97-2ad196434190/new_auth_ui.png' });
  await browser.close();
})();
