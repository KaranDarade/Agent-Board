import React, { useState, useEffect } from 'react';
import { X, Smartphone, Copy, Check, Wifi, Globe, Shield, Terminal, Clock } from 'lucide-react';

export default function MobileAccessModal({ onClose }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/network')
      .then(r => r.json())
      .then(data => setNetworkInfo(data))
      .catch(e => console.error(e));
  }, []);

  const handleCopy = () => {
    if (!networkInfo?.mobileUrl) return;
    navigator.clipboard.writeText(networkInfo.mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 rounded-2xl shadow-gold-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gold-500/20 bg-ivory-200 dark:bg-obsidian-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Mobile & 24/7 Remote Access</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Open Agent Board on any phone or tablet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300">
          {/* LAN URL Box */}
          <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gold-700 dark:text-gold-300 flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-gold-500" />
                <span>Local Wi-Fi Network Address:</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                0.0.0.0 LISTENING
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={networkInfo?.mobileUrl || 'Detecting network IP...'}
                className="flex-1 bg-ivory-100 dark:bg-obsidian-950 border border-gold-500/30 rounded-lg p-2.5 font-mono text-xs text-slate-900 dark:text-gold-200 focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-bold transition shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Make sure your phone is connected to the same Wi-Fi router, then open this link in Safari or Chrome.
            </p>
          </div>

          {/* 24/7 Hosting Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-500" />
              <span>How to Keep Active 24/7 on your PC</span>
            </h4>

            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-ivory-200 dark:bg-obsidian-850 border border-black/5 dark:border-white/5 space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-gold-500" />
                  <span>Option 1: Run with PM2 (Recommended)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  PM2 runs Node apps silently in the background and restarts on system reboot:
                </p>
                <pre className="p-2 rounded bg-black/80 text-gold-300 font-mono text-[10px] overflow-x-auto">
                  npm install -g pm2{"\n"}pm2 start server/index.js --name "agent-board"{"\n"}pm2 save
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-ivory-200 dark:bg-obsidian-850 border border-black/5 dark:border-white/5 space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gold-500" />
                  <span>Option 2: Access from Outside Home (Tailscale or Cloudflare)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Install free <strong>Tailscale</strong> on your PC & phone, or run <code>cloudflared tunnel --url http://localhost:3001</code> to access securely from cellular data anywhere in the world!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-ivory-200 dark:bg-obsidian-950 border-t border-gold-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-bold text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
