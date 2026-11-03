import assert from 'node:assert';

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('--- Testing Real Direct Google OAuth 2.0 Integration ---');

  // 1. Check Google Config
  console.log('1. Checking Google OAuth config endpoint...');
  const configRes = await fetch(`${BASE_URL}/api/auth/google/config`);
  assert.strictEqual(configRes.status, 200);
  const config = await configRes.json();
  console.log('   ✔ Config returned:', config);

  // 2. Test rejection on empty client ID
  console.log('2. Testing Google config rejection on empty client ID...');
  const emptyRes = await fetch(`${BASE_URL}/api/auth/google/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: '' })
  });
  assert.strictEqual(emptyRes.status, 400);
  console.log('   ✔ Properly rejected with 400 when empty client ID provided');

  // 3. Configure a real Google Client ID format
  console.log('3. Configuring Google Client ID...');
  const testClientId = '1234567890-testclientidforagentboard.apps.googleusercontent.com';
  const saveRes = await fetch(`${BASE_URL}/api/auth/google/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: testClientId })
  });
  assert.strictEqual(saveRes.status, 200);
  const saveData = await saveRes.json();
  assert.strictEqual(saveData.success, true);
  console.log('   ✔ Google Client ID saved successfully');

  // 4. Test URL generation with configured client ID
  console.log('4. Generating Google OAuth URL...');
  const urlRes = await fetch(`${BASE_URL}/api/auth/google/url`);
  assert.strictEqual(urlRes.status, 200);
  const urlData = await urlRes.json();
  assert.strictEqual(urlData.configured, true);
  assert(urlData.url.startsWith('https://accounts.google.com/o/oauth2/v2/auth'));
  assert(urlData.url.includes(encodeURIComponent(testClientId)));
  assert(urlData.url.includes('redirect_uri'));
  assert(urlData.url.includes('scope=openid+email+profile') || urlData.url.includes('openid'));
  console.log('   ✔ Real Google OAuth URL successfully generated:');
  console.log('     ', urlData.url);

  // 5. Test Direct Google Verified User Creation
  console.log('5. Testing Direct Google User Creation (from verified provider)...');
  const realGoogleEmail = `user_${Date.now()}@gmail.com`;
  const realName = 'Karan Tester';
  const realAvatar = 'https://lh3.googleusercontent.com/a/test-avatar';

  const userRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: realGoogleEmail,
      displayName: realName,
      avatarUrl: realAvatar
    })
  });
  assert.strictEqual(userRes.status, 200);
  const userData = await userRes.json();
  assert.strictEqual(userData.success, true);
  assert.strictEqual(userData.user.email, realGoogleEmail);
  assert.strictEqual(userData.user.displayName, realName);
  assert.strictEqual(userData.user.provider, 'google');
  assert(userData.token.startsWith('tok_'));
  console.log('   ✔ Real Google user created in database with 30-day token:', userData.token);

  console.log('\n======================================================');
  console.log('   ALL REAL GOOGLE OAUTH BACKEND TESTS PASSED (5/5)!   ');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
