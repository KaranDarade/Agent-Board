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
        byTool: {},
        byModel: {}
      });
    }

    const totalSessions = sessions.length;
    let activeSessions = 0;
    let idleSessions = 0;
    let archivedSessions = 0;
    let planModeSessions = 0;
    let buildModeSessions = 0;
    const byTool = {};
    const byModel = {};

    for (const s of sessions) {
      if (s.is_active || s.status === 'active') activeSessions++;
      else if (s.status === 'idle') idleSessions++;
      else if (s.status === 'archived') archivedSessions++;

      if (s.role === 'build') buildModeSessions++;
      else planModeSessions++;

      const tool = s.tool_name || 'opencode';
      byTool[tool] = (byTool[tool] || 0) + 1;

      const model = s.model || 'default';
      byModel[model] = (byModel[model] || 0) + 1;
    }

    return res.status(200).json({
      totalSessions,
      activeSessions,
      idleSessions,
      archivedSessions,
      planModeSessions,
      buildModeSessions,
      byTool,
      byModel
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
