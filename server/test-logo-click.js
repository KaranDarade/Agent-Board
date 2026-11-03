import { chromium } from 'playwright-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testLogoClicks() {
  console.log('🚀 Testing Agent Board logo click navigation & refresh...');
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  try {
    // 1. From Demo Sandbox to Homepage
    console.log('\n--- 1. Testing Demo Sandbox Logo Click ---');
    await page.goto('http://localhost:3001/?mode=demo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=LIVE DEMO FLEET');
    
    // Click Agent Board brand logo
    const demoLogo = await page.$('[title*="return to homepage"]');
    if (!demoLogo) throw new Error('Logo in Demo Sandbox not found');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      demoLogo.click()
    ]);
    
    const url1 = page.url();
    console.log('  Navigated to:', url1);
    if (!url1.includes('mode=demo') && (url1.endsWith(':3001/') || url1.endsWith(':3001'))) {
      console.log('  ✅ PASS: Demo Sandbox logo took user directly to homepage!');
    } else {
      throw new Error(`Expected homepage but got ${url1}`);
    }

    // 2. From Landing Page (click logo refreshes homepage)
    console.log('\n--- 2. Testing Landing Page Logo Click ---');
    const landingLogo = await page.$('[title*="go to homepage"]');
    if (!landingLogo) throw new Error('Logo on Landing Page not found');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      landingLogo.click()
    ]);
    console.log('  ✅ PASS: Landing page logo is clickable and refreshes!');

    // 3. From Desktop Auth
    console.log('\n--- 3. Testing Desktop Auth Logo Click ---');
    await page.goto('http://localhost:3001/?app=desktop', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Sign In to Workstation');
    
    const desktopLogo = await page.$('[title*="return to homepage"]');
    if (!desktopLogo) throw new Error('Logo on Desktop Auth not found');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      desktopLogo.click()
    ]);

    const url3 = page.url();
    console.log('  Navigated to:', url3);
    if (!url3.includes('app=desktop') && (url3.endsWith(':3001/') || url3.endsWith(':3001'))) {
      console.log('  ✅ PASS: Desktop Auth logo took user directly to homepage!');
    } else {
      throw new Error(`Expected homepage but got ${url3}`);
    }

    console.log('\n==========================================');
    console.log('✅ ALL LOGO CLICK TESTS PASSED PERFECTLY!');
    console.log('==========================================\n');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testLogoClicks();
