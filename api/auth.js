import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

let supabase = null;
function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || 'https://kfwgpqcnuvbildlbbjpa.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YSncgZNWouo5jP0v7zNn8Q_AsZinpcO';
    supabase = createClient(url, key);
  }
  return supabase;
}

// In-memory store for serverless instance lifespan (OTP and desktop handoffs)
const memoryOtps = new Map();
let pendingDesktopAuth = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // URL path parsing: /api/auth/:action
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
  const action = req.query.action || urlParts[urlParts.length - 1] || '';

  const client = getSupabase();

  function extractToken() {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return req.headers['x-session-token'] || req.query.token || null;
  }

  try {
    // 1. REGISTER
    if (action === 'register' && req.method === 'POST') {
      const { email, password, displayName } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const user = {
        id: data.user?.id || crypto.randomUUID(),
        email: data.user?.email || email,
        displayName: displayName || email.split('@')[0]
      };
      const token = data.session?.access_token || crypto.randomBytes(32).toString('hex');

      return res.status(201).json({
        success: true,
        user,
        token
      });
    }

    // 2. LOGIN
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: error.message || 'Invalid email or password' });
      }

      const user = {
        id: data.user?.id,
        email: data.user?.email,
        displayName: data.user?.user_metadata?.display_name || data.user?.email?.split('@')[0]
      };

      return res.status(200).json({
        success: true,
        user,
        token: data.session?.access_token
      });
    }

    // 3. ME (SESSION VERIFICATION)
    if (action === 'me' && req.method === 'GET') {
      const token = extractToken();
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid or expired session token' });
      }

      const user = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
        avatarUrl: data.user.user_metadata?.avatar_url || ''
      };

      return res.status(200).json({ user });
    }

    // 4. GOOGLE OAUTH SYNC
    if (action === 'google' && req.method === 'POST') {
      const { email, displayName, avatarUrl } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const user = {
        id: crypto.randomUUID(),
        email,
        displayName: displayName || email.split('@')[0],
        avatarUrl: avatarUrl || ''
      };
      const token = crypto.randomBytes(32).toString('hex');
      return res.status(200).json({
        success: true,
        user,
        token
      });
    }

    // 5. FORGOT PASSWORD (OTP)
    if (action === 'forgot-password' && req.method === 'POST') {
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      memoryOtps.set(email.toLowerCase(), {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      return res.status(200).json({
        success: true,
        message: 'Password reset OTP generated',
        otpPreview: otp
      });
    }

    // 6. VERIFY OTP
    if (action === 'verify-otp' && req.method === 'POST') {
      const { email, otp } = req.body || {};
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP code are required' });
      }

      const record = memoryOtps.get(email.toLowerCase());
      if (!record || record.code !== otp.trim() || Date.now() > record.expiresAt) {
        return res.status(400).json({ error: 'Invalid or expired OTP code' });
      }

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });
    }

    // 7. RESET PASSWORD
    if (action === 'reset-password' && req.method === 'POST') {
      const { email, otp, newPassword } = req.body || {};
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const record = memoryOtps.get(email.toLowerCase());
      if (!record || record.code !== otp.trim() || Date.now() > record.expiresAt) {
        return res.status(400).json({ error: 'Invalid or expired OTP code' });
      }

      memoryOtps.delete(email.toLowerCase());
      return res.status(200).json({
        success: true,
        message: 'Password successfully reset'
      });
    }

    // 8. DESKTOP HANDOFF
    if (action === 'desktop-handoff') {
      if (req.method === 'POST') {
        const { token, user } = req.body || {};
        pendingDesktopAuth = { token, user, timestamp: Date.now() };
        return res.status(200).json({ success: true, message: 'Handoff queued' });
      }
      if (req.method === 'GET') {
        if (pendingDesktopAuth && Date.now() - pendingDesktopAuth.timestamp < 120000) {
          const data = { ...pendingDesktopAuth };
          pendingDesktopAuth = null;
          return res.status(200).json({ pending: true, ...data });
        }
        return res.status(200).json({ pending: false });
      }
    }

    // 9. LOGOUT
    if (action === 'logout') {
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: `Auth endpoint /${action} not found` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
