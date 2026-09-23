import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { isSessionArchived } from '../fleetState.js';

const BRAIN_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');

export function isAvailable() {
  return fs.existsSync(BRAIN_DIR);
}

function extractFirstHeading(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^#\s+(.+)$/m);
    if (match) return match[1].trim();
  } catch (e) {}
  return null;
}

// Find the latest activity by inspecting transcripts, logs, and modified task files
function getAntigravityLatestActivity(folderPath, fallbackMtime) {
  let latestMtime = fallbackMtime || 0;

  // 1. Direct transcript log
  const transcriptPath = path.join(folderPath, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(transcriptPath)) {
    try {
      const st = fs.statSync(transcriptPath);
      if (st.mtimeMs > latestMtime) latestMtime = st.mtimeMs;
    } catch (e) {}
  }

  // 2. Scan subfiles up to depth 2 (task files, markdown files, logs)
  function scan(dir, depth = 0) {
    if (depth > 2) return;
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        try {
          const st = fs.statSync(full);
          if (st.mtimeMs > latestMtime) latestMtime = st.mtimeMs;
          if (item.isDirectory()) scan(full, depth + 1);
        } catch (e) {}
      }
    } catch (e) {}
  }
  scan(folderPath);

  return latestMtime;
}

export function scanAntigravitySessions() {
  if (!isAvailable()) return [];

  const sessions = [];
  try {
    const entries = fs.readdirSync(BRAIN_DIR);
    const now = Date.now();

    for (const convId of entries) {
      const folderPath = path.join(BRAIN_DIR, convId);
      try {
        const stat = fs.statSync(folderPath);
        if (!stat.isDirectory()) continue;

        const taskPath = path.join(folderPath, 'task.md');
        const planPath = path.join(folderPath, 'implementation_plan.md');
        const walkthroughPath = path.join(folderPath, 'walkthrough.md');

        const title = 
          extractFirstHeading(planPath) || 
          extractFirstHeading(taskPath) || 
          extractFirstHeading(walkthroughPath) || 
          `Antigravity Agent Session (${convId.substring(0, 8)})`;

        // Calculate accurate latest activity
        const latestActivity = getAntigravityLatestActivity(folderPath, stat.mtimeMs);
        const diffMinutes = (now - latestActivity) / (1000 * 60);
        
        const isArchived = isSessionArchived(convId);
        const isActive = !isArchived && diffMinutes <= 30;
        const status = isArchived ? 'archived' : (isActive ? 'active' : 'idle');

        sessions.push({
          id: convId,
          tool: 'antigravity',
          toolName: 'Antigravity',
          title,
          role: 'plan',
          model: 'gemini-3.8-flash',
          provider: 'google',
          variant: 'agentic',
          status,
          isActive,
          cost: 0.08,
          tokens: {
            input: 48000,
            output: 6200,
            reasoning: 2500,
            cacheRead: 15000,
            total: 54200
          },
          directory: folderPath,
          projectName: 'Antigravity Brain',
          timeCreated: stat.birthtimeMs || stat.mtimeMs,
          timeUpdated: latestActivity,
          timeArchived: isArchived ? latestActivity : null
        });
      } catch (e) {}
    }
  } catch (err) {
    console.error('Error scanning Antigravity:', err.message);
  }

  return sessions.sort((a, b) => b.timeUpdated - a.timeUpdated);
}
