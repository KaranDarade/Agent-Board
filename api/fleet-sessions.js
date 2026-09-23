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
    const { data, error } = await supabase
      .from('fleet_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(200).json([]);
    }

    // Format fields to match frontend schema
    const sessions = (data || []).map(row => ({
      id: row.id,
      toolName: row.tool_name,
      title: row.title,
      directory: row.directory,
      projectName: row.project_name,
      model: row.model,
      role: row.role,
      agentRole: row.role,
      status: row.status,
      isActive: Boolean(row.is_active),
      tasksCount: row.tasks_count || 0,
      completedTasksCount: row.completed_tasks_count || 0,
      updatedAt: row.updated_at
    }));

    return res.status(200).json(sessions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
