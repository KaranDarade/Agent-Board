import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOTS_DIR = path.resolve('client/public/screenshots');
const VIDEO_DIR = path.resolve('client/public/video');
const ARTIFACTS_DIR = 'C:\\Users\\KARAN\\.gemini\\antigravity\\brain\\816b2dfd-67c3-4dba-9370-65285ed45c34';

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function recordWalkthrough() {
  console.log('--- Starting Autonomous Desktop Tool Screencast & Screenshot Recorder ---');

  // Clean up any stale temp video files
  for (const f of fs.readdirSync(VIDEO_DIR)) {
    if (f.startsWith('page@') && f.endsWith('.webm')) {
      try { fs.unlinkSync(path.join(VIDEO_DIR, f)); } catch(e){}
    }
  }

  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('  [Browser]', msg.text()));
  page.on('pageerror', err => console.log('  [Browser Error]', err.message));
  page.on('requestfailed', req => console.log('  [Req Failed]', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.url().includes('/api/')) console.log('  [API Res]', res.status(), res.url());
  });

  try {
    // -------------------------------------------------------------
    // SCENE 1: Web Landing Page -> Downloading Desktop Tool
    // -------------------------------------------------------------
    console.log('[1/8] Scene 1: Web Landing Page & Windows .exe Download Flow...');
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button:has-text("Download Desktop App (.exe)"), button:has-text("Download Workstation")', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click download button to open setup modal
    const dlBtn = await page.$('button:has-text("Download Desktop App (.exe)"), button:has-text("Download Workstation")');
    if (dlBtn) {
      await dlBtn.hover();
      await page.waitForTimeout(500);
      await dlBtn.click();
      await page.waitForTimeout(1800); // Showcase installer instructions
    }

    // Close download modal
    const closeDl = await page.$('button:has(svg.lucide-x)');
    if (closeDl) {
      await closeDl.click();
      await page.waitForTimeout(600);
    }

    // -------------------------------------------------------------
    // SCENE 2: Desktop Workstation Launch & Authentication
    // -------------------------------------------------------------
    console.log('[2/8] Scene 2: Desktop Workstation First-Run Auth Screen...');
    await page.goto('http://localhost:3001/?app=desktop', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Sign In to Workstation', { timeout: 10000 });
    await page.waitForTimeout(800);

    // Save Screenshot 1: Desktop Auth Screen
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '1-desktop-auth.png'), fullPage: false });
    console.log('  ✔ Saved: 1-desktop-auth.png');

    // Switch to Create Account tab
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(400);

    // Fill registration credentials
    await page.fill('input[placeholder="Agent Commander"]', 'Commander Alpha');
    await page.waitForTimeout(150);
    const uniqueEmail = `commander_${Date.now()}@fleet.dev`;
    await page.fill('input[type="email"]', uniqueEmail);
    await page.waitForTimeout(150);
    const pwInputs = await page.$$('input[type="password"]');
    if (pwInputs.length >= 2) {
      await pwInputs[0].fill('FleetSecure2026!');
      await page.waitForTimeout(150);
      await pwInputs[1].fill('FleetSecure2026!');
      await page.waitForTimeout(200);
    }

    // Submit to unlock cockpit directly
    await page.click('button[type="submit"]');
    await page.waitForSelector('button[title="Create a new agent session"]', { timeout: 12000 });
    console.log('  ✔ Entered operational cockpit! Waiting for engine aggregation...');
    await page.waitForSelector('text=Scanning local engines', { state: 'detached', timeout: 35000 });
    await page.waitForSelector('h3', { timeout: 35000 });
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // SCENE 3: Operational Fleet Cockpit & Real-time Telemetry
    // -------------------------------------------------------------
    console.log('[3/8] Scene 3: Operational Fleet Cockpit & Telemetry...');
    await page.waitForTimeout(1000);

    // Save Screenshot 2: Fleet Overview
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '2-fleet-overview.png'), fullPage: false });
    console.log('  ✔ Saved: 2-fleet-overview.png');
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // SCENE 4: Instant Mode Switching (PLAN ⇄ BUILD)
    // -------------------------------------------------------------
    console.log('[4/8] Scene 4: Instant Mode Switching (PLAN ⇄ BUILD)...');
    const modeBadge = await page.$('button[title*="Current mode"]');
    if (modeBadge) {
      await modeBadge.hover();
      await page.waitForTimeout(500);
      await modeBadge.click();
      await page.waitForTimeout(1000);
    }

    // Save Screenshot 3: Mode Switcher
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '3-mode-switcher.png'), fullPage: false });
    console.log('  ✔ Saved: 3-mode-switcher.png');
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // SCENE 5: Dynamic AI Model Allocation On The Fly
    // -------------------------------------------------------------
    console.log('[5/8] Scene 5: Dynamic AI Model Allocation Modal...');
    const modelBadge = await page.$('[title="Click to allocate a different AI model"]');
    if (modelBadge) {
      await modelBadge.hover();
      await page.waitForTimeout(400);
      await modelBadge.click();
      await page.waitForSelector('text=Allocate AI Model', { timeout: 5000 });
      await page.waitForTimeout(800);

      // Hover over Claude 3.7 Sonnet option
      const claudeOption = await page.$('text=Claude 3.7 Sonnet');
      if (claudeOption) {
        await claudeOption.hover();
        await page.waitForTimeout(400);
      }

      // Save Screenshot 4: Model Allocator
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '4-model-allocator.png'), fullPage: false });
      console.log('  ✔ Saved: 4-model-allocator.png');
      await page.waitForTimeout(600);

      // Close model modal
      const closeModelBtn = await page.$('button:has(svg.lucide-x), button:has-text("Cancel")');
      if (closeModelBtn) {
        await closeModelBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // -------------------------------------------------------------
    // SCENE 6: Deep Session Inspector with AST Tool Cards
    // -------------------------------------------------------------
    console.log('[6/8] Scene 6: Deep Session Inspector & AST Tool Traces...');
    const cardTitle = await page.$('h3');
    if (cardTitle) {
      await cardTitle.hover();
      await page.waitForTimeout(300);
      await cardTitle.click();
      await page.waitForSelector('text=Session Inspector', { timeout: 6000 });
      await page.waitForTimeout(800);

      // Click Messages tab if available to show AST cards
      const messagesTab = await page.$('button:has-text("Messages")');
      if (messagesTab) {
        await messagesTab.click();
        await page.waitForTimeout(600);
      }

      // Save Screenshot 5: Session Inspector
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '5-session-inspector.png'), fullPage: false });
      console.log('  ✔ Saved: 5-session-inspector.png');
      await page.waitForTimeout(800);

      // Close inspector
      const closeInspector = await page.$('button:has(svg.lucide-x)');
      if (closeInspector) {
        await closeInspector.click();
        await page.waitForTimeout(500);
      }
    }

    // -------------------------------------------------------------
    // SCENE 7: Sub-Second Prompt Steering Drawer
    // -------------------------------------------------------------
    console.log('[7/8] Scene 7: Sub-Second Prompt Steering Drawer...');
    const steerBtn = await page.$('button[title*="steering prompt"]');
    if (steerBtn) {
      await steerBtn.hover();
      await page.waitForTimeout(400);
      await steerBtn.click();
      await page.waitForSelector('textarea, input[placeholder*="directive"]', { timeout: 5000 });
      await page.waitForTimeout(400);

      const promptInput = await page.$('textarea, input[placeholder*="directive"], input[placeholder*="prompt"]');
      if (promptInput) {
        await promptInput.fill('Run full regression tests and verify sub-second latency across active agents.');
        await page.waitForTimeout(800);
      }

      // Save Screenshot 6: Prompt Steering
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '6-prompt-steering.png'), fullPage: false });
      console.log('  ✔ Saved: 6-prompt-steering.png');
      await page.waitForTimeout(800);

      // Close steer modal
      const closeSteerBtn = await page.$('button:has(svg.lucide-x), button:has-text("Cancel")');
      if (closeSteerBtn) {
        await closeSteerBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // -------------------------------------------------------------
    // SCENE 8: Hierarchical Task Board & Mobile 24/7 Companion
    // -------------------------------------------------------------
    console.log('[8/8] Scene 8: Mobile 24/7 Remote Access & QR Companion...');
    const mobileBtn = await page.$('button[title*="Mobile"]');
    if (mobileBtn) {
      await mobileBtn.hover();
      await page.waitForTimeout(400);
      await mobileBtn.click();
      await page.waitForSelector('text=Mobile & 24/7 Remote Access', { timeout: 5000 });
      await page.waitForTimeout(1000);

      // Save Screenshot 7: Mobile Access & QR Sync
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '7-task-board.png'), fullPage: false });
      console.log('  ✔ Saved: 7-task-board.png');
      await page.waitForTimeout(1200);

      // Close mobile modal
      const closeMobile = await page.$('button:has(svg.lucide-x)');
      if (closeMobile) {
        await closeMobile.click();
        await page.waitForTimeout(600);
      }
    }

    const videoPath = await page.video().path();
    console.log('✔ All recording scenes completed successfully!');

    // Close page and context to finalize video write
    await page.close();
    await context.close();
    await browser.close();

    const targetVideo = path.join(VIDEO_DIR, 'agent-board-walkthrough.webm');
    if (videoPath && fs.existsSync(videoPath)) {
      if (fs.existsSync(targetVideo)) fs.unlinkSync(targetVideo);
      fs.copyFileSync(videoPath, targetVideo);
      console.log('\n✔ Recorded video successfully finalized:', targetVideo);
    }
  } catch (err) {
    console.error('Recording error:', err);
    await browser.close();
    process.exit(1);
  }

  // Copy screenshots to Artifacts directory as well
  if (fs.existsSync(ARTIFACTS_DIR)) {
    for (let i = 1; i <= 7; i++) {
      const filename = [
        '1-desktop-auth.png',
        '2-fleet-overview.png',
        '3-mode-switcher.png',
        '4-model-allocator.png',
        '5-session-inspector.png',
        '6-prompt-steering.png',
        '7-task-board.png'
      ][i - 1];
      const src = path.join(SCREENSHOTS_DIR, filename);
      const dest = path.join(ARTIFACTS_DIR, filename);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`  ✔ Copied to artifacts: ${filename}`);
      }
    }
  }

  console.log('\n======================================================');
  console.log('   ALL 7 SCREENSHOTS & COMPLETE VIDEO COMPLETED!     ');
  console.log('======================================================');
}

recordWalkthrough().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});
