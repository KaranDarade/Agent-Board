import { createClient } from '@supabase/supabase-js';

let supabase = null;
function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (url && key) {
      supabase = createClient(url, key);
    }
  }
  return supabase;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getSupabase();
  if (!client) {
    return res.status(200).json([]);
  }

  try {
    const { data, error } = await client
      .from('fleet_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(200).json([]);
    }

    // Format fields to match frontend schema
    const sessions = (data || []).map(row => {
      const toolId = (row.tool_name || 'opencode').toLowerCase().replace(/\s+/g, '-');
      const toolDisplayName = toolId === 'opencode' ? 'OpenCode' : (toolId === 'cursor' ? 'Cursor AI' : (toolId === 'antigravity' ? 'Antigravity' : (toolId === 'claude-code' ? 'Claude Code' : row.tool_name)));
      const timestamp = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();

      return {
        id: row.id,
        tool: toolId,
        toolName: toolDisplayName,
        title: row.title,
        directory: row.directory,
        projectName: row.project_name,
        model: row.model,
        role: row.role || 'plan',
        agentRole: row.role || 'plan',
        status: row.status || 'active',
        isActive: Boolean(row.is_active),
        tasksCount: row.tasks_count || 0,
        completedTasksCount: row.completed_tasks_count || 0,
        updatedAt: row.updated_at,
        timeUpdated: timestamp,
        timeCreated: timestamp,
        cost: Number(row.cost || 0),
        tokens: { total: Number(row.tokens || 0) }
      };
    });

    return res.status(200).json(sessions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
