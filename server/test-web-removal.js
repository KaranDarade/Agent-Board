import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runTests() {
  console.log('🚀 Starting Web Removal & Desktop-Only Validation Suite...');

  if (!fs.existsSync(edgePath)) {
    throw new Error(`Edge executable not found at ${edgePath}`);
  }

  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // ==========================================
    // TEST 1: Standard Web Access (Landing Page)
    // ==========================================
    console.log('\n--- 1. Testing Standard Web Landing Page ---');
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    const heroTitle = await page.textContent('h1');
    assert(heroTitle.includes('AI Coding Agents'), 'Hero title displays AI Coding Agents');

    const downloadCta = await page.isVisible('text=Download Desktop App (.exe)');
    assert(downloadCta, 'Download Desktop App (.exe) CTA is visible on landing page');

    const interactiveDemoCta = await page.isVisible('text=Try Interactive Demo');
    assert(interactiveDemoCta, 'Try Interactive Demo CTA is visible on landing page');

    // ==========================================
    // TEST 2: Video Walkthrough Player
    // ==========================================
    console.log('\n--- 2. Testing Video Walkthrough Player ---');
    const videoElement = await page.$('video');
    assert(videoElement !== null, 'Walkthrough video element is present in DOM');

    const videoSrc = await videoElement.getAttribute('src');
    assert(videoSrc.includes('agent-board-walkthrough.webm'), `Video source is valid: ${videoSrc}`);

    const timelineSteps = await page.$$('button:has-text("s")');
    assert(timelineSteps.length >= 6, `Timeline scrubber steps rendered (${timelineSteps.length} steps)`);

    // ==========================================
    // TEST 3: Screenshot Gallery
    // ==========================================
    console.log('\n--- 3. Testing 7-Screenshot High-Res Gallery ---');
    await page.click('button:has-text("High-Res Desktop Screenshots")');
    await page.waitForTimeout(500);

    const screenshotThumbnails = await page.$$('img[src*="/screenshots/"]');
    assert(screenshotThumbnails.length >= 7, `All 7 desktop screenshot thumbnails rendered (${screenshotThumbnails.length} thumbnails)`);

    // Click first screenshot to test lightbox modal
    await screenshotThumbnails[0].click();
    await page.waitForTimeout(500);
    const modalContent = await page.textContent('body');
    assert(modalContent.includes('Native Desktop Workstation First-Run'), 'Screenshot lightbox modal opens with full high-res preview');
    
    // Close lightbox
    const closeButtons = await page.$$('button');
    for (const b of closeButtons) {
      const isX = await b.$('svg.lucide-x');
      if (isX) {
        await b.click();
        break;
      }
    }
    await page.waitForTimeout(400);

    // ==========================================
    // TEST 4: GitHub Repository Showcase Section
    // ==========================================
    console.log('\n--- 4. Testing GitHub Repository Showcase ---');
    const githubSection = await page.isVisible('#github-repo');
    assert(githubSection, 'GitHub repository showcase section #github-repo is present');

    const cloneCode = await page.textContent('code');
    assert(cloneCode.includes('git clone https://github.com/KaranDarade/Agent-Board.git'), 'Clone snippet is present and points to KaranDarade/Agent-Board');

    const githubStarLink = await page.isVisible('a[href="https://github.com/KaranDarade/Agent-Board"]');
    assert(githubStarLink, 'Link to GitHub repo is present');

    // ==========================================
    // TEST 5: Strict Web Operational Cockpit Removal & Desktop Modal
    // ==========================================
    console.log('\n--- 5. Testing Operational Cockpit Blocking on Web ---');
    // Attempting to visit ?mode=operational on web browser
    await page.goto('http://localhost:3001/?mode=operational', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Should NOT show the operational cockpit, should open DesktopRequiredModal on top of showcase
    const modalHeading = await page.isVisible('text=Desktop Application Required');
    assert(modalHeading, 'DesktopRequiredModal opened automatically when accessing mode=operational on web');

    const modalBodyText = await page.textContent('body');
    assert(modalBodyText.includes('local SQLite databases'), 'Modal explains local SQLite databases and zero cloud latency reason');

    const deepLinkButton = await page.isVisible('text=Open Desktop App');
    assert(deepLinkButton, 'Deep link button Open Desktop App is present in modal');

    // Close modal via Try Interactive Demo
    await page.click('.fixed.inset-0 button:has-text("Try Interactive Demo")');
    await page.waitForTimeout(600);
    const demoHeading = await page.isVisible('text=Interactive Demo Sandbox');
    assert(demoHeading, 'Try Interactive Demo navigates cleanly to sandbox');

    // ==========================================
    // TEST 6: Desktop App First-Run Auth Flow
    // ==========================================
    console.log('\n--- 6. Testing Desktop App First-Run Direct Auth ---');
    await page.goto('http://localhost:3001/?app=desktop', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const desktopAuthTitle = await page.isVisible('text=Sign In to Workstation');
    assert(desktopAuthTitle, 'Desktop mode opens DesktopAuthScreen on first run');

    const noWebDownload = await page.$('text=Download Desktop App');
    assert(noWebDownload === null, 'Desktop mode does NOT show download desktop app button');

    const noMarketingHero = await page.$('text=Mission Control for AI Coding Agents');
    assert(noMarketingHero === null, 'Desktop mode does NOT show marketing landing page hero');

    // ==========================================
    // TEST 7: Desktop Sign In / Sign Up Directly Unlocks Operational Cockpit
    // ==========================================
    console.log('\n--- 7. Testing Desktop Sign Up -> Direct Operational Cockpit ---');
    // Switch to Create Account tab
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(400);

    const testEmail = `commander_${Date.now()}@testfleet.dev`;
    await page.fill('input[placeholder="Agent Commander"]', 'Commander Test');
    await page.fill('input[type="email"]', testEmail);
    const passwordInputs = await page.$$('input[type="password"]');
    await passwordInputs[0].fill('SuperFleetPass123!');
    await passwordInputs[1].fill('SuperFleetPass123!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('button[title="Create a new agent session"]', { timeout: 10000 });
    const hasNewSession = await page.isVisible('button[title="Create a new agent session"]');
    assert(hasNewSession, 'Desktop sign-in navigates directly to operational cockpit with New Session action');

    const hasFleetSearch = await page.isVisible('input[placeholder*="Search"]');
    assert(hasFleetSearch, 'Operational cockpit search & fleet filter bar mounted');

    const noNavbarDownload = await page.$('text=Download Agent Board for Desktop');
    assert(noNavbarDownload === null, 'Operational navbar has no Download App button in desktop mode');

    console.log(`\n==========================================`);
    console.log(`Result: ${passed} Passed, ${failed} Failed`);
    console.log(`==========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
