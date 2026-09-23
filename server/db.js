import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const DEFAULT_DB_PATH = path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db');

export function getDbPath() {
  if (process.env.OPENCODE_DB_PATH && fs.existsSync(process.env.OPENCODE_DB_PATH)) {
    return process.env.OPENCODE_DB_PATH;
  }
  const candidatePaths = [
    DEFAULT_DB_PATH,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'opencode', 'opencode.db') : null,
    process.env.APPDATA ? path.join(process.env.APPDATA, 'opencode', 'opencode.db') : null
  ].filter(Boolean);

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return DEFAULT_DB_PATH;
}

export function openDb(readOnly = false) {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`OpenCode database not found at ${dbPath}`);
  }
  return new DatabaseSync(dbPath, { readOnly });
}

export function parseModel(modelStr) {
  if (!modelStr) return { id: 'unknown', providerID: 'unknown', variant: 'default' };
  try {
    if (typeof modelStr === 'object') return modelStr;
    return JSON.parse(modelStr);
  } catch (e) {
    return { id: modelStr, providerID: 'custom', variant: 'default' };
  }
}

export function computeStatus(session) {
  if (session.time_archived) return 'archived';
  const now = Date.now();
  const diffMinutes = (now - session.time_updated) / (1000 * 60);
  if (diffMinutes <= 20) return 'active';
  return 'idle';
}

export function getAllSessions(filters = {}) {
  const db = openDb(true);
  try {
    const query = `
      SELECT 
        s.id,
        s.project_id,
        s.parent_id,
        s.slug,
        s.directory,
        s.title,
        s.agent,
        s.model,
        s.cost,
        s.tokens_input,
        s.tokens_output,
        s.tokens_reasoning,
        s.tokens_cache_read,
        s.tokens_cache_write,
        s.time_created,
        s.time_updated,
        s.time_archived,
        p.name AS project_name
      FROM session s
      LEFT JOIN project p ON s.project_id = p.id
      ORDER BY s.time_updated DESC
    `;
    const rows = db.prepare(query).all();

    return rows.map(r => {
      const parsedModel = parseModel(r.model);
      const status = computeStatus(r);
      const directoryBasename = r.directory ? path.basename(r.directory) : 'Global';

      return {
        ...r,
        modelParsed: parsedModel,
        status,
        projectName: r.project_name || directoryBasename,
        agentRole: r.agent || 'general',
        cost: Number(r.cost || 0),
        tokens: {
          input: Number(r.tokens_input || 0),
          output: Number(r.tokens_output || 0),
          reasoning: Number(r.tokens_reasoning || 0),
          cacheRead: Number(r.tokens_cache_read || 0),
          cacheWrite: Number(r.tokens_cache_write || 0),
          total: Number(r.tokens_input || 0) + Number(r.tokens_output || 0)
        }
      };
    }).filter(s => {
      if (filters.status && filters.status !== 'all' && s.status !== filters.status) return false;
      if (filters.role && filters.role !== 'all' && s.agentRole !== filters.role) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = (s.title || '').toLowerCase().includes(query);
        const matchDir = (s.directory || '').toLowerCase().includes(query);
        const matchModel = (s.modelParsed.id || '').toLowerCase().includes(query);
        const matchId = s.id.toLowerCase().includes(query);
        if (!matchTitle && !matchDir && !matchModel && !matchId) return false;
      }
      return true;
    });
  } finally {
    db.close();
  }
}

