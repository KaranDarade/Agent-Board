import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.join(process.cwd(), 'server', 'users.db');

let db = null;

export function getAuthDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        salt TEXT,
        display_name TEXT,
        avatar_url TEXT,
        provider TEXT DEFAULT 'email',
        welcome_email_sent INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_login_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS password_otps (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_password_otps_email ON password_otps(email);
    `);

    // Safe migration if table previously existed without welcome_email_sent
    try {
      db.exec(`ALTER TABLE users ADD COLUMN welcome_email_sent INTEGER DEFAULT 0;`);
    } catch (e) {}
  }
  return db;
}

// Password Hashing with Salt using native crypto.scryptSync
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function createUser({ email, password, displayName = '', provider = 'email', avatarUrl = '' }) {
  if (!email || !email.includes('@')) {
    throw new Error('Valid email address is required');
  }

  const database = getAuthDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const id = 'usr_' + crypto.randomBytes(12).toString('hex');
  const salt = password ? crypto.randomBytes(16).toString('hex') : null;
  const passwordHash = password ? hashPassword(password, salt) : null;
  const now = Date.now();
  const finalName = displayName.trim() || normalizedEmail.split('@')[0];

  const stmt = database.prepare(`
    INSERT INTO users (id, email, password_hash, salt, display_name, avatar_url, provider, created_at, updated_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, normalizedEmail, passwordHash, salt, finalName, avatarUrl, provider, now, now, now);

  return {
    id,
    email: normalizedEmail,
    displayName: finalName,
    avatarUrl,
    provider,
    createdAt: now,
    isNewUser: true
  };
}

export function verifyUserPassword(email, password) {
  if (!email || !password) return null;
  const database = getAuthDb();
  const normalizedEmail = email.trim().toLowerCase();

  const user = database.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user || !user.password_hash || !user.salt) return null;

  const testHash = hashPassword(password, user.salt);
  if (crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(user.password_hash, 'hex'))) {
    const now = Date.now();
    database.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, user.id);
    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      provider: user.provider,
      createdAt: user.created_at,
      lastLoginAt: now
    };
  }
  return null;
}

export function createOrLoginGoogleUser({ email, displayName = '', avatarUrl = '' }) {
  if (!email || !email.includes('@')) {
    throw new Error('Valid email is required for Google authentication');
  }
  const database = getAuthDb();
  const normalizedEmail = email.trim().toLowerCase();

  let user = database.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  const now = Date.now();
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const id = 'usr_' + crypto.randomBytes(12).toString('hex');
    const finalName = displayName?.trim() || normalizedEmail.split('@')[0];
    database.prepare(`
      INSERT INTO users (id, email, password_hash, salt, display_name, avatar_url, provider, created_at, updated_at, last_login_at)
      VALUES (?, ?, NULL, NULL, ?, ?, 'google', ?, ?, ?)
    `).run(id, normalizedEmail, finalName, avatarUrl || '', now, now, now);

    user = { id, email: normalizedEmail, display_name: finalName, avatar_url: avatarUrl || '', provider: 'google', created_at: now };
  } else {
    database.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .run(now, user.id);
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    provider: user.provider,
    createdAt: user.created_at,
    lastLoginAt: now,
    isNewUser
  };
}

export function createSession(userId) {
  const database = getAuthDb();
  const token = 'tok_' + crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days session validity

  database.prepare(`
    INSERT INTO user_sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, userId, expiresAt, now);

  return { token, expiresAt };
}

export function getUserByToken(token) {
  if (!token) return null;
  const database = getAuthDb();
  const now = Date.now();

  const session = database.prepare(`
    SELECT s.user_id, s.expires_at, u.id, u.email, u.display_name, u.avatar_url, u.provider, u.created_at, u.last_login_at
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now);

  if (!session) return null;

  return {
    id: session.id,
    email: session.email,
    displayName: session.display_name,
    avatarUrl: session.avatar_url,
    provider: session.provider,
    createdAt: session.created_at,
    lastLoginAt: session.last_login_at
  };
}

export function deleteSession(token) {
  if (!token) return;
  const database = getAuthDb();
  database.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
}

