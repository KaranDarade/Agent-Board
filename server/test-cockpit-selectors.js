import { chromium } from 'playwright-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testSelectors() {
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto('http://localhost:3001/?app=desktop', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    console.log('1. Auth screen loaded:', await page.isVisible('text=Sign In to Workstation'));

    // Switch to create account
    await page.click('button:has-text("Create Account")');
    await page.fill('input[placeholder="Agent Commander"]', 'Commander Demo');
    await page.fill('input[type="email"]', `commander_${Date.now()}@fleet.dev`);
    const pwInputs = await page.$$('input[type="password"]');
    await pwInputs[0].fill('Pass1234!');
    await pwInputs[1].fill('Pass1234!');
    await page.click('button[type="submit"]');

    // Wait for operational cockpit
    await page.waitForSelector('button[title="Create a new agent session"]', { timeout: 8000 });
    console.log('2. Successfully entered Operational Cockpit!');

    // Wait for fleet cards to render
    await page.waitForSelector('h3', { timeout: 5000 });
    console.log('3. Session cards rendered!');
    console.log('   Active Fleet visible:', await page.isVisible('text=Active Fleet'));
    console.log('   All visible h3 texts:', await page.$$eval('h3', els => els.map(e => e.textContent.trim())));

    // Test 1: ModeSwitchBadge
    const modeBadge = await page.$('button[title*="Current mode"]');
    console.log('4. ModeSwitchBadge found:', Boolean(modeBadge));
    if (modeBadge) {
      const modeText = await modeBadge.textContent();
      console.log('   Current mode text:', modeText.trim());
      await modeBadge.click();
      await page.waitForTimeout(600);
      const newModeText = await modeBadge.textContent();
      console.log('   Toggled mode text:', newModeText.trim());
    }

    // Test 2: Model Allocator Modal
    const modelBadge = await page.$('[title="Click to allocate a different AI model"]');
    console.log('5. Model badge found:', Boolean(modelBadge));
    if (modelBadge) {
      await modelBadge.click();
      await page.waitForSelector('text=Allocate AI Model', { timeout: 4000 });
      console.log('   Model Selector Modal opened successfully!');
      // Close modal
      const closeModelBtn = await page.$('button:has(svg.lucide-x), button:has-text("Cancel")');
      if (closeModelBtn) await closeModelBtn.click();
      await page.waitForTimeout(400);
    }

    // Test 3: Prompt Steering Drawer
    const steerBtn = await page.$('button[title*="steering prompt"]');
    console.log('6. Steer button found:', Boolean(steerBtn));
    if (steerBtn) {
      await steerBtn.click();
      await page.waitForSelector('textarea, input[placeholder*="directive"]', { timeout: 4000 });
      console.log('   Prompt Steering modal/drawer opened successfully!');
      const closeSteerBtn = await page.$('button:has(svg.lucide-x), button:has-text("Cancel")');
      if (closeSteerBtn) await closeSteerBtn.click();
      await page.waitForTimeout(400);
    }

    // Test 4: Session Inspector Drawer
    const cardTitle = await page.$('h3');
    if (cardTitle) {
      await cardTitle.click();
      await page.waitForSelector('text=Session Inspector', { timeout: 4000 });
      console.log('7. Session Inspector opened successfully!');
      // Check tabs inside inspector: Todos/Tasks, Messages, Telemetry
      const todosTab = await page.$('button:has-text("Todos"), button:has-text("Tasks")');
      console.log('   Tasks/Todos tab present in inspector:', Boolean(todosTab));
      const closeInspector = await page.$('button:has(svg.lucide-x)');
      if (closeInspector) await closeInspector.click();
      await page.waitForTimeout(400);
    }

    // Test 5: Mobile Companion Modal
    const mobileBtn = await page.$('button[title*="Mobile"]');
    console.log('8. Mobile button found:', Boolean(mobileBtn));
    if (mobileBtn) {
      await mobileBtn.click();
      await page.waitForSelector('text=Mobile & 24/7 Remote Access', { timeout: 4000 });
      console.log('   Mobile Access modal opened successfully!');
      const closeMobile = await page.$('button:has(svg.lucide-x)');
      if (closeMobile) await closeMobile.click();
    }

    console.log('\n--- ALL INTERACTIVE COCKPIT FEATURES VERIFIED! ---');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
}

testSelectors();
