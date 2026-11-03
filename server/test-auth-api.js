async function runAuthApiTests() {
  console.log('--- Testing Auth API Endpoints (11 Endpoints) ---');
  const baseUrl = 'http://localhost:3001/api/auth';
  const testEmail = `api_user_${Date.now()}@agentboard.dev`;
  const testPassword = 'Password123!';
  let token = null;

  // 1. POST /api/auth/register
  console.log('1. Testing /api/auth/register...');
  const regRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      displayName: 'Captain Agent'
    })
  });
  if (regRes.status !== 201) throw new Error(`Register failed: ${await regRes.text()}`);
  const regData = await regRes.json();
  token = regData.token;
  console.log('   ✔ Registered:', regData.user.email, 'Token:', token.slice(0, 15) + '...');

  // 2. Duplicate registration check (should return 400)
  console.log('2. Testing Duplicate Register...');
  const dupRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  if (dupRes.status !== 400) throw new Error('Duplicate register should return 400');
  console.log('   ✔ Duplicate correctly rejected with 400');

  // 3. POST /api/auth/login
  console.log('3. Testing /api/auth/login...');
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  if (loginRes.status !== 200) throw new Error(`Login failed: ${await loginRes.text()}`);
  const loginData = await loginRes.json();
  console.log('   ✔ Login successful for:', loginData.user.email);

  // 4. Invalid Login (should return 401)
  console.log('4. Testing Invalid Password...');
  const badLogin = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Wrong' })
  });
  if (badLogin.status !== 401) throw new Error('Bad login should return 401');
  console.log('   ✔ Bad login correctly rejected with 401');

  // 5. GET /api/auth/me
  console.log('5. Testing /api/auth/me...');
  const meRes = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (meRes.status !== 200) throw new Error('Failed to fetch /me');
  const meData = await meRes.json();
  if (meData.user.email !== testEmail) throw new Error('Email mismatch on /me');
  console.log('   ✔ /me returned current user profile:', meData.user.displayName);

  // 6. POST /api/auth/google
  console.log('6. Testing /api/auth/google...');
  const googleRes = await fetch(`${baseUrl}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `google_user_${Date.now()}@gmail.com`,
      displayName: 'Google Navigator'
    })
  });
  if (googleRes.status !== 200) throw new Error('Google auth failed');
  const googleData = await googleRes.json();
  console.log('   ✔ Google auth succeeded:', googleData.user.email, googleData.user.provider);

  // 7. POST /api/auth/forgot-password (OTP generation)
  console.log('7. Testing /api/auth/forgot-password...');
  const forgotRes = await fetch(`${baseUrl}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  if (forgotRes.status !== 200) throw new Error('Forgot password request failed');
  const forgotData = await forgotRes.json();
  const otpCode = forgotData.otpPreview;
  console.log('   ✔ OTP received:', otpCode);

  // 8. POST /api/auth/verify-otp
  console.log('8. Testing /api/auth/verify-otp...');
  const verifyRes = await fetch(`${baseUrl}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otpCode })
  });
  if (verifyRes.status !== 200) throw new Error('OTP verification failed');
  console.log('   ✔ OTP verified successfully');

  // 9. POST /api/auth/reset-password
  console.log('9. Testing /api/auth/reset-password...');
  const resetRes = await fetch(`${baseUrl}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otpCode,
      newPassword: 'BrandNewPassword99!'
    })
  });
  if (resetRes.status !== 200) throw new Error('Password reset failed');
  console.log('   ✔ Password reset successfully');

  // Verify login with new password
  const newLogin = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'BrandNewPassword99!' })
  });
  if (newLogin.status !== 200) throw new Error('Login with new reset password failed');
  const newLoginData = await newLogin.json();
  token = newLoginData.token;
  console.log('   ✔ Logged in with new password');

  // 10. POST /api/auth/update-profile
  console.log('10. Testing /api/auth/update-profile...');
  const updateRes = await fetch(`${baseUrl}/update-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ displayName: 'Grand Admiral Agent' })
  });
  if (updateRes.status !== 200) throw new Error('Profile update failed');
  const updateData = await updateRes.json();
  console.log('   ✔ Profile updated:', updateData.user.display_name);

  // 11. POST /api/auth/delete-account
  console.log('11. Testing /api/auth/delete-account...');
  const deleteRes = await fetch(`${baseUrl}/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (deleteRes.status !== 200) throw new Error('Delete account failed');
  console.log('   ✔ Account deleted');

  // Verify session invalidated
  const deadSessionCheck = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (deadSessionCheck.status !== 401) throw new Error('Session should be invalid after account deletion');
  console.log('   ✔ Session token revoked after deletion');

  console.log('\n======================================================');
  console.log('   ALL 11 AUTH API ENDPOINTS VERIFIED & PASSING!     ');
  console.log('======================================================');
}

runAuthApiTests().catch(err => {
  console.error('❌ Auth API test failed:', err);
  process.exit(1);
});
