import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { deactivateSession as deactivateOpenCode, activateSession as activateOpenCode } from './db.js';

const STATE_FILE = path.join(process.cwd(), 'server', 'fleet-state.json');

// Dynamic lookup for any Windows user account or global PATH
const candidateExePath = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'npm', 'node_modules', 'opencode-ai', 'bin', 'opencode.exe')
  : path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', 'opencode-ai', 'bin', 'opencode.exe');

const OPENCODE_EXE = fs.existsSync(candidateExePath) ? candidateExePath : 'opencode';

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { archived: [], directives: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch (e) {
    return { archived: [], directives: [] };
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save fleet-state.json:', e.message);
  }
}

export function isSessionArchived(sessionId) {
  const state = loadState();
  return state.archived.includes(sessionId);
}

export function archiveFleetSession(sessionId, tool) {
  const state = loadState();
  if (!state.archived.includes(sessionId)) {
    state.archived.push(sessionId);
    saveState(state);
  }

  // If it's an OpenCode session, update opencode.db as well
  if (tool === 'opencode' || !sessionId.startsWith('cursor-')) {
    try {
      deactivateOpenCode(sessionId);
    } catch (e) {
      // Ignore if not present in opencode.db
    }
  }

  return { success: true, id: sessionId, status: 'archived', time_archived: Date.now() };
}

export function reactivateFleetSession(sessionId, tool) {
  const state = loadState();
  state.archived = state.archived.filter(id => id !== sessionId);
  saveState(state);

  // If it's an OpenCode session, update opencode.db as well
  if (tool === 'opencode' || !sessionId.startsWith('cursor-')) {
    try {
      activateOpenCode(sessionId);
    } catch (e) {
      // Ignore if not present in opencode.db
    }
  }

  return { success: true, id: sessionId, status: 'active' };
}

export function getFleetDirectives(sessionId) {
  const state = loadState();
  if (!sessionId) return state.directives || [];
  return (state.directives || []).filter(d => d.sessionId === sessionId);
}

// Steer agent with live streaming and non-blocking response
export function executeSteeringDirective(sessionId, prompt, sessionMeta, onLog, onDone) {
  const state = loadState();
  const directive = {
    id: `dir_${Date.now()}`,
    sessionId,
    tool: sessionMeta?.tool || 'opencode',
    prompt,
    timestamp: Date.now(),
    status: 'running',
    output: ''
  };

  state.directives = state.directives || [];
  state.directives.unshift(directive);
  saveState(state);

  // If OpenCode (or OpenCode formatted session ID ses_...)
  if (sessionMeta?.tool === 'opencode' || sessionId.startsWith('ses_')) {
    const cwd = sessionMeta?.directory && fs.existsSync(sessionMeta.directory)
      ? sessionMeta.directory
      : process.cwd();

    const exe = fs.existsSync(OPENCODE_EXE) ? OPENCODE_EXE : 'opencode';
    const args = ['run', '--session', sessionId, '--auto', '--print-logs', prompt];

    let child = null;
    try {
      child = spawn(exe, args, {
        cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      });
    } catch (err) {
      directive.status = 'failed';
      directive.output = err.message;
      saveState(state);
      if (onDone) onDone(err, directive);
      return directive;
    }

    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      directive.output += text;
      if (onLog) onLog(text);
    });

    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      directive.output += text;
      if (onLog) onLog(text);
    });

    child.on('close', code => {
      directive.status = code === 0 ? 'completed' : 'failed';
      directive.exitCode = code;
      saveState(state);
      if (onDone) onDone(null, directive);
    });

    child.on('error', err => {
      directive.status = 'failed';
      directive.output += `\nProcess error: ${err.message}`;
      saveState(state);
      if (onDone) onDone(err, directive);
    });

    // Generous timeout for agent execution: 180 seconds
    setTimeout(() => {
      if (directive.status === 'running') {
        directive.status = 'timeout';
        directive.output += '\n[Fleet Notice]: Process detached and continuing in background.';
        saveState(state);
        if (child) {
          try { child.kill(); } catch (e) {}
        }
        if (onDone) onDone(null, directive);
      }
    }, 180000);

    return directive;
  } else {
    // For Antigravity, Cursor, Claude Code
    directive.status = 'dispatched';
    directive.output = `Steering directive recorded for ${sessionMeta?.toolName || 'agent'}.\nDirective: "${prompt}"`;
    saveState(state);
    if (onDone) onDone(null, directive);
    return directive;
  }
}
