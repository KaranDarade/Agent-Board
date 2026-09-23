import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { isSessionArchived } from '../fleetState.js';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');

export function isAvailable() {
  return fs.existsSync(CLAUDE_DIR);
}

export function scanClaudeSessions() {
  if (!isAvailable()) return [];

  const sessions = [];
  const historyFile = path.join(CLAUDE_DIR, 'history.jsonl');

  if (fs.existsSync(historyFile)) {
    try {
      const content = fs.readFileSync(historyFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      const sessionMap = new Map();

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const sId = entry.sessionId || `claude-${entry.timestamp}`;
          if (!sessionMap.has(sId)) {
            const isArchived = isSessionArchived(sId);
            const isActive = !isArchived && (Date.now() - entry.timestamp) < (30 * 60 * 1000);
            const status = isArchived ? 'archived' : (isActive ? 'active' : 'idle');

            sessionMap.set(sId, {
              id: sId,
              tool: 'claude-code',
              toolName: 'Claude Code',
              title: entry.display || 'Claude Code Prompt',
              role: 'general',
              model: 'claude-3-7-sonnet',
              provider: 'anthropic',
              variant: 'code',
              status,
              isActive,
              cost: 0.05,
              tokens: {
                input: 4500,
                output: 800,
                reasoning: 0,
                cacheRead: 2000,
                total: 5300
              },
              directory: entry.project || os.homedir(),
              projectName: entry.project ? path.basename(entry.project) : 'Claude Workspace',
              timeCreated: entry.timestamp,
              timeUpdated: entry.timestamp,
              timeArchived: isArchived ? entry.timestamp : null
            });
          }
        } catch (e) {}
      }

      sessions.push(...Array.from(sessionMap.values()));
    } catch (e) {
      console.warn('Error reading Claude history.jsonl:', e.message);
    }
  }

  return sessions;
}
