import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { isSessionArchived } from '../fleetState.js';

const OPENCODE_DB = path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db');

export function isAvailable() {
  return fs.existsSync(OPENCODE_DB);
}

export function parseModel(modelStr) {
  if (!modelStr) return { id: 'unknown', providerID: 'opencode', variant: 'default' };
  try {
    if (typeof modelStr === 'object') return modelStr;
    return JSON.parse(modelStr);
  } catch (e) {
    return { id: modelStr, providerID: 'custom', variant: 'default' };
  }
}

export function computeStatus(session) {
  if (session.time_archived || isSessionArchived(session.id)) return 'archived';
  const now = Date.now();
  const diffMinutes = (now - session.time_updated) / (1000 * 60);
  if (diffMinutes <= 20) return 'active';
  return 'idle';
}

export function scanOpenCodeSessions() {
  if (!isAvailable()) return [];

  const db = new DatabaseSync(OPENCODE_DB, { readOnly: true });
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
        id: r.id,
        tool: 'opencode',
        toolName: 'OpenCode',
        parentId: r.parent_id,
        title: r.title || 'Untitled OpenCode Session',
        role: r.agent || 'general',
        model: parsedModel.id,
        provider: parsedModel.providerID || 'opencode',
        variant: parsedModel.variant || 'default',
        status,
        isActive: status === 'active',
        cost: Number(r.cost || 0),
        tokens: {
          input: Number(r.tokens_input || 0),
          output: Number(r.tokens_output || 0),
          reasoning: Number(r.tokens_reasoning || 0),
          cacheRead: Number(r.tokens_cache_read || 0),
          total: Number(r.tokens_input || 0) + Number(r.tokens_output || 0)
        },
        directory: r.directory || '',
        projectName: r.project_name || directoryBasename,
        timeCreated: r.time_created,
        timeUpdated: r.time_updated,
        timeArchived: r.time_archived || (isSessionArchived(r.id) ? r.time_updated : null)
      };
    });
  } catch (err) {
    console.error('Error scanning OpenCode:', err.message);
    return [];
  } finally {
    db.close();
  }
}
