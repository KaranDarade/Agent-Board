import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  ExternalLink,
  Laptop
} from 'lucide-react';

export default function DownloadAppModal({ isOpen, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    // Trigger download of windows installer from server
    window.location.href = '/api/download/desktop';
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 rounded-2xl shadow-gold-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-ivory-200 dark:bg-obsidian-950 border-b border-gold-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Download Agent Board</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Native Desktop App for Windows</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-xl bg-gradient-to-br from-gold-500/10 via-transparent to-transparent border border-gold-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gold-600 dark:text-gold-400 font-mono">
                  Windows 10 / 11 (64-bit)
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  Agent Board v1.0.0
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                Ready for Download
              </span>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-xs flex items-center justify-center space-x-2 transition shadow-gold-sm hover:scale-[1.01]"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Preparing Installer...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download for Windows (.exe)</span>
                </>
              )}
            </button>
          </div>

          {/* Value Props & Safety Assurance */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">100% Private & Antivirus Safe</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Standard per-user installation without elevated administrative rights. Scans only local agent databases on your machine.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <RefreshCw className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Silent Background Auto-Updates</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  When new model configurations or engine updates are released, Agent Board updates in the background automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Cpu className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Zero Terminal Setup</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Runs natively in your system tray like Slack or VS Code. No need to open PowerShell or run npm start.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-ivory-200 dark:bg-obsidian-950 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span>Version 1.0.0 • Verified Safe</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