// 6-digit OTP for password recovery (10 minutes validity)
export function generatePasswordOtp(email) {
  if (!email) throw new Error('Email is required');
  const database = getAuthDb();
  const normalizedEmail = email.trim().toLowerCase();

  const user = database.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (!user) {
    throw new Error('No user found registered with this email address');
  }

  // Invalidate any previous OTPs for this email
  database.prepare('DELETE FROM password_otps WHERE email = ?').run(normalizedEmail);

  // Generate secure 6-digit numerical code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const id = 'otp_' + crypto.randomBytes(8).toString('hex');
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  database.prepare(`
    INSERT INTO password_otps (id, email, otp_code, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, normalizedEmail, otpCode, expiresAt, now);

  console.log(`\n======================================================`);
  console.log(`🔑 [PASSWORD RESET OTP]`);
  console.log(`📧 Target Email: ${normalizedEmail}`);
  console.log(`🔢 One-Time Code: ${otpCode}`);
  console.log(`⏰ Valid for 10 minutes (expires at: ${new Date(expiresAt).toLocaleTimeString()})`);
  console.log(`======================================================\n`);

  return {
    success: true,
    email: normalizedEmail,
    expiresAt,
    // Return code in development response for easy testing
    otpPreview: otpCode
  };
}

export function verifyPasswordOtp(email, otpCode) {
  if (!email || !otpCode) return false;
  const database = getAuthDb();
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = String(otpCode).trim();
  const now = Date.now();

  const record = database.prepare(`
    SELECT id FROM password_otps
    WHERE email = ? AND otp_code = ? AND expires_at > ?
  `).get(normalizedEmail, cleanCode, now);

  return Boolean(record);
}

export function resetPasswordWithOtp(email, otpCode, newPassword) {
  if (!email || !otpCode || !newPassword || newPassword.length < 6) {
    throw new Error('Valid email, OTP code, and a password of at least 6 characters are required');
  }
  const database = getAuthDb();
  const normalizedEmail = email.trim().toLowerCase();
  const isValid = verifyPasswordOtp(normalizedEmail, otpCode);

  if (!isValid) {
    throw new Error('Invalid or expired OTP code. Please request a new code.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword, salt);
  const now = Date.now();

  database.prepare(`
    UPDATE users 
    SET password_hash = ?, salt = ?, updated_at = ?
    WHERE email = ?
  `).run(passwordHash, salt, now, normalizedEmail);

  // Consume OTP so it cannot be used again
  database.prepare('DELETE FROM password_otps WHERE email = ?').run(normalizedEmail);

  return { success: true, email: normalizedEmail };
}

export function updateUserProfile(userId, { displayName, avatarUrl }) {
  const database = getAuthDb();
  const now = Date.now();
  const current = database.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!current) throw new Error('User not found');

  const newName = (displayName !== undefined && displayName !== null && displayName.trim() !== '') ? displayName.trim() : current.display_name;
  const newAvatar = (avatarUrl !== undefined && avatarUrl !== null && avatarUrl.trim() !== '') ? avatarUrl.trim() : current.avatar_url;

  database.prepare(`
    UPDATE users
    SET display_name = ?,
        avatar_url = ?,
        updated_at = ?
    WHERE id = ?
  `).run(newName, newAvatar, now, userId);

  return database.prepare('SELECT id, email, display_name, avatar_url, provider, created_at, last_login_at FROM users WHERE id = ?').get(userId);
}

export function changeUserPassword(userId, oldPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }
  const database = getAuthDb();
  const user = database.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!user) throw new Error('User not found');
  if (user.password_hash && user.salt) {
    const testHash = hashPassword(oldPassword, user.salt);
    if (!crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(user.password_hash, 'hex'))) {
      throw new Error('Current password is incorrect');
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword, salt);
  const now = Date.now();

  database.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?')
    .run(passwordHash, salt, now, userId);

  return { success: true };
}

export function deleteUser(userId) {
  const database = getAuthDb();
  database.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(userId);
  database.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return { success: true, id: userId };
}

export function markWelcomeEmailSent(userId) {
  const database = getAuthDb();
  database.prepare('UPDATE users SET welcome_email_sent = 1 WHERE id = ?').run(userId);
}

export function isWelcomeEmailSent(userId) {
  const database = getAuthDb();
  const row = database.prepare('SELECT welcome_email_sent FROM users WHERE id = ?').get(userId);
  return Boolean(row?.welcome_email_sent);
}

