import { chromium } from 'playwright-core';

async function testShowcaseAndDemo() {
  console.log('Testing Showcase Landing & Interactive Demo Sandbox...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // 1. Test Showcase Landing
    console.log('1. Loading Showcase Landing (?mode=showcase)...');
    await page.goto('http://localhost:3001/?mode=showcase', { waitUntil: 'networkidle' });
    
    const heroTitle = await page.textContent('h1');
    console.log('   Hero Title:', heroTitle?.replace(/\s+/g, ' ').trim());
    if (!heroTitle.includes('AI Coding Agents')) throw new Error('Hero title missing expected text');
    console.log('   ✔ PASS: Showcase Hero Title verified');

    const downloadButtons = await page.$$('text=Download for Windows');
    console.log('   Download Buttons found:', downloadButtons.length);
    if (downloadButtons.length === 0) throw new Error('Download button missing');
    console.log('   ✔ PASS: Download CTAs verified');

    // 2. Click Interactive Demo button from Showcase
    console.log('2. Clicking "Interactive Demo" button...');
    const demoBtn = await page.waitForSelector('text=Interactive Demo');
    await demoBtn.click();
    await page.waitForTimeout(1000);

    const demoBanner = await page.textContent('text=INTERACTIVE DEMO SANDBOX');
    if (!demoBanner) throw new Error('Demo Sandbox banner missing');
    console.log('   ✔ PASS: Interactive Demo Sandbox loaded successfully');

    // 3. Test mode toggle inside demo
    console.log('3. Testing Mode toggle in demo sandbox...');
    const modeBadge = await page.waitForSelector('text=PLAN MODE');
    await modeBadge.click();
    await page.waitForTimeout(500);
    const toast = await page.textContent('text=Demo session switched to BUILD mode.');
    if (!toast) throw new Error('Mode switch toast missing in demo sandbox');
    console.log('   ✔ PASS: Mode switch in Demo Sandbox works smoothly');

    // 4. Test task toggle in demo
    console.log('4. Testing Task toggle in demo sandbox...');
    const taskCheckbox = await page.waitForSelector('input[type="checkbox"]');
    await taskCheckbox.click();
    console.log('   ✔ PASS: Task toggle interactive in Demo Sandbox');

    // 5. Test Inspect button in demo
    console.log('5. Testing Inspect button in demo sandbox...');
    const inspectBtn = await page.waitForSelector('button:has-text("Inspect")');
    await inspectBtn.click();
    await page.waitForTimeout(500);
    const executionHeader = await page.textContent('text=Execution & Thought History');
    if (!executionHeader) throw new Error('Inspector drawer failed to open in demo sandbox');
    console.log('   ✔ PASS: Inspector drawer opens and renders thought traces in Demo Sandbox');

    console.log('\n======================================================');
    console.log('   ALL SHOWCASE & DEMO VERIFICATION CHECKS PASSED!   ');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ Showcase/Demo test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testShowcaseAndDemo();
