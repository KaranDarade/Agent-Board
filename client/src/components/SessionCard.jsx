import React, { useState } from 'react';
import { 
  Folder, 
  Cpu, 
  Clock, 
  PowerOff, 
  Power, 
  Terminal, 
  Code2, 
  Sparkles, 
  Bot, 
  Copy, 
  Check, 
  Trash2,
  Edit3
} from 'lucide-react';
import ModeSwitchBadge from './ModeSwitchBadge.jsx';

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

export default function SessionCard({ 
  session, 
  onDeactivate, 
  onActivate, 
  onInspect, 
  onPrompt, 
  onDelete,
  onModeChange,
  onOpenModelSelector
}) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleActive = async (e) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      if (session.status === 'archived') {
        await onActivate(session.id, session.tool);
      } else {
        await onDeactivate(session.id, session.tool);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setIsProcessing(true);
    try {
      await onDelete(session.id);
    } finally {
      setIsProcessing(false);
      setConfirmDelete(false);
    }
  };

  const toolConfig = {
    opencode: { name: 'OpenCode', icon: Terminal, style: 'text-gold-500 border-gold-500/30 bg-gold-500/10' },
    cursor: { name: 'Cursor AI', icon: Code2, style: 'text-blue-500 border-blue-500/30 bg-blue-500/10' },
    antigravity: { name: 'Antigravity', icon: Sparkles, style: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' },
    'claude-code': { name: 'Claude Code', icon: Bot, style: 'text-amber-500 border-amber-500/30 bg-amber-500/10' }
  };

  const toolMeta = toolConfig[session.tool] || { 
    name: session.toolName || session.tool, 
    icon: Terminal, 
    style: 'text-slate-400 border-slate-400/20 bg-slate-400/10' 
  };
  const ToolIcon = toolMeta.icon;

  const isLive = session.status === 'active';
  const isArchived = session.status === 'archived';

  return (
    <div 
      onClick={() => onInspect(session.id)}
      className={`glass-card rounded-2xl p-5 relative flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 ${
        isLive ? 'border-gold-500 gold-border-glow ring-1 ring-gold-500/30' : 
        isArchived ? 'opacity-65 border-slate-300 dark:border-white/5 bg-slate-100/50 dark:bg-obsidian-950/40' : 
        'hover:border-gold-500/50'
      }`}
    >
      <div>
        {/* Top Header: Tool badge, Mode Switcher, Status pill, and Copy ID */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {/* Tool Engine Badge */}
            <span className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${toolMeta.style}`}>
              <ToolIcon className="w-3.5 h-3.5" />
              <span>{toolMeta.name}</span>
            </span>

            {/* Interactive Mode Switcher Badge (PLAN ⇄ BUILD) */}
            <ModeSwitchBadge
              sessionId={session.id}
              currentMode={session.role}
              onModeChange={onModeChange}
              size="sm"
            />

            {/* Status Beacon */}
            {isLive && (
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ACTIVE</span>
              </span>
            )}
            {!isLive && !isArchived && (
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>IDLE</span>
              </span>
            )}
            {isArchived && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                <PowerOff className="w-2.5 h-2.5" />
                <span>DEACTIVATED</span>
              </span>
            )}
          </div>

          {/* Session ID chip */}
          <button
            onClick={handleCopyId}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-black/5 dark:bg-black/40 hover:bg-gold-500/10 text-slate-500 dark:text-slate-400 hover:text-gold-500 border border-black/5 dark:border-white/5 text-[10px] font-mono transition shrink-0"
            title="Copy ID"
          >
            <span>{session.id.substring(0, 8)}…</span>
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-gold-600 dark:group-hover:text-gold-300 transition mb-2">
          {session.title || 'Untitled Agent Session'}
        </h3>

        {/* Project Directory / Workspace */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3.5 truncate font-mono">
          <Folder className="w-3.5 h-3.5 text-gold-500 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">{session.projectName}</span>
        </div>

        {/* Model Spec Badge with Quick Reallocate Click */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenModelSelector) onOpenModelSelector(session);
          }}
          className="bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/15 hover:border-gold-500/40 rounded-xl p-3 mb-4 flex items-center justify-between text-xs transition group/model cursor-pointer"
          title="Click to allocate a different AI model"
        >
          <div className="flex items-center space-x-2.5 truncate">
            <Cpu className="w-4 h-4 text-gold-500 shrink-0 group-hover/model:rotate-12 transition-transform" />
            <div className="truncate">
              <div className="font-mono text-slate-900 dark:text-gold-200 font-bold text-[12px] truncate flex items-center gap-1.5">
                <span>{session.model}</span>
                <Edit3 className="w-3 h-3 opacity-0 group-hover/model:opacity-100 text-gold-500 transition-opacity" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <span>{session.provider}</span>
                {session.variant && <span>({session.variant})</span>}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-black text-gold-700 dark:text-gold-400 font-mono text-[12px]">
              ${(session.cost || 0).toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {formatTokens(session.tokens?.total)} tokens
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-gold-500" />
            <span>{timeAgo(session.timeUpdated)}</span>
          </div>
          <div className="text-[10px] text-slate-500">
            In: {formatTokens(session.tokens?.input)} · Out: {formatTokens(session.tokens?.output)}
          </div>
        </div>

        {/* Action Buttons: Universal for all tools */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Deactivate / Reactivate Toggle */}
          <button
            onClick={handleToggleActive}
            disabled={isProcessing}
            className={`col-span-2 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition border ${
              isArchived
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/25'
            }`}
            title={isArchived ? "Reactivate session" : "Deactivate session"}
          >
            {isArchived ? (
              <>
                <Power className="w-3.5 h-3.5" />
                <span>Reactivate</span>
              </>
            ) : (
              <>
                <PowerOff className="w-3.5 h-3.5" />
                <span>Deactivate</span>
              </>
            )}
          </button>

          {/* Steer / Prompt */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrompt(session);
            }}
            className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl bg-ivory-200 dark:bg-obsidian-850 hover:border-gold-500/40 text-slate-700 dark:text-slate-200 border border-black/5 dark:border-white/5 text-xs font-semibold transition"
            title="Send steering prompt or directive"
          >
            <Terminal className="w-3.5 h-3.5 text-gold-500" />
            <span className="hidden sm:inline">Steer</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl text-xs transition border ${
              confirmDelete
                ? 'bg-rose-600 text-white border-rose-500 font-bold'
                : 'bg-ivory-200 dark:bg-obsidian-850 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 border-black/5 dark:border-white/5'
            }`}
            title={confirmDelete ? 'Confirm delete?' : 'Delete session'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmDelete ? 'Sure?' : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
