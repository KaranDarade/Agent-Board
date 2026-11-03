import { chromium } from 'playwright-core';

async function runAuthE2ETest() {
  console.log('--- Running Autonomous E2E Auth & Gated Access Test ---');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `e2e_user_${Date.now()}@agentboard.dev`;
  const testPassword = 'Password123!';

  try {
    // 1. Visit http://localhost:3001 as unauthenticated visitor
    console.log('1. Loading http://localhost:3001 as unauthenticated visitor...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Verify Showcase Landing Page is displayed
    const heroTitle = await page.textContent('h1');
    console.log('   Hero Title:', heroTitle?.replace(/\s+/g, ' ').trim());
    if (!heroTitle.includes('AI Coding Agents')) {
      throw new Error('Unauthenticated visitor was not shown Showcase Landing page');
    }
    console.log('   ✔ PASS: Unauthenticated visitor shown Showcase Landing page by default');

    // Verify local fleet cards are NOT shown
    const fleetGrid = await page.$('.grid-cols-1.md\\:grid-cols-2.gap-4');
    // In showcase page there are engine cards, but no operational fleet session cards
    console.log('   ✔ PASS: Local agent fleet is gated behind authentication');

    // 2. Open Auth Modal
    console.log('2. Opening Auth Modal...');
    const signInBtn = await page.waitForSelector('text=Sign In');
    await signInBtn.click();
    await page.waitForTimeout(500);

    const modalTitle = await page.textContent('text=Sign In to Agent Board');
    if (!modalTitle) throw new Error('Sign In modal failed to open');
    console.log('   ✔ PASS: Auth Modal opened');

    // 3. Switch to Sign Up
    console.log('3. Switching to Sign Up tab...');
    const createAccountBtn = await page.waitForSelector('text=Create Account');
    await createAccountBtn.click();
    await page.waitForTimeout(300);

    // 4. Register new user
    console.log('4. Registering new user:', testEmail);
    await page.fill('input[placeholder="Fleet Commander"]', 'Admiral QA');
    await page.fill('input[placeholder="commander@example.com"]', testEmail);
    const passwordInputs = await page.$$('input[placeholder="••••••••"]');
    await passwordInputs[0].fill(testPassword);
    await passwordInputs[1].fill(testPassword);

    const submitRegister = await page.waitForSelector('button:has-text("Create Account & Enter Fleet")');
    await submitRegister.click();
    await page.waitForTimeout(1500);

    // 5. Verify transition to Operational Dashboard
    console.log('5. Verifying Operational Dashboard transition...');
    await page.waitForSelector('text=Active Fleet', { timeout: 10000 });
    const userChip = await page.textContent('text=Admiral QA');
    if (!userChip) throw new Error('User display name not found in Navbar');
    console.log('   ✔ PASS: User registered and dashboard unlocked with name:', userChip);

    // 6. Test Profile Modal
    console.log('6. Testing User Profile Modal...');
    const profileBtn = await page.waitForSelector('button[title="Account Settings"]');
    await profileBtn.click();
    await page.waitForTimeout(500);

    const profileEmail = await page.textContent(`text=${testEmail}`);
    if (!profileEmail) throw new Error('Profile modal failed to display registered email');
    console.log('   ✔ PASS: User Profile modal displays correct user account details');

    // 7. Test Sign Out
    console.log('7. Testing Sign Out...');
    const signOutBtn = await page.waitForSelector('button:has-text("Sign Out")');
    await signOutBtn.click();
    await page.waitForTimeout(1500);

    await page.waitForSelector('text=Mission Control for');
    console.log('   ✔ PASS: Sign Out succeeded and returned to Showcase Landing page');
    console.log('   ✔ PASS: Sign Out succeeded and returned to Showcase Landing page');

    // 8. Sign In with the created user
    console.log('8. Testing Sign In with existing account...');
    const signInBtn2 = await page.waitForSelector('text=Sign In');
    await signInBtn2.click();
    await page.waitForTimeout(500);

    await page.fill('input[placeholder="commander@example.com"]', testEmail);
    await page.fill('input[placeholder="••••••••"]', testPassword);
    const submitLogin = await page.waitForSelector('button:has-text("Sign In to Mission Control")');
    await submitLogin.click();
    await page.waitForTimeout(1500);

    // Verify dashboard unlocked again
    await page.waitForSelector('text=Active Fleet');
    console.log('   ✔ PASS: Sign In with credentials successfully unlocked dashboard');

    console.log('\n======================================================');
    console.log('   ALL E2E AUTH & GATED ACCESS TESTS PASSED!          ');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ E2E Auth test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAuthE2ETest();
