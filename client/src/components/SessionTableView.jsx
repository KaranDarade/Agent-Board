import React from 'react';
import { 
  Terminal, 
  Code2, 
  Sparkles, 
  Bot, 
  PowerOff, 
  Power, 
  Clock, 
  Folder 
} from 'lucide-react';

function timeAgo(timestamp) {
  if (!timestamp) return 'never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return (n || 0).toString();
}

export default function SessionTableView({ 
  sessions, 
  onInspect, 
  onDeactivate, 
  onActivate 
}) {
  const toolIcons = {
    opencode: Terminal,
    cursor: Code2,
    antigravity: Sparkles,
    'claude-code': Bot
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-gold-500/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-ivory-200 dark:bg-obsidian-950 border-b border-gold-500/20 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px]">
            <tr>
              <th className="py-3.5 px-4">Engine / Status</th>
              <th className="py-3.5 px-4">Session & Goal</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Model</th>
              <th className="py-3.5 px-4">Cost / Tokens</th>
              <th className="py-3.5 px-4">Updated</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
            {sessions.map((s) => {
              const ToolIcon = toolIcons[s.tool] || Terminal;
              const isLive = s.status === 'active';
              const isArchived = s.status === 'archived';

              return (
                <tr 
                  key={s.id}
                  onClick={() => onInspect(s.id)}
                  className="hover:bg-gold-500/5 cursor-pointer transition"
                >
                  {/* Tool & Status */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="p-1 rounded-md bg-gold-500/10 text-gold-500 border border-gold-500/20">
                        <ToolIcon className="w-3.5 h-3.5" />
                      </span>
                      {isLive ? (
                        <span className="flex items-center space-x-1 text-[10px] font-black text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>LIVE</span>
                        </span>
                      ) : isArchived ? (
                        <span className="text-[10px] text-slate-500">OFF</span>
                      ) : (
                        <span className="text-[10px] text-amber-500">IDLE</span>
                      )}
                    </div>
                  </td>

                  {/* Title & Project */}
                  <td className="py-3 px-4 max-w-xs truncate font-sans">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {s.title || 'Untitled Session'}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1 truncate font-mono">
                      <Folder className="w-3 h-3 text-gold-500 shrink-0" />
                      <span className="truncate">{s.projectName}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-ivory-200 dark:bg-obsidian-850 text-slate-700 dark:text-slate-300 border border-gold-500/20">
                      {s.role}
                    </span>
                  </td>

                  {/* Model */}
                  <td className="py-3 px-4">
                    <div className="text-slate-800 dark:text-gold-300 font-semibold truncate max-w-[140px]">
                      {s.model}
                    </div>
                  </td>

                  {/* Cost & Tokens */}
                  <td className="py-3 px-4">
                    <div className="text-gold-700 dark:text-gold-400 font-bold">
                      ${(s.cost || 0).toFixed(3)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatTokens(s.tokens?.total)} tok
                    </div>
                  </td>

                  {/* Updated */}
                  <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {timeAgo(s.timeUpdated)}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    {s.tool === 'opencode' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isArchived) onActivate(s.id);
                          else onDeactivate(s.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                          isArchived
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {isArchived ? 'Activate' : 'Deactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
