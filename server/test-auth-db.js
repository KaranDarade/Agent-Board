import { 
  createUser, 
  verifyUserPassword, 
  createSession, 
  getUserByToken, 
  generatePasswordOtp, 
  verifyPasswordOtp, 
  resetPasswordWithOtp, 
  updateUserProfile, 
  changeUserPassword, 
  deleteUser,
  createOrLoginGoogleUser 
} from './userDb.js';

console.log('--- Testing User Database (CRUD & Auth) ---');

const testEmail = `test_${Date.now()}@agentboard.dev`;
const testPassword = 'Password123!';

// 1. Create User
console.log('1. Creating User...');
const user = createUser({
  email: testEmail,
  password: testPassword,
  displayName: 'Agent Commander'
});
console.log('   ✔ User Created:', user.id, user.email, user.displayName);

// 2. Verify Password (Success & Failure)
console.log('2. Verifying Password...');
const validAuth = verifyUserPassword(testEmail, testPassword);
if (!validAuth) throw new Error('Password verification failed for valid password');
console.log('   ✔ Valid Password verified successfully');

const invalidAuth = verifyUserPassword(testEmail, 'WrongPassword');
if (invalidAuth) throw new Error('Password verification should have failed for wrong password');
console.log('   ✔ Wrong Password rejected correctly');

// 3. Create Session & Get User by Token
console.log('3. Session Management...');
const session = createSession(user.id);
const retrievedUser = getUserByToken(session.token);
if (!retrievedUser || retrievedUser.email !== testEmail) {
  throw new Error('Failed to retrieve user by session token');
}
console.log('   ✔ Session token generated and verified:', session.token.slice(0, 15) + '...');

// 4. Google Auth creation & login
console.log('4. Google Auth...');
const googleUser = createOrLoginGoogleUser({
  email: `google_${Date.now()}@gmail.com`,
  displayName: 'Google Dev',
  avatarUrl: 'https://example.com/avatar.png'
});
console.log('   ✔ Google user authenticated:', googleUser.id, googleUser.provider);

// 5. OTP Password Reset Flow
console.log('5. OTP Generation & Verification...');
const otpResult = generatePasswordOtp(testEmail);
console.log('   Generated OTP:', otpResult.otpPreview);

const isValidOtp = verifyPasswordOtp(testEmail, otpResult.otpPreview);
if (!isValidOtp) throw new Error('OTP verification failed');
console.log('   ✔ OTP verified successfully');

const isWrongOtp = verifyPasswordOtp(testEmail, '000000');
if (isWrongOtp) throw new Error('Wrong OTP should have failed');
console.log('   ✔ Invalid OTP rejected correctly');

const resetResult = resetPasswordWithOtp(testEmail, otpResult.otpPreview, 'NewSecret456!');
console.log('   ✔ Password reset with OTP successful');

const newPassAuth = verifyUserPassword(testEmail, 'NewSecret456!');
if (!newPassAuth) throw new Error('Login with new password failed');
console.log('   ✔ Login with new reset password succeeded');

// 6. Update Profile
console.log('6. Update Profile...');
const updated = updateUserProfile(user.id, { displayName: 'Supreme Commander' });
if (updated.display_name !== 'Supreme Commander') throw new Error('Profile update failed');
console.log('   ✔ Profile updated to:', updated.display_name);

// 7. Change Password
console.log('7. Change Password...');
changeUserPassword(user.id, 'NewSecret456!', 'FinalPassword789!');
const finalAuth = verifyUserPassword(testEmail, 'FinalPassword789!');
if (!finalAuth) throw new Error('Login with changed password failed');
console.log('   ✔ Password change verified');

// 8. Delete User (Cascade cleanup)
console.log('8. Delete User...');
deleteUser(user.id);
const deletedTokenCheck = getUserByToken(session.token);
if (deletedTokenCheck) throw new Error('Session should be invalidated after user deletion');
console.log('   ✔ User deleted and sessions revoked');

console.log('\n======================================================');
console.log('   ALL USER DB & AUTH UNIT TESTS PASSED (8/8)!       ');
console.log('======================================================');
