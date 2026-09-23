import React from 'react';
import { 
  Activity, 
  DollarSign, 
  Layers, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  Code2, 
  Sparkles, 
  Bot 
} from 'lucide-react';

function formatNumber(num) {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return (num || 0).toLocaleString();
}

export default function FleetStats({ 
  stats, 
  selectedTool, 
  onSelectTool, 
  selectedRole, 
  onSelectRole, 
  selectedModel, 
  onSelectModel 
}) {
  if (!stats) return null;

  const toolIcons = {
    opencode: Terminal,
    cursor: Code2,
    antigravity: Sparkles,
    'claude-code': Bot
  };

  return (
    <div className="space-y-4">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Agents */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden transition hover:border-gold-500/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Fleet</span>
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE</span>
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.activeSessions}
            </span>
            <span className="text-xs text-slate-500">of {stats.totalSessions} sessions</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-gold-500" />
            <span>Updated within 20 mins</span>
          </div>
        </div>

        {/* Discovered Tools */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden transition hover:border-gold-500/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Connected Tools</span>
            <ShieldCheck className="w-4 h-4 text-gold-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {Object.values(stats.toolsDistribution || {}).filter(c => c > 0).length}
            </span>
            <span className="text-xs text-gold-600 dark:text-gold-400 font-semibold">Local Engines</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span>OpenCode · Cursor · AntiGravity · Claude</span>
          </div>
        </div>

        {/* Fleet Cost */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden transition hover:border-gold-500/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Fleet Cost</span>
            <DollarSign className="w-4 h-4 text-gold-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ${stats.totalCost?.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-slate-500 font-mono">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-gold-500" />
            <span>Across all provider models</span>
          </div>
        </div>

        {/* Total Tokens */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden transition hover:border-gold-500/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Tokens Burned</span>
            <Layers className="w-4 h-4 text-gold-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatNumber(stats.totalTokens)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
            <span className="text-amber-500 dark:text-gold-400">{stats.idleSessions} Idle</span>
            <span>•</span>
            <span>{stats.archivedSessions} Deactivated</span>
          </div>
        </div>
      </div>

      {/* Categorized Filter Bar (Tool Selection & Role Selection) */}
      <div className="glass-card p-3.5 rounded-2xl space-y-3">
        {/* Tool Filter Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">
            Engine Filter:
          </span>

          <button
            onClick={() => onSelectTool('all')}
            className={`px-3 py-1 rounded-xl transition font-bold text-xs ${
              selectedTool === 'all'
                ? 'bg-gold-500 text-obsidian-950 shadow-gold-sm'
                : 'bg-ivory-200 dark:bg-obsidian-850 text-slate-700 dark:text-slate-300 hover:bg-gold-500/10'
            }`}
          >
            All Engines ({stats.totalSessions})
          </button>

          {Object.entries(stats.toolsDistribution || {}).map(([toolId, count]) => {
            const isSelected = selectedTool === toolId;
            const Icon = toolIcons[toolId] || Terminal;
            const toolNames = {
              opencode: 'OpenCode',
              cursor: 'Cursor AI',
              antigravity: 'Antigravity',
              'claude-code': 'Claude Code'
            };

            return (
              <button
                key={toolId}
                onClick={() => onSelectTool(isSelected ? 'all' : toolId)}
                className={`px-3 py-1 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold border ${
                  isSelected
                    ? 'bg-gold-500 text-obsidian-950 border-gold-500 font-bold shadow-gold-sm'
                    : 'bg-ivory-200 dark:bg-obsidian-850 border-gold-500/15 text-slate-700 dark:text-slate-300 hover:border-gold-500/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{toolNames[toolId] || toolId}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-gold-500/15 text-gold-600 dark:text-gold-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs pt-2 border-t border-black/5 dark:border-white/5">
          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">
            Role Filter:
          </span>

          <button
            onClick={() => onSelectRole('all')}
            className={`px-2.5 py-1 rounded-lg transition font-medium text-xs ${
              selectedRole === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            All Roles
          </button>

          {Object.entries(stats.roleDistribution || {}).map(([role, count]) => {
            const isSelected = selectedRole === role;
            return (
              <button
                key={role}
                onClick={() => onSelectRole(isSelected ? 'all' : role)}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 font-mono text-[11px] ${
                  isSelected
                    ? 'bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <span className="uppercase">{role}</span>
                <span className="text-[10px] text-slate-500">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
