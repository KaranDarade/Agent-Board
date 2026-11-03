import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
  getFleetStats, 
  getAllSessions, 
  getSessionDetail, 
  deleteSession,
  getDbPath
} from './db.js';
import { 
  getAllFleetSessions, 
  getUniversalFleetStats, 
  getDiscoveredTools 
} from './scanners/index.js';
import {
  archiveFleetSession,
  reactivateFleetSession,
  executeSteeringDirective,
  getFleetDirectives
} from './fleetState.js';
import {
  createNewSession,
  updateSessionMode,
  updateSessionModel,
  addSessionTask,
  updateSessionTask,
  deleteSessionTask,
  getKnownWorkspaces,
  MODEL_CATALOG
} from './sessionManager.js';
import {
  startCloudBridge,
  getCloudStatus
} from './cloudBridge.js';
import {
  createUser,
  verifyUserPassword,
  createOrLoginGoogleUser,
  createSession as createAuthSession,
  getUserByToken,
  deleteSession as deleteAuthSession,
  generatePasswordOtp,
  verifyPasswordOtp,
  resetPasswordWithOtp,
  updateUserProfile,
  changeUserPassword,
  deleteUser,
  markWelcomeEmailSent
} from './userDb.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail
} from './emailService.js';

// Auto-load .env
function loadEnv() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env')
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch (e) {}
    }
  }
}
loadEnv();

function saveEnvVar(key, val) {
  const envPath = path.join(process.cwd(), '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${val}`);
  } else {
    content = content.trimEnd() + `\n${key}=${val}\n`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
  process.env[key] = val;
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Serve client dist in production or standalone mode
const clientDistCandidates = [
  path.join(process.cwd(), 'client', 'dist'),
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(process.resourcesPath || '', 'app.asar', 'client', 'dist')
];
const clientDistPath = clientDistCandidates.find(p => fs.existsSync(p));
if (clientDistPath) {
  app.use(express.static(clientDistPath, {
    maxAge: '1d',
    etag: true
  }));
}

// Helper to get local network IPv4 address for mobile access
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LOCAL_IP = getLocalNetworkIp();

// SSE Clients
const clients = new Set();

export function broadcastEvent(eventType, payload) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try {
      res.write(message);
    } catch (e) {
      clients.delete(res);
    }
  }
}

// Watch opencode.db directory for external changes
try {
  const dbDir = path.dirname(getDbPath());
  let debounceTimeout = null;
  fs.watch(dbDir, (eventType, filename) => {
    if (filename && filename.startsWith('opencode.db')) {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        try {
          const stats = getUniversalFleetStats();
          broadcastEvent('fleet_updated', { stats, timestamp: Date.now() });
        } catch (e) {}
      }, 500);
    }
  });
} catch (e) {
  console.warn('Could not set up file watcher on db directory:', e.message);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: Date.now(),
    uptime: process.uptime()
  });
});

// Network info for mobile access
app.get('/api/network', (req, res) => {
  res.json({
    localIp: LOCAL_IP,
    port: PORT,
    mobileUrl: `http://${LOCAL_IP}:${PORT}`,
    hostname: os.hostname(),
    platform: os.platform()
  });
});

// Download desktop installer for Windows
app.get('/api/download/desktop', (req, res) => {
  const distCandidates = [
    path.join(process.cwd(), 'dist-desktop'),
    path.join(__dirname, '..', 'dist-desktop')
  ];
  for (const distDir of distCandidates) {
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      const setupFile = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
      const exeFile = setupFile || files.find(f => f.endsWith('.exe') && !f.includes('blockmap'));
      if (exeFile) {
        const fullPath = path.join(distDir, exeFile);
        return res.download(fullPath, exeFile);
      }
    }
  }
  res.status(404).json({
    error: 'Desktop installer is currently being compiled. Run npm run dist to package the installer.',
    status: 'pending_build'
  });
});

// Discovered tools status
app.get('/api/tools', (req, res) => {
  res.json(getDiscoveredTools());
});

// Cloud Sync Status (Supabase Bridge)
app.get('/api/cloud/status', (req, res) => {
  res.json(getCloudStatus());
});

