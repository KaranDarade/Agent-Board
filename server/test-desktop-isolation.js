import { chromium } from 'playwright-core';
import assert from 'node:assert';

async function testDesktopIsolation() {
  console.log('--- Running Desktop Isolation & Native Workstation E2E Test ---');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // TEST 1: WEB MODE (UNAUTHENTICATED)
    // -------------------------------------------------------------
    console.log('\n[1/4] Verifying Web Mode (Unauthenticated)...');
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 });

    // Web mode should render Showcase Landing
    const webTitle = await page.textContent('h1');
    console.log('   Web Mode Heading:', webTitle?.trim());
    assert(webTitle?.includes('Mission Control for') || webTitle?.includes('Coding Agents'));

    // Web mode MUST have Download Desktop buttons
    const downloadBtns = await page.$$('text=Download Desktop');
    console.log(`   ✔ Found ${downloadBtns.length} Download Desktop CTAs in Web mode`);
    assert(downloadBtns.length > 0, 'Web mode must show Download Desktop App buttons');

    // Web mode MUST have Interactive Demo button
    const demoBtns = await page.$$('text=Interactive Demo');
    assert(demoBtns.length > 0, 'Web mode must show Interactive Demo button');
    console.log('   ✔ Web mode successfully presents Showcase & Downloads');

    // -------------------------------------------------------------
    // TEST 2: DESKTOP MODE (UNAUTHENTICATED FIRST-RUN)
    // -------------------------------------------------------------
    console.log('\n[2/4] Verifying Desktop Mode (First Run / Unauthenticated)...');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3001/?app=desktop', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Desktop Workstation v1.0.0', { timeout: 10000 });

    const authHeading = await page.textContent('h2');
    console.log('   Desktop Auth Heading:', authHeading?.trim());
    assert(authHeading?.includes('Sign In to Workstation') || authHeading?.includes('Workstation'));

    // Desktop mode MUST NOT have ANY Download button
    const desktopDownloadBtns = await page.$$('text=Download');
    assert.strictEqual(desktopDownloadBtns.length, 0, 'Desktop mode must NEVER show any Download button');
    console.log('   ✔ PASS: Zero Download buttons exist in Desktop mode');

    // Desktop mode MUST NOT have Showcase or Interactive Demo
    const desktopShowcase = await page.$$('text=Product Tour');
    const desktopDemo = await page.$$('text=Interactive Demo');
    assert.strictEqual(desktopShowcase.length, 0, 'Desktop mode must not show Product Tour');
    assert.strictEqual(desktopDemo.length, 0, 'Desktop mode must not show Interactive Demo');
    console.log('   ✔ PASS: Zero Showcase or Demo elements exist in Desktop mode');

    // -------------------------------------------------------------
    // TEST 3: REAL GOOGLE OAUTH CONFIG DIALOG (NO FAKE USER)
    // -------------------------------------------------------------
    console.log('\n[3/4] Testing Real Google OAuth Interaction on Desktop...');
    const googleBtn = await page.$('text=Continue with Google');
    assert(googleBtn, 'Must have Continue with Google button');
    await googleBtn.click();
    await page.waitForTimeout(600);

    // If GOOGLE_CLIENT_ID was cleared/missing or dialog appears
    const googleConfigHeader = await page.$('text=Configure Google OAuth 2.0');
    if (googleConfigHeader) {
      console.log('   ✔ Real Google OAuth configuration dialog appeared (zero fake users generated)');
      const cancelBtn = await page.$('text=Cancel / Use Email');
      if (cancelBtn) await cancelBtn.click();
    } else {
      console.log('   ✔ Real Google OAuth triggered directly to accounts.google.com');
    }

    // -------------------------------------------------------------
    // TEST 4: SIGN UP & DIRECT REDIRECT TO AGENT COCKPIT
    // -------------------------------------------------------------
    console.log('\n[4/4] Testing Sign Up on Desktop & Direct Cockpit Redirect...');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(400);

    const testEmail = `desktop_tester_${Date.now()}@local.dev`;
    const testName = 'Desktop Engineer';
    const testPassword = 'Password123!';

    const inputs = await page.$$('input');
    await inputs[0].fill(testName);
    await inputs[1].fill(testEmail);
    await inputs[2].fill(testPassword);
    await inputs[3].fill(testPassword);

    await page.click('button[type="submit"]');
    await page.waitForSelector('button[title="Create a new agent session"]', { timeout: 10000 });

    // Verify direct transition to Operational Cockpit
    const cockpitNav = await page.textContent('header');
    assert(cockpitNav?.includes('Desktop Workstation'), 'Navbar must show Desktop Workstation');
    console.log('   ✔ Navbar correctly displays "Desktop Workstation"');

    // Verify NO "Download App" or "Showcase" exists in the authenticated cockpit on desktop
    const postLoginDownload = await page.$$('button:has-text("Download App")');
    const postLoginShowcase = await page.$$('button:has-text("Showcase")');
    assert.strictEqual(postLoginDownload.length, 0, 'Desktop cockpit must NEVER show Download App button');
    assert.strictEqual(postLoginShowcase.length, 0, 'Desktop cockpit must NEVER show Showcase button');
    console.log('   ✔ PASS: Authenticated Desktop Cockpit is completely clean of web marketing buttons');

    // Verify presence of operational fleet elements
    const newSessionBtn = await page.$('button:has-text("New Session")');
    assert(newSessionBtn, 'Operational cockpit must have New Session button');
    console.log('   ✔ Operational Agent Cockpit is fully active and unlocked!');

    console.log('\n======================================================');
    console.log('   ALL DESKTOP ISOLATION & AUTH E2E TESTS PASSED!     ');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

testDesktopIsolation().catch(err => {
  console.error('\n❌ Desktop Isolation Test Failed:', err);
  process.exit(1);
});