export function getSessionDetail(id) {
  const db = openDb(true);
  try {
    const session = db.prepare(`
      SELECT 
        s.*, 
        p.name AS project_name
      FROM session s
      LEFT JOIN project p ON s.project_id = p.id
      WHERE s.id = ?
    `).get(id);

    if (!session) return null;

    const todos = db.prepare(`
      SELECT * FROM todo 
      WHERE session_id = ? 
      ORDER BY position ASC, time_created ASC
    `).all(id);

    // Always fetch the most recent messages (up to 300) in chronological order
    const messages = db.prepare(`
      SELECT * FROM (
        SELECT id, session_id, time_created, time_updated, data 
        FROM message 
        WHERE session_id = ? 
        ORDER BY time_created DESC 
        LIMIT 300
      ) ORDER BY time_created ASC
    `).all(id).map(m => {
      let parsedData = null;
      try { parsedData = JSON.parse(m.data); } catch (e) { parsedData = { raw: m.data }; }
      return { ...m, dataParsed: parsedData };
    });

    // Always fetch the most recent parts (up to 500) in chronological order
    const parts = db.prepare(`
      SELECT * FROM (
        SELECT id, message_id, session_id, time_created, time_updated, data 
        FROM part 
        WHERE session_id = ? 
        ORDER BY time_created DESC 
        LIMIT 500
      ) ORDER BY time_created ASC
    `).all(id).map(p => {
      let parsedData = null;
      try { parsedData = JSON.parse(p.data); } catch (e) { parsedData = { raw: p.data }; }
      return { ...p, dataParsed: parsedData };
    });

    return {
      ...session,
      modelParsed: parseModel(session.model),
      status: computeStatus(session),
      agentRole: session.agent || 'general',
      cost: Number(session.cost || 0),
      todos,
      messages,
      parts
    };
  } finally {
    db.close();
  }
}

export function deactivateSession(id) {
  const db = openDb(false);
  try {
    const now = Date.now();
    db.prepare('UPDATE session SET time_archived = ?, time_updated = ? WHERE id = ?').run(now, now, id);
    return { success: true, id, status: 'archived', time_archived: now };
  } finally {
    db.close();
  }
}

export function activateSession(id) {
  const db = openDb(false);
  try {
    const now = Date.now();
    db.prepare('UPDATE session SET time_archived = NULL, time_updated = ? WHERE id = ?').run(now, id);
    return { success: true, id, status: 'active' };
  } finally {
    db.close();
  }
}

export function deleteSession(id) {
  const db = openDb(false);
  try {
    const childTables = [
      'todo',
      'part',
      'message',
      'session_message',
      'session_input',
      'session_context_epoch',
      'permission',
      'session_share'
    ];
    for (const table of childTables) {
      try {
        db.prepare(`DELETE FROM ${table} WHERE session_id = ?`).run(id);
      } catch (e) {
        // Table may not have session_id column or may not exist
      }
    }
    db.prepare('DELETE FROM session WHERE id = ?').run(id);
    return { success: true, id };
  } finally {
    db.close();
  }
}

export function getFleetStats() {
  const allSessions = getAllSessions();
  const now = Date.now();

  let activeCount = 0;
  let idleCount = 0;
  let archivedCount = 0;
  let totalCost = 0;
  let totalTokensInput = 0;
  let totalTokensOutput = 0;
  let totalTokensReasoning = 0;
  let totalTokensCacheRead = 0;

  const roleCounts = {};
  const modelCounts = {};
  const projectCounts = {};

  for (const s of allSessions) {
    if (s.status === 'active') activeCount++;
    else if (s.status === 'idle') idleCount++;
    else if (s.status === 'archived') archivedCount++;

    totalCost += s.cost;
    totalTokensInput += s.tokens.input;
    totalTokensOutput += s.tokens.output;
    totalTokensReasoning += s.tokens.reasoning;
    totalTokensCacheRead += s.tokens.cacheRead;

    const role = s.agentRole || 'general';
    roleCounts[role] = (roleCounts[role] || 0) + 1;

    const modelName = s.modelParsed?.id || 'unknown';
    modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;

    const proj = s.projectName || 'Default';
    projectCounts[proj] = (projectCounts[proj] || 0) + 1;
  }

  return {
    totalSessions: allSessions.length,
    activeSessions: activeCount,
    idleSessions: idleCount,
    archivedSessions: archivedCount,
    totalCost: Number(totalCost.toFixed(4)),
    totalTokens: totalTokensInput + totalTokensOutput,
    tokensBreakdown: {
      input: totalTokensInput,
      output: totalTokensOutput,
      reasoning: totalTokensReasoning,
      cacheRead: totalTokensCacheRead
    },
    roleDistribution: roleCounts,
    modelDistribution: modelCounts,
    projectDistribution: projectCounts
  };
}
