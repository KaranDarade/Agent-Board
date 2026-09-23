import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { getAllFleetSessions, getUniversalFleetStats } from './scanners/index.js';
import { executeSteeringDirective } from './fleetState.js';

// Auto-load .env if present
function loadEnv() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '.env')
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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let syncInterval = null;
let isSyncing = false;
let tableWarningPrinted = false;
let cloudStatus = {
  configured: Boolean(SUPABASE_URL && SUPABASE_KEY),
  connected: false,
  lastSyncTime: null,
  syncedCount: 0,
  activeDirectives: 0,
  tableReady: false,
  error: null
};

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
  } catch (err) {
    cloudStatus.error = err.message;
  }
}

/**
 * Sync local active & recent sessions up to Supabase
 */
export async function syncLocalFleetToCloud() {
  if (!supabase || isSyncing) return;
  isSyncing = true;

  try {
    const sessions = getAllFleetSessions();
    const stats = getUniversalFleetStats();

    // Map top 50 active and recent sessions for cloud mirror
    const payload = sessions.slice(0, 50).map(s => ({
      id: s.id,
      tool_name: s.toolName || 'opencode',
      title: s.title || 'Untitled Session',
      directory: s.directory || '',
      project_name: s.projectName || '',
      model: s.model || '',
      role: s.role || 'plan',
      status: s.status || 'active',
      is_active: Boolean(s.isActive),
      tasks_count: s.tasksCount || 0,
      completed_tasks_count: s.completedTasksCount || 0,
      updated_at: new Date().toISOString()
    }));

    if (payload.length > 0) {
      const { error } = await supabase
        .from('fleet_sessions')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('fleet_sessions')) {
          if (!tableWarningPrinted) {
            console.log('\n[Cloud Bridge] Notice: Table "fleet_sessions" not yet created in Supabase.');
            console.log('[Cloud Bridge] Run the SQL setup script in Supabase SQL Editor to enable 24/7 cloud sync.\n');
            tableWarningPrinted = true;
          }
          cloudStatus.tableReady = false;
        } else {
          cloudStatus.error = error.message;
        }
      } else {
        cloudStatus.connected = true;
        cloudStatus.tableReady = true;
        cloudStatus.lastSyncTime = Date.now();
        cloudStatus.syncedCount = payload.length;
        cloudStatus.error = null;
      }
    }
  } catch (err) {
    cloudStatus.error = err.message;
  } finally {
    isSyncing = false;
  }
}

/**
 * Poll for pending remote steering directives queued from mobile or cloud web app
 */
export async function processRemoteDirectives() {
  if (!supabase || !cloudStatus.tableReady) return;

  try {
    const { data: pending, error } = await supabase
      .from('remote_directives')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (error || !pending || pending.length === 0) return;

    for (const directive of pending) {
      cloudStatus.activeDirectives++;
      console.log(`[Cloud Bridge] Processing remote directive ${directive.id} for session ${directive.session_id}`);

      // Mark as running
      await supabase
        .from('remote_directives')
        .update({ status: 'running' })
        .eq('id', directive.id);

      const allSessions = getAllFleetSessions();
      const targetSession = allSessions.find(s => s.id === directive.session_id) || {
        id: directive.session_id,
        toolName: 'opencode'
      };

      let accumulatedOutput = '';

      executeSteeringDirective(
        directive.session_id,
        directive.prompt,
        targetSession,
        async (chunk) => {
          accumulatedOutput += chunk;
          // Periodically update progress if long-running
          if (accumulatedOutput.length % 200 === 0) {
            try {
              await supabase
                .from('remote_directives')
                .update({ response_chunk: accumulatedOutput.slice(-2000) })
                .eq('id', directive.id);
            } catch (e) {}
          }
        },
        async (err, result) => {
          cloudStatus.activeDirectives = Math.max(0, cloudStatus.activeDirectives - 1);
          if (err) {
            await supabase
              .from('remote_directives')
              .update({
                status: 'error',
                error_message: err.message,
                completed_at: new Date().toISOString()
              })
              .eq('id', directive.id);
          } else {
            await supabase
              .from('remote_directives')
              .update({
                status: 'completed',
                response_chunk: accumulatedOutput || 'Directive executed successfully.',
                completed_at: new Date().toISOString()
              })
              .eq('id', directive.id);
          }
          // Immediately sync local state back to Supabase
          syncLocalFleetToCloud();
        }
      );
    }
  } catch (err) {
    // Non-fatal error during directive polling
  }
}

/**
 * Start the Cloud Bridge daemon
 */
export function startCloudBridge(intervalMs = 5000) {
  if (!supabase) {
    console.log('[Cloud Bridge] Supabase credentials not found. Local offline mode active.');
    return;
  }

  console.log(`[Cloud Bridge] Initialized. Connected to Supabase at ${SUPABASE_URL}`);
  
  // Initial sync
  syncLocalFleetToCloud();
  processRemoteDirectives();

  // Polling loop
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    syncLocalFleetToCloud();
    processRemoteDirectives();
  }, intervalMs);
}

export function stopCloudBridge() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export function getCloudStatus() {
  return { ...cloudStatus };
}
