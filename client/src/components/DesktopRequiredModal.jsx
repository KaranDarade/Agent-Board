import React from 'react';
import { 
  X, 
  Download, 
  Laptop, 
  Eye, 
  ShieldCheck, 
  HardDrive, 
  Zap, 
  ExternalLink,
  Sparkles,
  Smartphone
} from 'lucide-react';

export default function DesktopRequiredModal({ isOpen, onClose, onLaunchDemo, onOpenMobile }) {
  if (!isOpen) return null;

  const releaseDownloadUrl = 'https://github.com/KaranDarade/Agent-Board/releases/download/v1.0.0/Agent.Board.Setup.1.0.0.exe';

  const handleDownload = () => {
    window.location.href = '/api/download/desktop';
    setTimeout(() => {
      window.location.href = releaseDownloadUrl;
    }, 1500);
  };

  const handleLaunchInstalledApp = () => {
    window.location.href = 'agentboard://open';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/35 rounded-3xl shadow-gold-lg overflow-hidden animate-in zoom-in-95 duration-150 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Header */}
        <div className="p-6 border-b border-gold-500/20 bg-ivory-200/50 dark:bg-obsidian-950/50 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 p-0.5 shadow-gold-sm shrink-0">
              <div className="w-full h-full bg-ivory-100 dark:bg-obsidian-950 rounded-[14px] flex items-center justify-center">
                <Laptop className="w-6 h-6 text-gold-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  Desktop Application Required
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-gold-500/15 text-gold-600 dark:text-gold-400 border border-gold-500/30">
                  Local-First
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live agent steering & introspection is exclusive to the Native Desktop App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Agent Board communicates directly with your computer's <strong>local SQLite databases (OpenCode, Cursor)</strong>, 
            <strong>terminal pipes (Claude Code)</strong>, and <strong>file transcripts</strong> without any cloud latency.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-ivory-200/60 dark:bg-obsidian-950/60 border border-gold-500/20 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <Zap className="w-3.5 h-3.5 text-gold-500" />
                <span>Sub-800ms Steering</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct stdin prompt injection without killing sessions.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-ivory-200/60 dark:bg-obsidian-950/60 border border-gold-500/20 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Local Privacy</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Zero code, tokens, or logs are uploaded to any external server.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-ivory-200/60 dark:bg-obsidian-950/60 border border-gold-500/20 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span>Zero Cloud Setup</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Auto-discovers running agents on your Windows PC instantly.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-ivory-200/60 dark:bg-obsidian-950/60 border border-gold-500/20 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>Mobile LAN Support</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monitor and steer from your phone over local Wi-Fi.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleDownload}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-xs shadow-gold-sm transition hover:scale-[1.01] flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download Agent Board for Windows (.exe)</span>
            </button>

            <div className="flex items-center space-x-2">
              {onLaunchDemo && (
                <button
                  onClick={() => {
                    onClose();
                    onLaunchDemo();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-ivory-200 dark:bg-obsidian-850 hover:border-gold-500/50 border border-black/10 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-gold-500" />
                  <span>Try Interactive Demo</span>
                </button>
              )}

              <button
                onClick={handleLaunchInstalledApp}
                className="flex-1 py-2.5 px-3 rounded-xl bg-ivory-200 dark:bg-obsidian-850 hover:border-gold-500/50 border border-black/10 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center space-x-1.5"
                title="Launch already-installed desktop application"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gold-500" />
                <span>Open Desktop App</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-ivory-200/80 dark:bg-obsidian-950/80 border-t border-gold-500/15 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-6">
          <span>Compatible with Windows 10 & 11 (64-bit)</span>
          <span className="font-mono text-gold-600 dark:text-gold-400 font-semibold">v1.0.0 Production</span>
        </div>
      </div>
    </div>
  );
}
