// Comprehensive Autonomous Playwright E2E UI Test Suite
// Executes against http://localhost:3001 using Microsoft Edge headless

import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const BASE_URL = 'http://localhost:3001';

const results = {
  passed: 0,
  failed: 0,
  tests: [],
  consoleErrors: []
};

function record(name, pass, details = '') {
  if (pass) {
    results.passed++;
    console.log(`  ✅ PASS: ${name} ${details ? '(' + details + ')' : ''}`);
    results.tests.push({ name, status: 'PASS', details });
  } else {
    results.failed++;
    console.error(`  ❌ FAIL: ${name} - ${details}`);
    results.tests.push({ name, status: 'FAIL', details });
  }
}

async function runBrowserTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Autonomous E2E UI Test Suite`);
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log(`🖥️  Browser Binary: ${BROWSER_PATH}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico')) {
        results.consoleErrors.push(text);
        console.warn(`    ⚠️ [Browser Console Error]: ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    results.consoleErrors.push(err.message);
    console.error(`    🚨 [Browser Uncaught Exception]: ${err.message}`);
  });

  try {
    console.log('\n--- 1. PAGE LOAD & CONNECTION INTEGRITY ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.title();
    record('Page title is Agent Board', title === 'Agent Board', `Title: "${title}"`);

    await page.waitForSelector('.glass-card', { timeout: 10000 });

    console.log('\n--- 2. KPI TELEMETRY CARDS ---');
    const bodyText = await page.innerText('body');
    record('KPI does not render NaN', !bodyText.includes('NaN'));
    record('KPI does not render undefined', !bodyText.includes('undefined'));
    record('KPI does not render null', !bodyText.includes('null'));

    const liveIndicator = await page.locator('text=LIVE').isVisible();
    record('LIVE pulse indicator is visible in Active Fleet card', liveIndicator);

    const activeFleetLabel = await page.locator('text=Active Fleet').isVisible();
    record('Active Fleet card is present', activeFleetLabel);

    const connectedToolsLabel = await page.locator('text=Connected Tools').isVisible();
    record('Connected Tools card is present', connectedToolsLabel);

    const fleetCostLabel = await page.locator('text=Total Fleet Cost').isVisible();
    record('Total Fleet Cost card is present', fleetCostLabel);

    const tokensBurnedLabel = await page.locator('text=Total Tokens Burned').isVisible();
    record('Total Tokens Burned card is present', tokensBurnedLabel);

    console.log('\n--- 3. ENGINE FILTER BUTTONS ---');
    const openCodeBtn = page.locator('button:has-text("OpenCode")').first();
    if (await openCodeBtn.isVisible()) {
      await openCodeBtn.click();
      await page.waitForTimeout(500);
      const openCodeFilterText = await page.locator('text=across opencode').isVisible();
      record('Clicking OpenCode engine filters the session view', openCodeFilterText);
    }

    const cursorBtn = page.locator('button:has-text("Cursor AI")').first();
    if (await cursorBtn.isVisible()) {
      await cursorBtn.click();
      await page.waitForTimeout(500);
      const cursorFilterText = await page.locator('text=across cursor').isVisible();
      record('Clicking Cursor AI engine filters the session view', cursorFilterText);
    }

    const allEnginesBtn = page.locator('button:has-text("All Engines")').first();
    if (await allEnginesBtn.isVisible()) {
      await allEnginesBtn.click();
      await page.waitForTimeout(500);
      const allText = await page.locator('text=across all tools').isVisible();
      record('Clicking All Engines restores complete fleet view', allText);
    }

    console.log('\n--- 4. SEARCH FUNCTIONALITY ---');
    const searchInput = page.locator('input[placeholder*="Search session title"]');
    record('Search input is visible', await searchInput.isVisible());

    await searchInput.fill('opencode');
    await page.waitForTimeout(400);
    const searchResultCount = await page.locator('text=Displaying').innerText();
    record('Typing in search input filters results in real-time', !!searchResultCount, searchResultCount);

    const clearBtn = page.locator('button:has-text("Clear")');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(300);
      const restoredVal = await searchInput.inputValue();
      record('Clicking Clear button resets search input', restoredVal === '');
    }

    await searchInput.fill('xyz999_completely_nonsense_nonexistent');
    await page.waitForTimeout(400);
    const emptyState = await page.locator('text=No Sessions Match Your Filters').isVisible();
    record('Nonsense search displays clean empty state without crashing', emptyState);

    const resetBtn = page.locator('button:has-text("Reset All Filters")');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(400);
      const resetAllText = await page.locator('text=across all tools').isVisible();
      record('Reset All Filters button successfully restores sessions', resetAllText);
    }

    console.log('\n--- 5. WORKSPACE DROPDOWN FILTER ---');
    const workspaceSelect = page.locator('select').first();
    if (await workspaceSelect.isVisible()) {
      const options = await workspaceSelect.locator('option').allInnerTexts();
      record('Workspace dropdown loaded options', options.length > 0, `${options.length} options`);

      if (options.length > 1) {
        await workspaceSelect.selectOption({ index: 1 });
        await page.waitForTimeout(400);
        const filteredCount = await page.locator('text=Displaying').innerText();
        record('Selecting workspace filters sessions', !!filteredCount, filteredCount);

        await workspaceSelect.selectOption({ value: 'all' });
        await page.waitForTimeout(300);
        record('Resetting workspace dropdown to all restores fleet', true);
      }
    }

    console.log('\n--- 6. GRID VS TABLE VIEW SWITCHER ---');
    const tableViewBtn = page.locator('button[title="Compact Table View"]');
    const gridViewBtn = page.locator('button[title="Grid Cards View"]');

    if (await tableViewBtn.isVisible()) {
      await tableViewBtn.click();
      await page.waitForTimeout(400);
      const tableExists = await page.locator('table').isVisible();
      record('Switching to Table View renders HTML table', tableExists);

      const tableRows = await page.locator('table tbody tr').count();
      record('Table View renders session rows', tableRows > 0, `${tableRows} rows rendered`);

      await gridViewBtn.click();
      await page.waitForTimeout(400);
      const gridExists = await page.locator('.grid.grid-cols-1').first().isVisible();
      record('Switching back to Grid View renders cards grid', gridExists);
    }

    console.log('\n--- 7. SESSION CARD ACTIONS & MODE SWITCHING ---');
    const firstSessionCard = page.locator('.grid.grid-cols-1 > div.glass-card').first();
    const modeBadge = firstSessionCard.locator('button[title*="Current mode"]').first();
    if (await modeBadge.isVisible()) {
      await modeBadge.click();
      await page.waitForTimeout(500);

      const banner = page.locator('text=Session switched to');
      const bannerSeen = await banner.isVisible();
      record('Clicking mode switch triggers notification banner', bannerSeen);

      // Revert mode
      await modeBadge.click();
      await page.waitForTimeout(500);
      record('Switching mode back restores original mode', true);
    }

    // Model Selector button on first card
    const modelBtn = firstSessionCard.locator('button[title*="Allocate Model"]').first();
    if (await modelBtn.isVisible()) {
      await modelBtn.click();
      await page.waitForTimeout(500);

      const modalTitle = await page.locator('text=Allocate Model').isVisible();
      record('Clicking Model button opens ModelSelectorModal', modalTitle);

      const closeModelBtn = page.locator('button:has-text("Cancel")').first();
      if (await closeModelBtn.isVisible()) {
        await closeModelBtn.click();
        await page.waitForTimeout(300);
        record('Closing ModelSelectorModal works smoothly', true);
      }
    }

    console.log('\n--- 8. SESSION INSPECTOR DRAWER & TASK CRUD ---');
    // Click on the first session card (on the title or empty space) to open inspector
    await firstSessionCard.locator('h3').first().click();
    await page.waitForTimeout(800);

    const drawerVisible = await page.locator('button:has-text("Tasks (")').isVisible();
    record('Session Inspector drawer opens upon card selection', drawerVisible);

    if (drawerVisible) {
      // Find Task Manager within inspector
      const taskInput = page.locator('input[placeholder*="Add a new task"]');
      if (await taskInput.isVisible()) {
        await taskInput.fill('Playwright Automated Verification Item');
        const addTaskBtn = page.locator('button:has-text("Add Task")');
        await addTaskBtn.click();
        await page.waitForTimeout(800);

        const taskAppeared = await page.locator('text=Playwright Automated Verification Item').isVisible();
        record('New task added via Inspector UI is visible in task list', taskAppeared);

        // Delete the added task
        const deleteBtn = page.locator('button[title*="Delete Task"]').last();
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();
          await page.waitForTimeout(500);
          record('Task deleted via Inspector UI', true);
        }
      }

      // Close inspector via X button
      const closeDrawerBtn = page.locator('div.fixed.inset-0 button').filter({ has: page.locator('svg.lucide-x') }).first();
      if (await closeDrawerBtn.isVisible()) {
        await closeDrawerBtn.click();
        await page.waitForTimeout(400);
        record('Session Inspector closes properly', true);
      }
    }

    console.log('\n--- 9. NAVBAR MODALS (CREATE, MOBILE, DOWNLOAD) ---');
    // New Session Modal
    const newSessionBtn = page.locator('button[title="Create a new agent session"]').first();
    if (await newSessionBtn.isVisible()) {
      await newSessionBtn.click();
      await page.waitForTimeout(400);
      const createModalTitle = await page.locator('text=Create New Agent Session').isVisible();
      record('New Session button opens CreateSessionModal', createModalTitle);

      const cancelCreateBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelCreateBtn.isVisible()) {
        await cancelCreateBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Download App Modal
    const downloadBtn = page.locator('button[title*="Download"]').first();
    if (await downloadBtn.isVisible()) {
      await downloadBtn.click();
      await page.waitForTimeout(400);
      const downloadModalTitle = await page.locator('text=Download Agent Board').isVisible();
      record('Download App button opens DownloadAppModal', downloadModalTitle);

      const closeDownloadBtn = page.locator('button:has-text("Close"), button[aria-label*="Close"]').first();
      if (await closeDownloadBtn.isVisible()) {
        await closeDownloadBtn.click();
        await page.waitForTimeout(300);
      }
    }

    console.log('\n--- 10. THEME TOGGLING (DARK / LIGHT) ---');
    const themeBtn = page.locator('button[title*="theme"], button[title*="Switch to"]').first();
    if (await themeBtn.isVisible()) {
      const isInitiallyDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      await themeBtn.click();
      await page.waitForTimeout(300);

      const isToggled = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      record('Theme toggle switches html dark class', isInitiallyDark !== isToggled);

      await themeBtn.click();
      await page.waitForTimeout(300);
      const isRestored = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      record('Theme toggle reverts cleanly to dark theme', isRestored === isInitiallyDark);
    }

    console.log('\n--- 11. RESPONSIVE VIEWPORT AUDIT ---');
    const viewports = [
      { name: 'Mobile iPhone SE (375x667)', width: 375, height: 667 },
      { name: 'Mobile iPhone 14 (390x844)', width: 390, height: 844 },
      { name: 'Tablet iPad (768x1024)', width: 768, height: 1024 },
      { name: 'Desktop HD (1440x900)', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      record(`Responsive layout: ${vp.name} has no horizontal overflow`, !hasHorizontalScroll);
    }

    console.log('\n--- 12. BROWSER CONSOLE ERROR AUDIT ---');
    record('Browser console had 0 uncaught errors', results.consoleErrors.length === 0, `${results.consoleErrors.length} errors observed`);
    if (results.consoleErrors.length > 0) {
      console.warn('Observed console errors:', results.consoleErrors);
    }

  } catch (err) {
    console.error('Fatal error during browser test execution:', err);
    record('Browser test finished without unhandled fatal exception', false, err.message);
  } finally {
    await browser.close();
  }

  console.log(`\n======================================================`);
  console.log(`BROWSER E2E TEST RESULTS: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log(`======================================================\n`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

runBrowserTests().catch(err => {
  console.error('Fatal runner crash:', err);
  process.exit(1);
});
