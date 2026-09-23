import { scanOpenCodeSessions, isAvailable as isOpenCodeAvailable } from './opencode.js';
import { scanClaudeSessions, isAvailable as isClaudeAvailable } from './claude.js';
import { scanCursorSessions, isAvailable as isCursorAvailable } from './cursor.js';
import { scanAntigravitySessions, isAvailable as isAntigravityAvailable } from './antigravity.js';

export function getDiscoveredTools() {
  return [
    {
      id: 'opencode',
      name: 'OpenCode',
      installed: isOpenCodeAvailable(),
      type: 'CLI / Headless Agent',
      badgeColor: 'gold'
    },
    {
      id: 'cursor',
      name: 'Cursor AI',
      installed: isCursorAvailable(),
      type: 'AI Code Editor',
      badgeColor: 'blue'
    },
    {
      id: 'claude-code',
      name: 'Claude Code',
      installed: isClaudeAvailable(),
      type: 'Anthropic Terminal Agent',
      badgeColor: 'amber'
    },
    {
      id: 'antigravity',
      name: 'Antigravity',
      installed: isAntigravityAvailable(),
      type: 'DeepMind Agentic IDE',
      badgeColor: 'emerald'
    }
  ];
}

export function getAllFleetSessions(filters = {}) {
  const opencodeSessions = scanOpenCodeSessions();
  const claudeSessions = scanClaudeSessions();
  const cursorSessions = scanCursorSessions();
  const antigravitySessions = scanAntigravitySessions();

  let all = [
    ...opencodeSessions,
    ...cursorSessions,
    ...antigravitySessions,
    ...claudeSessions
  ];

  // Sort by timeUpdated DESC
  all.sort((a, b) => (b.timeUpdated || 0) - (a.timeUpdated || 0));

  return all.filter(s => {
    if (filters.tool && filters.tool !== 'all' && s.tool !== filters.tool) return false;
    if (filters.status && filters.status !== 'all' && s.status !== filters.status) return false;
    if (filters.role && filters.role !== 'all' && s.role !== filters.role) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = (s.title || '').toLowerCase().includes(q);
      const matchDir = (s.directory || '').toLowerCase().includes(q);
      const matchModel = (s.model || '').toLowerCase().includes(q);
      const matchTool = (s.toolName || '').toLowerCase().includes(q);
      const matchId = (s.id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDir && !matchModel && !matchTool && !matchId) return false;
    }
    return true;
  });
}

export function getUniversalFleetStats() {
  const allSessions = getAllFleetSessions();

  let activeCount = 0;
  let idleCount = 0;
  let archivedCount = 0;
  let totalCost = 0;
  let totalTokens = 0;

  const toolCounts = { opencode: 0, cursor: 0, 'claude-code': 0, antigravity: 0 };
  const roleCounts = {};
  const modelCounts = {};

  for (const s of allSessions) {
    if (s.status === 'active') activeCount++;
    else if (s.status === 'idle') idleCount++;
    else if (s.status === 'archived') archivedCount++;

    totalCost += Number(s.cost || 0);
    totalTokens += Number(s.tokens?.total || 0);

    toolCounts[s.tool] = (toolCounts[s.tool] || 0) + 1;

    const r = s.role || 'general';
    roleCounts[r] = (roleCounts[r] || 0) + 1;

    const m = s.model || 'unknown';
    modelCounts[m] = (modelCounts[m] || 0) + 1;
  }

  return {
    totalSessions: allSessions.length,
    activeSessions: activeCount,
    idleSessions: idleCount,
    archivedSessions: archivedCount,
    totalCost: Number(totalCost.toFixed(2)),
    totalTokens,
    toolsDistribution: toolCounts,
    roleDistribution: roleCounts,
    modelDistribution: modelCounts,
    discoveredTools: getDiscoveredTools()
  };
}