// Known workspaces across OpenCode & Cursor
app.get('/api/workspaces', (req, res) => {
  try {
    const workspaces = getKnownWorkspaces();
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Curated Model Catalog
app.get('/api/models', (req, res) => {
  res.json(MODEL_CATALOG);
});

// Create new session (Option B: initialized ready for review)
app.post('/api/sessions/create', (req, res) => {
  try {
    const { title, directory, agentRole, modelObj, initialTasks } = req.body;
    const session = createNewSession({ title, directory, agentRole, modelObj, initialTasks });
    broadcastEvent('session_created', { session });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Switch session mode ('plan' vs 'build')
app.post('/api/sessions/:id/mode', (req, res) => {
  try {
    const { mode } = req.body;
    const result = updateSessionMode(req.params.id, mode);
    broadcastEvent('session_mode_changed', { id: req.params.id, mode });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Allocate / Reallocate model
app.post('/api/sessions/:id/model', (req, res) => {
  try {
    const { modelObj } = req.body;
    const result = updateSessionModel(req.params.id, modelObj);
    broadcastEvent('session_model_changed', { id: req.params.id, model: modelObj });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add task to session
app.post('/api/sessions/:id/tasks', (req, res) => {
  try {
    const { content, priority } = req.body;
    const task = addSessionTask(req.params.id, { content, priority });
    broadcastEvent('task_added', { sessionId: req.params.id, task });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task in session (status, priority, content)
app.patch('/api/sessions/:id/tasks/:taskIdentifier', (req, res) => {
  try {
    const { status, priority, content } = req.body;
    const task = updateSessionTask(req.params.id, req.params.taskIdentifier, { status, priority, content });
    broadcastEvent('task_updated', { sessionId: req.params.id, task });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task from session
app.delete('/api/sessions/:id/tasks/:taskIdentifier', (req, res) => {
  try {
    const result = deleteSessionTask(req.params.id, req.params.taskIdentifier);
    broadcastEvent('task_deleted', { sessionId: req.params.id, taskIdentifier: req.params.taskIdentifier });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Universal Fleet Stats
app.get('/api/fleet/stats', (req, res) => {
  try {
    const stats = getUniversalFleetStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Universal Fleet Sessions (all tools combined)
app.get('/api/fleet/sessions', (req, res) => {
  try {
    const { tool, status, role, search } = req.query;
    const sessions = getAllFleetSessions({ tool, status, role, search });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy / Direct routes
app.get('/api/stats', (req, res) => {
  try {
    const stats = getUniversalFleetStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions', (req, res) => {
  try {
    const { tool, status, role, search } = req.query;
    const sessions = getAllFleetSessions({ tool, status, role, search });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions/:id', (req, res) => {
  try {
    const all = getAllFleetSessions();
    const found = all.find(s => s.id === req.params.id);

    if (found?.tool === 'opencode') {
      const detail = getSessionDetail(req.params.id);
      if (detail) {
        return res.json({
          ...detail,
          directives: getFleetDirectives(req.params.id)
        });
      }
    }

    if (!found) return res.status(404).json({ error: 'Session not found' });
    res.json({
      ...found,
      directives: getFleetDirectives(req.params.id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Universal Deactivate (works on OpenCode, Antigravity, Cursor, Claude Code)
app.post('/api/sessions/:id/deactivate', (req, res) => {
  try {
    const { tool } = req.body || {};
    const all = getAllFleetSessions();
    const session = all.find(s => s.id === req.params.id);
    const sessionTool = tool || session?.tool || 'opencode';

    const result = archiveFleetSession(req.params.id, sessionTool);
    broadcastEvent('session_deactivated', { id: req.params.id, tool: sessionTool });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Universal Reactivate
app.post('/api/sessions/:id/activate', (req, res) => {
  try {
    const { tool } = req.body || {};
    const all = getAllFleetSessions();
    const session = all.find(s => s.id === req.params.id);
    const sessionTool = tool || session?.tool || 'opencode';

    const result = reactivateFleetSession(req.params.id, sessionTool);
    broadcastEvent('session_activated', { id: req.params.id, tool: sessionTool });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete session (OpenCode supported)
app.delete('/api/sessions/:id', (req, res) => {
  try {
    const result = deleteSession(req.params.id);
    broadcastEvent('session_deleted', { id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Steer / Manual prompt directive with non-blocking execution & live SSE streaming
app.post('/api/sessions/:id/prompt', (req, res) => {
  const { prompt } = req.body;
  const sessionId = req.params.id;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const all = getAllFleetSessions();
    const session = all.find(s => s.id === sessionId);

    // Launch steering directive
    const directive = executeSteeringDirective(
      sessionId,
      prompt.trim(),
      session,
      (logChunk) => {
        broadcastEvent('directive_chunk', { sessionId, chunk: logChunk });
      },
      (err, resultDirective) => {
        broadcastEvent('directive_completed', { sessionId, directive: resultDirective });
        try {
          const stats = getUniversalFleetStats();
          broadcastEvent('fleet_updated', { stats, sessionId, timestamp: Date.now() });
        } catch (e) {}
      }
    );

    // Return immediate response with initial directive record so UI never hangs
    res.json({
      success: true,
      status: 'dispatched',
      directiveId: directive.id,
      message: `Directive dispatched to ${session?.toolName || 'agent'} engine.`,
      directive
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SSE Live Stream
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.add(res);

  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now(), ip: LOCAL_IP })}\n\n`);

  req.on('close', () => {
    clients.delete(res);
  });
});

// ====================================================
// AUTHENTICATION & USER MANAGEMENT ROUTES (CRUD + OTP)
// ====================================================

let pendingDesktopAuth = null;

// Desktop Handoff: Post token from browser
app.post('/api/auth/desktop-handoff', (req, res) => {
  const { token, user } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });
  pendingDesktopAuth = {
    token,
    user,
    timestamp: Date.now()
  };
  broadcastEvent('desktop_auth_ready', { token, user });
  res.json({ success: true, message: 'Token queued for desktop handoff' });
});

// Desktop Handoff: Poll or check from desktop Electron
app.get('/api/auth/desktop-handoff', (req, res) => {
  if (pendingDesktopAuth && Date.now() - pendingDesktopAuth.timestamp < 120000) {
    const data = { ...pendingDesktopAuth };
    pendingDesktopAuth = null; // consume token
    return res.json({ pending: true, ...data });
  }
  res.json({ pending: false });
});

function extractAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return req.headers['x-session-token'] || req.query.token || null;
}

// Register new user (Email + Password)
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    const user = createUser({ email, password, displayName });
    const session = createAuthSession(user.id);

    // Send Welcome Email in background with comprehensive guide
    sendWelcomeEmail({ email: user.email, displayName: user.displayName })
      .then(() => markWelcomeEmailSent(user.id))
      .catch((err) => console.error('[Register] Welcome email send error:', err.message));

    res.status(201).json({
      success: true,
      user,
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login (Email + Password)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = verifyUserPassword(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const session = createAuthSession(user.id);
    res.json({
      success: true,
      user,
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// REAL DIRECT GOOGLE OAUTH 2.0 INTEGRATION
// ====================================================

// Google OAuth Configuration status
app.get('/api/auth/google/config', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || null;
  res.json({
    configured: Boolean(clientId),
    clientId: clientId ? `${clientId.slice(0, 16)}...` : null
  });
});

// Update Google OAuth Configuration in .env
app.post('/api/auth/google/config', (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    if (!clientId || !clientId.trim()) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    saveEnvVar('GOOGLE_CLIENT_ID', clientId.trim());
    if (clientSecret && clientSecret.trim()) {
      saveEnvVar('GOOGLE_CLIENT_SECRET', clientSecret.trim());
    }
    res.json({ success: true, message: 'Google OAuth configuration saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct Google OAuth URL generator
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({
      configured: false,
      error: 'Google OAuth is not configured on the server. Please sign in with email and password.'
    });
  }
  const redirectUri = `http://localhost:${PORT}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });
  res.json({
    configured: true,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  });
});

// Direct Google OAuth Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.redirect(`/?auth_error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.redirect(`/?auth_error=No_authorization_code_received`);
  }

  try {
    const redirectUri = `http://localhost:${PORT}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code with Google');
    }

    // Retrieve verified real user profile from Google UserInfo endpoint
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();
    if (!profile.email) {
      throw new Error('Google did not return a verified email address');
    }

    const email = profile.email;
    const displayName = profile.name || profile.given_name || email.split('@')[0];
    const avatarUrl = profile.picture || '';

    const user = createOrLoginGoogleUser({ email, displayName, avatarUrl });
    const session = createAuthSession(user.id);

    // If new user registered via Google, dispatch luxury Welcome Email
    if (user.isNewUser) {
      sendWelcomeEmail({ email: user.email, displayName: user.displayName })
        .then(() => markWelcomeEmailSent(user.id))
        .catch((err) => console.error('[Google OAuth] Welcome email error:', err.message));
    }

    // Queue desktop handoff
    pendingDesktopAuth = { token: session.token, user, timestamp: Date.now() };
    broadcastEvent('desktop_auth_ready', { token: session.token, user });

    // HTML response that handles popup postMessage, web token storage, and desktop deep linking
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Sign-In Successful - Agent Board</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="background:#07090E;color:#D4AF37;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;text-align:center;padding:20px;">
        <div style="background:#0f172a;border:1px solid rgba(212,175,55,0.4);border-radius:16px;padding:32px;max-width:420px;width:100%;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
          <div style="width:48px;height:48px;border-radius:50%;background:#10b981;color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 16px auto;font-size:24px;">✓</div>
          <h2 style="margin:0 0 8px 0;color:#fff;font-size:20px;">Signed in as ${displayName}</h2>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 20px 0;">(${email})</p>
          <p style="color:#D4AF37;font-size:14px;font-weight:600;">Unlocking Agent Board Cockpit...</p>
        </div>
        <iframe src="agentboard://auth?token=${session.token}" style="display:none;"></iframe>
        <script>
          try {
            localStorage.setItem('agent_board_session_token', '${session.token}');
          } catch(e) {}
          if (window.opener) {
            try {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                token: '${session.token}',
                user: ${JSON.stringify(user)}
              }, '*');
              setTimeout(function() { window.close(); }, 500);
            } catch (err) {
              window.location.href = '/?auth_success=true&token=${session.token}';
            }
          } else {
            setTimeout(function() {
              window.location.href = '/?auth_success=true&token=${session.token}';
            }, 800);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Google Authentication Error</title></head>
      <body style="background:#07090E;color:#ef4444;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;text-align:center;">
        <h2>Google Authentication Failed</h2>
        <p style="color:#94a3b8;max-width:500px;">${err.message}</p>
        <a href="/" style="color:#D4AF37;margin-top:20px;text-decoration:none;border:1px solid #D4AF37;padding:8px 16px;border-radius:8px;">Return to Agent Board</a>
      </body>
      </html>
    `);
  }
});

// Direct Google Identity Services ID Token verification (One Tap / popup)
app.post('/api/auth/google/verify-credential', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential JWT is required' });
    }

    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!tokenInfoRes.ok) {
      const errData = await tokenInfoRes.json();
      return res.status(401).json({ error: errData.error_description || 'Invalid Google credential token' });
    }

    const payload = await tokenInfoRes.json();
    if (!payload.email) {
      return res.status(400).json({ error: 'Google credential does not contain an email' });
    }

    const email = payload.email;
    const displayName = payload.name || payload.given_name || email.split('@')[0];
    const avatarUrl = payload.picture || '';

    const user = createOrLoginGoogleUser({ email, displayName, avatarUrl });
    const session = createAuthSession(user.id);

    if (user.isNewUser) {
      sendWelcomeEmail({ email: user.email, displayName: user.displayName })
        .then(() => markWelcomeEmailSent(user.id))
        .catch((err) => console.error('[Google Verify] Welcome email error:', err.message));
    }

    pendingDesktopAuth = { token: session.token, user, timestamp: Date.now() };
    broadcastEvent('desktop_auth_ready', { token: session.token, user });

    res.json({
      success: true,
      user,
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth Login / Register (from verified frontend auth providers)
app.post('/api/auth/google', (req, res) => {
  try {
    const { email, displayName, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google Auth' });
    }
    const user = createOrLoginGoogleUser({ email, displayName, avatarUrl });
    const session = createAuthSession(user.id);

    if (user.isNewUser) {
      sendWelcomeEmail({ email: user.email, displayName: user.displayName })
        .then(() => markWelcomeEmailSent(user.id))
        .catch((err) => console.error('[Google Direct] Welcome email error:', err.message));
    }

    res.json({
      success: true,
      user,
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password (Generate & dispatch OTP)
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const result = generatePasswordOtp(email);

    // Dispatch luxury 6-digit OTP recovery email in background
    sendPasswordResetEmail({ email: result.email, otpCode: result.otpPreview })
      .catch((err) => console.error('[Forgot Password] Email send error:', err.message));

    res.json({
      success: true,
      message: `A 6-digit recovery OTP has been sent to ${email}.`,
      email: result.email,
      expiresAt: result.expiresAt,
      otpPreview: result.otpPreview
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }
    const isValid = verifyPasswordOtp(email, otpCode);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password with OTP
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required' });
    }
    resetPasswordWithOtp(email, otpCode, newPassword);
    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Current Authenticated User
app.get('/api/auth/me', (req, res) => {
  const token = extractAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No session token provided' });
  }
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  res.json({ success: true, user });
});

// Update User Profile
app.post('/api/auth/update-profile', (req, res) => {
  const token = extractAuthToken(req);
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const updated = updateUserProfile(user.id, req.body);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Change Password
app.post('/api/auth/change-password', (req, res) => {
  const token = extractAuthToken(req);
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { oldPassword, newPassword } = req.body;
    changeUserPassword(user.id, oldPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Account (Cascade cleanup)
app.post('/api/auth/delete-account', (req, res) => {
  const token = extractAuthToken(req);
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    deleteUser(user.id);
    res.json({ success: true, message: 'Account and associated data deleted permanently' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const token = extractAuthToken(req);
  if (token) deleteAuthSession(token);
  res.json({ success: true, message: 'Logged out successfully' });
});

// 404 fallback for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// SPA fallback for HTML5 routing
if (clientDistPath) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Agent Board running across all interfaces`);
  console.log(`📍 Local Desktop:  http://localhost:${PORT}`);
  console.log(`📱 Mobile (Wi-Fi): http://${LOCAL_IP}:${PORT}`);
  console.log(`======================================================\n`);
  
  // Start 24/7 cloud sync bridge if Supabase is configured (every 30 seconds)
  startCloudBridge(30000);
});
