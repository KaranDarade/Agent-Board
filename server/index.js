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

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

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

// 404 fallback for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve client dist in production or standalone mode
const clientDistCandidates = [
  path.join(process.cwd(), 'client', 'dist'),
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(process.resourcesPath || '', 'app.asar', 'client', 'dist')
];
const clientDistPath = clientDistCandidates.find(p => fs.existsSync(p));
if (clientDistPath) {
  app.use(express.static(clientDistPath));
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
  
  // Start 24/7 cloud sync bridge if Supabase is configured
  startCloudBridge(5000);
});
