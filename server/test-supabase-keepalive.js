// Lightweight local verification script for Supabase activity mechanism
// Validates that the minimal read query executes successfully using anonymous/public credentials

import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
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
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL or SUPABASE_ANON_KEY not set.');
  process.exit(1);
}

async function verifyKeepalive() {
  const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/fleet_sessions?select=id&limit=1`;
  console.log(`[Keepalive Verification] Target URL Host: ${new URL(SUPABASE_URL).hostname}`);
  console.log('[Keepalive Verification] Query: SELECT id FROM fleet_sessions LIMIT 1');
  console.log('[Keepalive Verification] Method: GET via PostgREST REST API (Anon Key)');

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Keepalive Verification] Request failed with HTTP ${res.status}: ${errorText}`);
    process.exit(1);
  }

  const data = await res.json();
  const count = Array.isArray(data) ? data.length : 0;
  console.log(`[Keepalive Verification] SUCCESS: HTTP ${res.status} OK (Returned ${count} record(s))`);
  if (count > 0) {
    console.log(`[Keepalive Verification] Sample ID returned: ${data[0].id}`);
  }
}

verifyKeepalive().catch(err => {
  console.error('[Keepalive Verification] Fatal Error:', err.message);
  process.exit(1);
});
