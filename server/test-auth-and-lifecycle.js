import assert from 'node:assert';
import { getAuthDb, createUser, verifyUserPassword, verifyPasswordOtp, resetPasswordWithOtp } from './userDb.js';

const BASE_URL = 'http://localhost:3001';

async function testLifecycle() {
  console.log('🚀 Running Full Auth & Email Lifecycle Tests...\n');

  // Test 1: User Registration via API (Verifying Welcome Email Dispatch)
  console.log('--- 1. Testing Registration & Welcome Email Dispatch ---');
  const uniqueEmail = `pilot_${Date.now()}@agentboard.test`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongSecretPassword123!',
      displayName: 'Commander Shepard'
    })
  });

  const regData = await regRes.json();
  assert.strictEqual(regRes.status, 201, `Registration should succeed: ${JSON.stringify(regData)}`);
  assert.strictEqual(regData.success, true);
  assert.ok(regData.token, 'Should return session token');
  assert.strictEqual(regData.user.email, uniqueEmail);
  console.log(`✅ PASS: User registered (${uniqueEmail}) and Welcome Email dispatched.`);

  // Wait 500ms for background email promise to settle
  await new Promise(r => setTimeout(r, 600));

  // Verify welcome_email_sent in SQLite DB
  const db = getAuthDb();
  const dbUser = db.prepare('SELECT welcome_email_sent FROM users WHERE email = ?').get(uniqueEmail);
  assert.strictEqual(dbUser.welcome_email_sent, 1, 'welcome_email_sent must be marked 1');
  console.log('✅ PASS: welcome_email_sent flag verified in SQLite WAL database.');

  // Test 2: Request Password Reset OTP
  console.log('\n--- 2. Testing Forgot Password OTP Generation & Email Dispatch ---');
  const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail })
  });

  const forgotData = await forgotRes.json();
  assert.strictEqual(forgotRes.status, 200);
  assert.strictEqual(forgotData.success, true);
  assert.ok(forgotData.otpPreview, 'OTP preview must be present for testing');
  assert.strictEqual(forgotData.otpPreview.length, 6, 'OTP must be 6 digits');
  const otpCode = forgotData.otpPreview;
  console.log(`✅ PASS: Recovery OTP generated (${otpCode}) and email dispatched.`);

  // Test 3: Verify OTP Code
  console.log('\n--- 3. Testing OTP Verification ---');
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, otpCode })
  });
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyData.success, true);
  console.log('✅ PASS: 6-digit OTP code successfully verified.');

  // Test 4: Reset Password with OTP
  console.log('\n--- 4. Testing Reset Password with OTP ---');
  const newSecretPassword = 'BrandNewUpgradedPassword456!';
  const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      otpCode,
      newPassword: newSecretPassword
    })
  });
  const resetData = await resetRes.json();
  assert.strictEqual(resetRes.status, 200);
  assert.strictEqual(resetData.success, true);
  console.log('✅ PASS: Password successfully reset with OTP.');

  // Test 5: Verify Old Password Fails and New Password Succeeds
  console.log('\n--- 5. Testing Login with New Password ---');
  const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, password: 'StrongSecretPassword123!' })
  });
  assert.strictEqual(oldLoginRes.status, 401, 'Old password must be rejected');

  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, password: newSecretPassword })
  });
  const newLoginData = await newLoginRes.json();
  assert.strictEqual(newLoginRes.status, 200);
  assert.strictEqual(newLoginData.success, true);
  assert.ok(newLoginData.token, 'Should receive fresh session token');
  console.log('✅ PASS: Login with new password succeeded, old password rejected!');

  // Test 6: Verify Google OAuth Configuration Endpoint (Clean Error Handling)
  console.log('\n--- 6. Testing Google OAuth Endpoints (Zero Client ID Prompts) ---');
  const googleConfigRes = await fetch(`${BASE_URL}/api/auth/google/config`);
  const googleConfigData = await googleConfigRes.json();
  assert.ok('configured' in googleConfigData, 'Config check must return configured boolean');

  const googleUrlRes = await fetch(`${BASE_URL}/api/auth/google/url`);
  const googleUrlData = await googleUrlRes.json();
  if (googleConfigData.configured) {
    assert.strictEqual(googleUrlRes.status, 200);
    assert.ok(googleUrlData.url.startsWith('https://accounts.google.com/'), 'URL must point to official Google OAuth');
    console.log('✅ PASS: Google OAuth is configured and returns authentic Google URL.');
  } else {
    assert.strictEqual(googleUrlRes.status, 400);
    assert.strictEqual(googleUrlData.configured, false);
    assert.ok(googleUrlData.error.includes('not configured on the server'), 'Error message must guide user to email login without asking for keys');
    console.log('✅ PASS: Unconfigured Google OAuth cleanly directs to email login without asking end-user for Client ID.');
  }

  console.log('\n==========================================');
  console.log('✅ ALL LIFECYCLE & SECURITY TESTS PASSED 100%!');
  console.log('==========================================');
}

testLifecycle().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
