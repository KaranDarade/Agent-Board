import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { getDbPath, openDb } from './db.js';
import { scanCursorSessions } from './scanners/cursor.js';

const STATE_FILE = path.join(process.cwd(), 'server', 'fleet-state.json');

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { archived: [], directives: [], customModes: {}, customModels: {} };
  }
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    s.customModes = s.customModes || {};
    s.customModels = s.customModels || {};
    return s;
  } catch (e) {
    return { archived: [], directives: [], customModes: {}, customModels: {} };
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save fleet-state.json:', e.message);
  }
}

// Generate OpenCode formatted session ID: ses_<timestamp_hex><random_14_alphanumeric>
export function generateSessionId() {
  const timeHex = Date.now().toString(36);
  const randomChars = crypto.randomBytes(9).toString('base64')
    .replace(/[+/=]/g, 'a')
    .substring(0, 14);
  return `ses_${timeHex}${randomChars}`;
}

// Model Catalog presets
export const MODEL_CATALOG = [
  { id: 'deepseek-v4.1-flash', name: 'DeepSeek v4.1 Flash', providerID: 'opencode-go', variant: 'default', tag: 'Fast & Light' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek v4 Pro', providerID: 'opencode-go', variant: 'high', tag: 'Heavy Reasoning' },
  { id: 'glm-5.3-flash', name: 'GLM-5.3 Flash', providerID: 'opencode-go', variant: 'default', tag: 'General Fast' },
  { id: 'kimi-k3', name: 'Kimi k3', providerID: 'opencode-go', variant: 'high', tag: 'Long Context' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', providerID: 'anthropic', variant: 'high', tag: 'Top Coding' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', providerID: 'anthropic', variant: 'high', tag: 'Advanced Agentic' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', providerID: 'google', variant: 'default', tag: 'Google Flash' },
  { id: 'gpt-4o', name: 'GPT-4o', providerID: 'openai', variant: 'default', tag: 'OpenAI Flagship' }
];

// Create a new session in OpenCode DB
export function createNewSession({ title, directory, agentRole = 'plan', modelObj, initialTasks = [] }) {
  const db = openDb(false);
  const sessionId = generateSessionId();
  const now = Date.now();

  const finalDir = directory && directory.trim() ? directory.trim() : path.join(os.homedir(), 'Desktop');
  const dirBasename = path.basename(finalDir) || 'Project';

  const finalModel = modelObj && modelObj.id 
    ? { id: modelObj.id, providerID: modelObj.providerID || 'opencode-go', variant: modelObj.variant || 'default' }
    : { id: 'deepseek-v4.1-flash', providerID: 'opencode-go', variant: 'default' };

  const slugAdjectives = ['brave', 'swift', 'clever', 'silent', 'bright', 'noble', 'rapid', 'dynamic', 'stellar', 'tidy', 'jolly'];
  const slugNouns = ['falcon', 'circuit', 'comet', 'otter', 'eagle', 'meadow', 'river', 'beacon', 'spark', 'nexus'];
  const generatedSlug = `${slugAdjectives[Math.floor(Math.random() * slugAdjectives.length)]}-${slugNouns[Math.floor(Math.random() * slugNouns.length)]}-${sessionId.slice(-4)}`;

  try {
    const insertSession = db.prepare(`
      INSERT INTO session (
        id, project_id, slug, directory, title, agent, model, 
        cost, tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write,
        version, time_created, time_updated, time_archived
      ) VALUES (
        ?, 'global', ?, ?, ?, ?, ?, 
        0, 0, 0, 0, 0, 0,
        '1.0', ?, ?, NULL
      )
    `);

    insertSession.run(
      sessionId,
      generatedSlug,
      finalDir,
      title || `Task in ${dirBasename}`,
      agentRole,
      JSON.stringify(finalModel),
      now,
      now
    );

    // Insert initial tasks if present
    if (Array.isArray(initialTasks) && initialTasks.length > 0) {
      const insertTodo = db.prepare(`
        INSERT INTO todo (session_id, content, status, priority, position, time_created, time_updated)
        VALUES (?, ?, 'pending', ?, ?, ?, ?)
      `);

      initialTasks.forEach((task, idx) => {
        const content = typeof task === 'string' ? task : (task.content || '');
        const priority = typeof task === 'object' && task.priority ? task.priority : 'medium';
        if (content.trim()) {
          insertTodo.run(sessionId, content.trim(), priority, idx, now, now);
        }
      });
    }

    return {
      id: sessionId,
      tool: 'opencode',
      toolName: 'OpenCode',
      title: title || `Task in ${dirBasename}`,
      directory: finalDir,
      projectName: dirBasename,
      role: agentRole,
      model: finalModel.id,
      modelParsed: finalModel,
      provider: finalModel.providerID,
      variant: finalModel.variant,
      status: 'idle',
      cost: 0,
      tokens: { input: 0, output: 0, reasoning: 0, cacheRead: 0, total: 0 },
      timeCreated: now,
      timeUpdated: now,
      timeArchived: null,
      initialTasksCount: initialTasks.length
    };
  } finally {
    db.close();
  }
}

// Switch Mode: 'plan' vs 'build'
export function updateSessionMode(sessionId, mode) {
  const validModes = ['plan', 'build', 'explore', 'general'];
  const newMode = validModes.includes(mode) ? mode : 'build';
  const now = Date.now();

  const state = loadState();
  state.customModes = state.customModes || {};
  state.customModes[sessionId] = newMode;
  saveState(state);

  // If in OpenCode DB, update directly
  try {
    const db = openDb(false);
    try {
      db.prepare('UPDATE session SET agent = ?, time_updated = ? WHERE id = ?').run(newMode, now, sessionId);
    } finally {
      db.close();
    }
  } catch (e) {
    // Session may belong to another engine
  }

  return { success: true, id: sessionId, role: newMode };
}

// Allocate / Reallocate Model
export function updateSessionModel(sessionId, modelObj) {
  const now = Date.now();
  const finalModel = {
    id: modelObj?.id || 'deepseek-v4.1-flash',
    providerID: modelObj?.providerID || 'opencode-go',
    variant: modelObj?.variant || 'default'
  };

  const state = loadState();
  state.customModels = state.customModels || {};
  state.customModels[sessionId] = finalModel;
  saveState(state);

  try {
    const db = openDb(false);
    try {
      db.prepare('UPDATE session SET model = ?, time_updated = ? WHERE id = ?')
        .run(JSON.stringify(finalModel), now, sessionId);
    } finally {
      db.close();
    }
  } catch (e) {
    // Session may belong to another engine
  }

  return { success: true, id: sessionId, model: finalModel.id, modelParsed: finalModel };
}

// Task / Todo Management
export function addSessionTask(sessionId, { content, priority = 'medium' }) {
  if (!content || !content.trim()) throw new Error('Task content is required');

  const now = Date.now();
  const db = openDb(false);
  try {
    const maxPosRow = db.prepare('SELECT MAX(position) as m FROM todo WHERE session_id = ?').get(sessionId);
    const position = (maxPosRow?.m ?? -1) + 1;

    db.prepare(`
      INSERT INTO todo (session_id, content, status, priority, position, time_created, time_updated)
      VALUES (?, ?, 'pending', ?, ?, ?, ?)
    `).run(sessionId, content.trim(), priority, position, now, now);

    return {
      session_id: sessionId,
      content: content.trim(),
      status: 'pending',
      priority,
      position,
      time_created: now,
      time_updated: now
    };
  } finally {
    db.close();
  }
}

export function updateSessionTask(sessionId, taskIdentifier, { status, priority, content }) {
  const now = Date.now();
  const db = openDb(false);
  try {
    // Update by position or content match
    const existing = db.prepare(`
      SELECT rowid, * FROM todo 
      WHERE session_id = ? AND (position = ? OR content = ?)
      LIMIT 1
    `).get(sessionId, taskIdentifier, taskIdentifier);

    if (!existing) throw new Error('Task not found');

    const newStatus = status !== undefined ? status : existing.status;
    const newPriority = priority !== undefined ? priority : existing.priority;
    const newContent = content !== undefined ? content : existing.content;

    db.prepare(`
      UPDATE todo 
      SET status = ?, priority = ?, content = ?, time_updated = ?
      WHERE rowid = ?
    `).run(newStatus, newPriority, newContent, now, existing.rowid);

    return {
      ...existing,
      status: newStatus,
      priority: newPriority,
      content: newContent,
      time_updated: now
    };
  } finally {
    db.close();
  }
}

export function deleteSessionTask(sessionId, taskIdentifier) {
  const db = openDb(false);
  try {
    db.prepare(`
      DELETE FROM todo 
      WHERE session_id = ? AND (position = ? OR content = ?)
    `).run(sessionId, taskIdentifier, taskIdentifier);

    return { success: true, sessionId, taskIdentifier };
  } finally {
    db.close();
  }
}

// Get all known project workspace directories across OpenCode & Cursor
export function getKnownWorkspaces() {
  const workspacesMap = new Map();

  // 1. OpenCode DB directories
  try {
    const db = openDb(true);
    try {
      const rows = db.prepare(`
        SELECT directory, COUNT(*) as c 
        FROM session 
        WHERE directory IS NOT NULL AND directory != ''
        GROUP BY directory
        ORDER BY c DESC
      `).all();

      for (const r of rows) {
        if (r.directory && fs.existsSync(r.directory)) {
          workspacesMap.set(r.directory, {
            path: r.directory,
            name: path.basename(r.directory) || r.directory,
            count: r.c,
            source: 'OpenCode'
          });
        }
      }
    } finally {
      db.close();
    }
  } catch (e) {}

  // 2. Cursor workspaces
  try {
    const cursorSessions = scanCursorSessions();
    for (const c of cursorSessions) {
      if (c.directory && fs.existsSync(c.directory) && !workspacesMap.has(c.directory)) {
        workspacesMap.set(c.directory, {
          path: c.directory,
          name: c.projectName || path.basename(c.directory),
          count: 1,
          source: 'Cursor'
        });
      }
    }
  } catch (e) {}

  return Array.from(workspacesMap.values());
}
