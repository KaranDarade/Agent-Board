import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  RefreshCw, 
  Plus,
  Laptop,
  Download,
  Sparkles
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar({ 
  theme, 
  onToggleTheme, 
  isConnected, 
  isRefreshing, 
  onRefresh, 
  totalSessions, 
  activeCount, 
  onOpenMobile,
  onOpenCreateSession,
  onOpenDownload,
  tools = []
}) {
  const isDesktop = typeof window !== 'undefined' && Boolean(window.agentBoardDesktop);
  const [updateMessage, setUpdateMessage] = useState(null);

  useEffect(() => {
    if (isDesktop && window.agentBoardDesktop?.onUpdateStatus) {
      return window.agentBoardDesktop.onUpdateStatus((data) => {
        setUpdateMessage(data.message);
        setTimeout(() => setUpdateMessage(null), 5000);
      });
    }
  }, [isDesktop]);
  return (
    <header className="sticky top-0 z-30 border-b border-gold-500/20 bg-ivory-100/90 dark:bg-obsidian-950/90 backdrop-blur-md px-4 sm:px-6 py-3.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 p-0.5 shadow-gold-sm">
            <div className="w-full h-full bg-ivory-100 dark:bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Agent</span>
                <span className="text-gold-gradient font-black tracking-wide">Board</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/30">
                Universal Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden xs:block">
              Universal AI Agent Command Center
            </p>
          </div>
        </div>

        {/* Right Toolbar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* + New Session Button */}
          <button
            onClick={onOpenCreateSession}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-extrabold text-xs transition shadow-gold-sm hover:scale-[1.02]"
            title="Create a new agent session"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">New Session</span>
          </button>

          {/* Active Agents Beacon */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-ivory-200 dark:bg-obsidian-900 border border-gold-500/20 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
              {activeCount} Active
            </span>
          </div>

          {/* Desktop Status or Download App Button */}
          {isDesktop ? (
            <button
              onClick={() => window.agentBoardDesktop?.checkForUpdates()}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-500/30 text-xs font-semibold transition"
              title="Desktop App Active — Click to check for updates"
            >
              <Laptop className="w-4 h-4 text-gold-500" />
              <span className="hidden lg:inline">{updateMessage || 'Desktop App'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenDownload}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-500/30 text-xs font-semibold transition"
              title="Download Agent Board for Desktop"
            >
              <Download className="w-4 h-4 text-gold-500" />
              <span className="hidden md:inline">Download App</span>
            </button>
          )}

          {/* Mobile Access Button */}
          <button
            onClick={onOpenMobile}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-500/30 text-xs font-semibold transition"
            title="Open on Mobile / 24/7 Access"
          >
            <Smartphone className="w-4 h-4 text-gold-500" />
            <span className="hidden md:inline">Mobile 24/7</span>
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-ivory-200 dark:bg-obsidian-900 hover:bg-ivory-300 dark:hover:bg-obsidian-850 text-slate-700 dark:text-slate-300 border border-gold-500/20 transition"
            title="Refresh Fleet data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gold-500' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
