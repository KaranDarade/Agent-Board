import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  RefreshCw, 
  Plus, 
  Laptop, 
  Download, 
  Sparkles,
  User,
  LogOut
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
  onOpenShowcase, 
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onSignOut,
  isLocalHost = true,
  isDesktop: propIsDesktop,
  tools = [] 
}) {
  const isDesktop = propIsDesktop !== undefined 
    ? propIsDesktop 
    : (typeof window !== 'undefined' && (Boolean(window.agentBoardDesktop?.isDesktop) || new URLSearchParams(window.location.search).get('app') === 'desktop'));
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
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div 
          onClick={() => {
            if (window.location.pathname === '/' && !window.location.search && !window.location.hash) {
              window.location.reload();
            } else {
              window.location.href = '/';
            }
          }}
          className="flex items-center space-x-3 shrink-0 cursor-pointer hover:opacity-90 transition select-none group"
          title="Refresh and go to homepage"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 p-0.5 shadow-gold-sm shrink-0 group-hover:scale-105 transition">
            <div className="w-full h-full bg-ivory-100 dark:bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-mono group-hover:text-gold-500 transition">
                <span>Agent</span>
                <span className="text-gold-gradient font-black tracking-wide">Board</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/30">
                {isDesktop ? 'Desktop Workstation' : 'Universal Hub'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden xs:block">
              Universal AI Agent Command Center
            </p>
          </div>
        </div>

        {/* Right Toolbar */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 ml-auto">
          {!currentUser ? (
            /* Unauthenticated Navbar controls */
            <>
              {!isDesktop && onOpenShowcase && (
                <button
                  onClick={onOpenShowcase}
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-ivory-200 dark:bg-obsidian-900 hover:text-gold-500 text-xs font-semibold border border-black/10 dark:border-white/10 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  <span>Product Tour</span>
                </button>
              )}

              <ThemeToggle theme={theme} onToggle={onToggleTheme} />

              <button
                onClick={() => onOpenAuth && onOpenAuth('signin')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-gold-500 border border-black/10 dark:border-white/10 hover:border-gold-500/40 transition"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth && onOpenAuth('signup')}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 shadow-gold-sm transition hover:scale-[1.02]"
              >
                Get Started
              </button>
            </>
          ) : (
            /* Authenticated Navbar controls */
            <>
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
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-ivory-200 dark:bg-obsidian-900 border border-gold-500/20 text-xs shrink-0">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                  {activeCount} Active
                </span>
              </div>

              {/* Cloud Sync & Desktop Status Beacon */}
              <div 
                className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/25 text-[11px] font-semibold text-gold-600 dark:text-gold-400 shrink-0" 
                title={isConnected ? "Direct Local SSE Engine Active" : "24/7 Cloud Sync Active via Supabase Bridge (Desktop Offline)"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isConnected ? (isDesktop ? 'Desktop App Engine' : 'Local Daemon Connected') : 'Cloud Sync Active (Desktop Offline)'}</span>
              </div>

              {/* Desktop Status or Download App Button */}
              {isDesktop ? (
                <button
                  onClick={() => window.agentBoardDesktop?.checkForUpdates()}
                  className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-500/30 text-xs font-semibold transition shrink-0"
                  title="Desktop App Active — Click to check for updates"
                >
                  <Laptop className="w-4 h-4 text-gold-500" />
                  <span className="hidden lg:inline">{updateMessage || 'Desktop App'}</span>
                </button>
              ) : (
                <button
                  onClick={onOpenDownload}
                  className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-500/30 text-xs font-semibold transition shrink-0"
                  title="Download Agent Board for Desktop"
                >
                  <Download className="w-4 h-4 text-gold-500" />
                  <span className="hidden md:inline">Download App</span>
                </button>
              )}

              {/* Mobile Access Button */}
              <button
                onClick={onOpenMobile}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-500/30 text-xs font-semibold transition shrink-0"
                title="Open on Mobile / 24/7 Access"
              >
                <Smartphone className="w-4 h-4 text-gold-500" />
                <span className="hidden md:inline">Mobile 24/7</span>
              </button>

              {/* Showcase / Product Info Link (Web only) */}
              {!isDesktop && onOpenShowcase && (
                <button
                  onClick={onOpenShowcase}
                  className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-ivory-200 dark:bg-obsidian-900 hover:bg-gold-500/10 text-slate-700 dark:text-slate-300 hover:text-gold-500 border border-black/10 dark:border-white/10 text-xs font-semibold transition shrink-0"
                  title="View Product Showcase & Downloads"
                >
                  <Sparkles className="w-4 h-4 text-gold-500" />
                  <span>Showcase</span>
                </button>
              )}

              {/* User Profile Pill */}
              <button
                onClick={onOpenProfile}
                className="flex items-center space-x-2 pl-2 pr-3 py-1 rounded-xl bg-ivory-200 dark:bg-obsidian-900 border border-gold-500/30 hover:border-gold-500/60 transition text-xs font-semibold shadow-sm"
                title="Account Settings"
              >
                <div className="w-6 h-6 rounded-full bg-gold-500 text-obsidian-950 flex items-center justify-center font-bold text-[11px]">
                  {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[110px] truncate text-slate-800 dark:text-slate-200 text-xs hidden sm:inline">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
