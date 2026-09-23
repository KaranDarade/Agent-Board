import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Check if high-fidelity local telemetry stats were synced to fleet_telemetry
    try {
      const { data: telemetry } = await supabase
        .from('fleet_telemetry')
        .select('stats')
        .eq('id', 'global')
        .maybeSingle();

      if (telemetry && telemetry.stats) {
        return res.status(200).json(telemetry.stats);
      }
    } catch (e) {}

    // 2. Fallback to computing from fleet_sessions table
    const { data: sessions, error } = await supabase
      .from('fleet_sessions')
      .select('*');

    if (error || !sessions) {
      return res.status(200).json({
        totalSessions: 0,
        activeSessions: 0,
        idleSessions: 0,
        archivedSessions: 0,
        planModeSessions: 0,
        buildModeSessions: 0,
        totalCost: 0,
        totalTokens: 0,
        connectedTools: 4,
        byTool: { opencode: 0, cursor: 0, antigravity: 0, 'claude-code': 0 },
        byModel: {}
      });
    }

    const totalSessions = sessions.length;
    let activeSessions = 0;
    let idleSessions = 0;
    let archivedSessions = 0;
    let planModeSessions = 0;
    let buildModeSessions = 0;
    let totalCost = 0;
    let totalTokens = 0;
    const byTool = { opencode: 0, cursor: 0, antigravity: 0, 'claude-code': 0 };
    const byModel = {};

    for (const s of sessions) {
      if (s.is_active || s.status === 'active') activeSessions++;
      else if (s.status === 'idle') idleSessions++;
      else if (s.status === 'archived') archivedSessions++;

      if (s.role === 'build') buildModeSessions++;
      else planModeSessions++;

      totalCost += Number(s.cost || 0);
      totalTokens += Number(s.tokens || 0);

      const tool = (s.tool_name || 'opencode').toLowerCase().replace(/\s+/g, '-');
      byTool[tool] = (byTool[tool] || 0) + 1;

      const model = s.model || 'default';
      byModel[model] = (byModel[model] || 0) + 1;
    }

    const connectedTools = Object.values(byTool).filter(c => c > 0).length || 4;

    return res.status(200).json({
      totalSessions,
      activeSessions,
      idleSessions,
      archivedSessions,
      planModeSessions,
      buildModeSessions,
      totalCost,
      totalTokens,
      connectedTools,
      byTool,
      byModel
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
