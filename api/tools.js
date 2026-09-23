export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json([
    {
      id: 'opencode',
      name: 'OpenCode',
      installed: true,
      type: 'CLI / Headless Agent',
      badgeColor: 'gold'
    },
    {
      id: 'cursor',
      name: 'Cursor AI',
      installed: true,
      type: 'AI Code Editor',
      badgeColor: 'blue'
    },
    {
      id: 'claude-code',
      name: 'Claude Code',
      installed: true,
      type: 'Anthropic Terminal Agent',
      badgeColor: 'amber'
    },
    {
      id: 'antigravity',
      name: 'Antigravity',
      installed: true,
      type: 'DeepMind Agentic IDE',
      badgeColor: 'emerald'
    }
  ]);
}
