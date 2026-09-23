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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { prompt } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const client = getSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  try {
    const { data, error } = await client
      .from('remote_directives')
      .insert({
        session_id: id || 'global',
        prompt: prompt.trim(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      status: 'queued',
      directiveId: data.id,
      message: 'Directive queued in Supabase. Your local desktop agent will process it immediately.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
