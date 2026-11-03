import { sendWelcomeEmail, sendPasswordResetEmail } from './emailService.js';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

async function testEmailEngine() {
  console.log('🚀 Testing Email Service & Luxury HTML Guide Rendering...\n');

  // Test 1: Welcome Email
  console.log('--- 1. Testing Welcome Email Dispatch ---');
  const testEmail = 'developer@antigravity.test';
  const testName = 'Alex Mercer';
  const welcomeResult = await sendWelcomeEmail({ email: testEmail, displayName: testName });

  assert.strictEqual(welcomeResult.success, true, 'Welcome email must succeed');
  assert.ok(welcomeResult.previewPath, 'Preview path must be returned in dev mode');
  assert.ok(fs.existsSync(welcomeResult.previewPath), 'Preview file must exist on disk');

  const welcomeContent = fs.readFileSync(welcomeResult.previewPath, 'utf8');
  assert.ok(welcomeContent.includes('What is Agent Board?'), 'Email must contain "What is Agent Board?"');
  assert.ok(welcomeContent.includes('Multi-Agent Fleet Orchestration'), 'Email must detail multi-agent fleet');
  assert.ok(welcomeContent.includes('Real-Time Prompt Steering'), 'Email must detail prompt steering');
  assert.ok(welcomeContent.includes('Dynamic Model Re-Allocation'), 'Email must detail model re-allocation');
  assert.ok(welcomeContent.includes('Zero-Cloud Local Privacy'), 'Email must explain local privacy');
  assert.ok(welcomeContent.includes('Step-by-Step Guide'), 'Email must contain step-by-step onboarding guide');
  assert.ok(welcomeContent.includes(testName), 'Email must be personalized with user display name');
  console.log('✅ PASS: Welcome email contains full guide and rendered perfectly!');

  // Test 2: Password Reset OTP Email
  console.log('\n--- 2. Testing Password Reset OTP Email ---');
  const otpCode = '849201';
  const resetResult = await sendPasswordResetEmail({ email: testEmail, otpCode });

  assert.strictEqual(resetResult.success, true, 'Password reset email must succeed');
  assert.ok(resetResult.previewPath, 'Preview path must be returned in dev mode');
  assert.ok(fs.existsSync(resetResult.previewPath), 'Preview file must exist on disk');

  const resetContent = fs.readFileSync(resetResult.previewPath, 'utf8');
  assert.ok(resetContent.includes(otpCode), 'Reset email must contain 6-digit OTP code');
  assert.ok(resetContent.includes('Password Reset Verification'), 'Reset email must have proper title');
  assert.ok(resetContent.includes('Valid for 10 minutes'), 'Reset email must include expiration');
  console.log('✅ PASS: Password reset email with 6-digit OTP rendered perfectly!');

  console.log('\n==========================================');
  console.log('✅ ALL EMAIL ENGINE TESTS PASSED 100%!');
  console.log('==========================================');
}

testEmailEngine().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
