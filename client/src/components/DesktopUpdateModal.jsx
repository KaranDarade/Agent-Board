import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  DownloadCloud, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  Cpu, 
  ExternalLink,
  Laptop
} from 'lucide-react';

export default function DesktopUpdateModal({ isOpen, onClose }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'latest' | 'error'
  const [version, setVersion] = useState('1.0.0');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined' && window.agentBoardDesktop) {
      const unsubStatus = window.agentBoardDesktop.onUpdateStatus?.((data) => {
        if (data.status) setStatus(data.status);
        if (data.version) setVersion(data.version);
        if (data.message) setMessage(data.message);
      });

      const unsubProgress = window.agentBoardDesktop.onUpdateProgress?.((data) => {
        setStatus('downloading');
        if (typeof data.percent === 'number') {
          setProgress(data.percent);
        }
      });

      return () => {
        unsubStatus?.();
        unsubProgress?.();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckNow = () => {
    setStatus('checking');
    setMessage('Connecting to update servers...');
    setProgress(0);
    if (typeof window !== 'undefined' && window.agentBoardDesktop?.checkForUpdates) {
      window.agentBoardDesktop.checkForUpdates();
    } else {
      // Browser fallback simulation
      setTimeout(() => {
        setStatus('latest');
        setMessage('Agent Board is running the latest production build (v1.0.0).');
      }, 1000);
    }
  };

  const handleSimulateUpdate = () => {
    if (typeof window !== 'undefined' && window.agentBoardDesktop?.simulateUpdate) {
      window.agentBoardDesktop.simulateUpdate();
    } else {
      setStatus('checking');
      setTimeout(() => {
        setStatus('available');
        setVersion('1.0.1');
        setMessage('Version 1.0.1 available. Downloading update...');
        let pct = 0;
        const interval = setInterval(() => {
          pct += 25;
          setProgress(pct);
          if (pct >= 100) {
            clearInterval(interval);
            setStatus('ready');
            setMessage('Update ready to install. Restart to apply.');
          }
        }, 400);
      }, 700);
    }
  };

  const handleInstallAndRestart = () => {
    if (typeof window !== 'undefined' && window.agentBoardDesktop?.installUpdate) {
      window.agentBoardDesktop.installUpdate();
    } else {
      alert('In native desktop app, this will restart Agent Board and apply the update automatically.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/40 rounded-2xl max-w-md w-full shadow-gold-lg overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 bg-ivory-200/50 dark:bg-obsidian-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <DownloadCloud className="w-4 h-4 text-gold-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Software Updates</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Agent Board Desktop Cockpit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Version Info Card */}
          <div className="p-4 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Release</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">Agent Board v{version}</div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gold-500/15 text-gold-600 dark:text-gold-400 border border-gold-500/30">
              Desktop Native
            </span>
          </div>

          {/* Status Display Area */}
          {status === 'idle' && (
            <div className="text-center py-4 space-y-2">
              <Laptop className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Check GitHub releases for the latest telemetry features, agent patches, and speed improvements.
              </p>
            </div>
          )}

          {status === 'checking' && (
            <div className="text-center py-5 space-y-3">
              <RefreshCw className="w-8 h-8 text-gold-500 animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {message || 'Checking for updates...'}
              </div>
              <p className="text-[11px] text-slate-500">Querying release manifest...</p>
            </div>
          )}

          {status === 'latest' && (
            <div className="text-center py-4 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                You are on the latest version!
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {message || `Agent Board v${version} is completely up to date.`}
              </p>
            </div>
          )}

          {status === 'available' && (
            <div className="text-center py-4 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-gold-500/15 border border-gold-500/40 flex items-center justify-center mx-auto text-gold-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                New Version Available: v{version}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {message || 'Downloading update package in the background...'}
              </p>
            </div>
          )}

          {status === 'downloading' && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Downloading Update...</span>
                <span className="font-mono text-gold-500 font-black">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-ivory-300 dark:bg-obsidian-950 rounded-full overflow-hidden border border-black/10 dark:border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                The update is downloading automatically. You will be prompted to restart when ready.
              </p>
            </div>
          )}

          {status === 'ready' && (
            <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/40 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-gold-500 text-obsidian-950 flex items-center justify-center mx-auto shadow-gold-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gold-600 dark:text-gold-300">Update Ready to Install!</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Agent Board v{version} has been downloaded and verified. Restart the application now to apply the upgrade.
                </p>
              </div>
              <button
                onClick={handleInstallAndRestart}
                className="w-full py-2.5 rounded-xl font-black text-xs bg-gold-500 text-obsidian-950 hover:bg-gold-400 transition shadow-gold-sm"
              >
                Restart & Apply Update Now
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-rose-600 dark:text-rose-400">
                Update Check Failed
              </div>
              <p className="text-[11px] text-slate-500">
                {message || 'Could not connect to GitHub releases. Please check your network.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleSimulateUpdate}
              className="text-[11px] text-slate-400 hover:text-gold-500 transition underline underline-offset-2"
              title="Test the update progress and restart prompt"
            >
              Simulate Update Cycle
            </button>

            <button
              onClick={handleCheckNow}
              disabled={status === 'checking' || status === 'downloading'}
              className="px-4 py-2 rounded-xl text-xs font-black bg-ivory-200 dark:bg-obsidian-950 hover:bg-gold-500 hover:text-obsidian-950 text-slate-800 dark:text-slate-200 border border-gold-500/30 transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin text-gold-500' : ''}`} />
              <span>{status === 'checking' ? 'Checking...' : 'Check for Updates'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
