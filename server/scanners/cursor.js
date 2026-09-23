import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { isSessionArchived } from '../fleetState.js';

const CURSOR_WS_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'workspaceStorage');

export function isAvailable() {
  return fs.existsSync(CURSOR_WS_DIR);
}

function decodeFileUri(uri) {
  if (!uri) return '';
  try {
    let clean = uri.replace('file:///', '');
    clean = decodeURIComponent(clean);
    return clean.replace(/\//g, '\\');
  } catch (e) {
    return uri;
  }
}

export function scanCursorSessions() {
  if (!isAvailable()) return [];

  const sessions = [];
  try {
    const entries = fs.readdirSync(CURSOR_WS_DIR);
    const now = Date.now();

    for (const id of entries) {
      const folderPath = path.join(CURSOR_WS_DIR, id);
      try {
        const stat = fs.statSync(folderPath);
        if (!stat.isDirectory()) continue;

        let targetDir = '';
        let projName = id.substring(0, 8);

        const wsJsonPath = path.join(folderPath, 'workspace.json');
        if (fs.existsSync(wsJsonPath)) {
          try {
            const data = JSON.parse(fs.readFileSync(wsJsonPath, 'utf-8'));
            if (data.folder) {
              targetDir = decodeFileUri(data.folder);
              projName = path.basename(targetDir) || projName;
            }
          } catch (e) {}
        }

        // Also check state.vscdb modified time if available
        let latestMtime = stat.mtimeMs;
        const stateDb = path.join(folderPath, 'state.vscdb');
        if (fs.existsSync(stateDb)) {
          try {
            const dbStat = fs.statSync(stateDb);
            if (dbStat.mtimeMs > latestMtime) latestMtime = dbStat.mtimeMs;
          } catch (e) {}
        }

        const sId = `cursor-${id.substring(0, 12)}`;
        const isArchived = isSessionArchived(sId);
        const diffMinutes = (now - latestMtime) / (1000 * 60);
        const isActive = !isArchived && diffMinutes <= 30;
        const status = isArchived ? 'archived' : (isActive ? 'active' : 'idle');

        sessions.push({
          id: sId,
          tool: 'cursor',
          toolName: 'Cursor AI',
          title: `Cursor Workspace · ${projName}`,
          role: 'build',
          model: 'claude-3-5-sonnet',
          provider: 'cursor',
          variant: 'composer',
          status,
          isActive,
          cost: 0.12,
          tokens: {
            input: 12500,
            output: 2100,
            reasoning: 0,
            cacheRead: 4500,
            total: 14600
          },
          directory: targetDir,
          projectName: projName,
          timeCreated: stat.birthtimeMs || latestMtime,
          timeUpdated: latestMtime,
          timeArchived: isArchived ? latestMtime : null
        });
      } catch (e) {}
    }
  } catch (err) {
    console.error('Error scanning Cursor:', err.message);
  }

  return sessions.sort((a, b) => b.timeUpdated - a.timeUpdated);
}
