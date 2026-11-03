import React, { useState } from 'react';
import { 
  Download, 
  Laptop, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Zap, 
  Activity, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ExternalLink, 
  Play, 
  Check, 
  Eye, 
  ChevronRight, 
  Sliders, 
  HardDrive, 
  Lock, 
  RefreshCw,
  FolderCode,
  Copy
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import VideoWalkthroughPlayer from './VideoWalkthroughPlayer.jsx';
import DesktopRequiredModal from './DesktopRequiredModal.jsx';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function ShowcaseLanding({ 
  onLaunchDemo, 
  onOpenDownload, 
  onSwitchToDashboard, 
  isLocalHost,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onSignOut,
  openDesktopModalInitially = false
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [downloading, setDownloading] = useState(false);
  const [desktopRequiredOpen, setDesktopRequiredOpen] = useState(() => {
    if (openDesktopModalInitially) return true;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('mode') === 'operational' || p.get('required') === 'desktop') return true;
    }
    return false;
  });
  const [copiedClone, setCopiedClone] = useState(false);

  const releaseDownloadUrl = 'https://github.com/KaranDarade/Agent-Board/releases/download/v1.0.0/Agent.Board.Setup.1.0.0.exe';
  const repoUrl = 'https://github.com/KaranDarade/Agent-Board';

  const handleDirectDownload = () => {
    setDownloading(true);
    if (isLocalHost) {
      window.location.href = '/api/download/desktop';
    } else {
      window.location.href = releaseDownloadUrl;
    }
    setTimeout(() => setDownloading(false), 2000);
  };

  const engines = [
    {
      name: 'OpenCode Interpreter',
      badge: 'CLI & Local Server',
      icon: Terminal,
      color: 'from-amber-500/20 to-gold-500/10 text-gold-500 border-gold-500/30',
      description: 'Reads local SQLite databases (WAL mode), parses active tool invocations, and streams sub-second agent thought traces.',
      features: ['Real-time SQLite introspection', 'Sub-800ms prompt interception', 'Full AST tool execution cards']
    },
    {
      name: 'Claude Code',
      badge: 'Anthropic CLI',
      icon: Sparkles,
      color: 'from-amber-600/20 to-orange-500/10 text-amber-500 border-amber-500/30',
      description: 'Integrates directly with Claude Code project transcripts and multi-step task workflows on your local development machine.',
      features: ['Live cost & token tracking', 'PLAN ⇄ BUILD mode toggling', 'Hierarchical task completion']
    },
    {
      name: 'Cursor AI',
      badge: 'Composer & IDE',
      icon: Cpu,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30',
      description: 'Monitors Cursor composer states, active project workspaces, and multi-file code editing sessions seamlessly.',
      features: ['Workspace context resolution', 'State synchronization', 'Background task monitoring']
    },
    {
      name: 'Antigravity',
      badge: 'Autonomous Agent Fleet',
      icon: Zap,
      color: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/30',
      description: 'Full autonomy mission control with dynamic model reallocation, subagent tree tracking, and supervisor steering.',
      features: ['Subagent tree hierarchy', 'Model allocation on the fly', 'Cloud replica synchronization']
    }
  ];

  const features = [
    {
      title: 'Sub-Second Agent Steering',
      tag: '< 800ms Latency',
      desc: 'Send high-priority instructions, stop runaway loops, or inject contextual steers directly into running CLI agents without killing their sessions.',
      icon: Zap
    },
    {
      title: 'Dynamic PLAN ⇄ BUILD Modes',
      tag: 'One-Click Toggle',
      desc: 'Instantly lock agents into architectural planning mode to review blueprints before unleashing file-modifying build commands.',
      icon: Sliders
    },
    {
      title: 'Fleet Telemetry & Cost Cockpit',
      tag: 'Real-Time ROI',
      desc: 'Track aggregate token consumption (formatted cleanly in Millions/Thousands) and dollar spend per session, engine, or workspace.',
      icon: Activity
    },
    {
      title: '100% Local-First Privacy',
      tag: 'Zero Cloud Leakage',
      desc: 'All source code, prompts, tokens, and SQLite database records stay exclusively on your local machine. No external servers required.',
      icon: Lock
    },
    {
      title: 'Hierarchical Task Manager',
      tag: 'Priority Checklist',
      desc: 'Manage agent task lists with HIGH, MEDIUM, and LOW priority weights. Monitor completion checklists in real time as agents progress.',
      icon: CheckCircle2
    },
    {
      title: 'Native Windows System Tray',
      tag: 'Zero Terminal Hassle',
      desc: 'Runs silently in the Windows background like Slack or VS Code. No need to keep terminal windows open or execute npm start commands.',
      icon: Laptop
    }
  ];

  return (
    <div className="min-h-screen bg-ivory-50 dark:bg-obsidian-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Banner / Announcement */}
      <div className="bg-gradient-to-r from-gold-500/10 via-gold-500/20 to-gold-500/10 border-b border-gold-500/20 py-2 px-4 text-center text-xs font-medium text-gold-600 dark:text-gold-400">
        <span className="inline-flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span><strong>Agent Board v1.0.0 is officially released!</strong> Download the native Windows desktop app for local agent orchestration.</span>
        </span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-ivory-100/90 dark:bg-obsidian-900/90 border-b border-gold-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Version */}
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold-sm shrink-0 group-hover:scale-105 transition">
              <Laptop className="w-5 h-5 text-obsidian-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-mono group-hover:text-gold-500 transition">
                  AGENT<span className="text-gold-500">BOARD</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-500/15 text-gold-600 dark:text-gold-400 border border-gold-500/30">
                  v1.0.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:block">Autonomous Fleet Mission Control</p>
            </div>
          </div>

          {/* Center Navigation Tabs (Pill Capsule with generous spacing) */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-ivory-200/60 dark:bg-obsidian-950/70 border border-gold-500/20 rounded-2xl text-xs font-semibold shrink-0 shadow-inner mx-auto">
            <a 
              href="#walkthrough" 
              className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gold-500 hover:bg-gold-500/10 transition whitespace-nowrap"
            >
              Video Tour
            </a>
            <a 
              href="#features" 
              className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gold-500 hover:bg-gold-500/10 transition whitespace-nowrap"
            >
              Features
            </a>
            <a 
              href="#engines" 
              className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gold-500 hover:bg-gold-500/10 transition whitespace-nowrap"
            >
              Supported Engines
            </a>
            <a 
              href="#github-repo" 
              className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gold-500 hover:bg-gold-500/10 transition whitespace-nowrap"
            >
              GitHub
            </a>
          </nav>

          {/* Right Action Toolbar */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 ml-auto">
            <ThemeToggle />

            <a
              href="https://github.com/KaranDarade/Agent-Board"
              target="_blank"
              rel="noreferrer"
              className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-ivory-200 dark:bg-obsidian-900 hover:text-gold-500 text-xs font-semibold border border-black/10 dark:border-white/10 transition whitespace-nowrap"
              title="View on GitHub"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Star</span>
            </a>

            {currentUser ? (
              <>
                <button
                  onClick={() => setDesktopRequiredOpen(true)}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gold-500 text-obsidian-950 hover:bg-gold-400 transition shadow-sm whitespace-nowrap"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Launch Desktop</span>
                </button>
                <button
                  onClick={onOpenProfile}
                  className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-xl bg-ivory-200 dark:bg-obsidian-850 border border-gold-500/30 text-xs font-semibold whitespace-nowrap"
                  title="Account Settings"
                >
                  <div className="w-6 h-6 rounded-full bg-gold-500 text-obsidian-950 flex items-center justify-center font-bold text-[11px]">
                    {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-xs">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenAuth && onOpenAuth('signin')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-gold-500 border border-black/10 dark:border-white/10 hover:border-gold-500/30 transition whitespace-nowrap"
              >
                Sign In
              </button>
            )}

            <button
              onClick={onLaunchDemo}
              className="hidden xl:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-ivory-200 dark:bg-obsidian-800 text-slate-900 dark:text-white hover:border-gold-500/40 border border-black/10 dark:border-white/10 transition shadow-sm whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 text-gold-500" />
              <span>Interactive Demo</span>
            </button>

            <button
              onClick={handleDirectDownload}
              disabled={downloading}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 shadow-gold-sm transition hover:scale-[1.02] whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Download Desktop (.exe)</span>
              <span className="sm:hidden">Download</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gold-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-xs font-mono text-gold-600 dark:text-gold-400 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-ping" />
            <span>Native Desktop Workstation • Windows 10/11 • Local App Required</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Mission Control for <br className="hidden sm:inline" />
            <span className="text-gold-gradient">AI Coding Agents</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            Stop juggling fragmented terminal windows. Monitor token spend, switch modes on the fly, 
            and steer <strong className="text-slate-900 dark:text-white">OpenCode, Claude Code, Cursor, and Antigravity</strong> with sub-second precision from one native desktop cockpit.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleDirectDownload}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-sm flex items-center justify-center space-x-3 shadow-gold-md hover:scale-[1.02] transition"
            >
              <Download className="w-5 h-5 text-obsidian-950 stroke-[2.5]" />
              <span>Download Desktop App (.exe)</span>
            </button>

            <button
              onClick={onLaunchDemo}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-ivory-200 dark:bg-obsidian-900 hover:bg-ivory-300 dark:hover:bg-obsidian-850 text-slate-900 dark:text-white border border-gold-500/30 font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition hover:scale-[1.01]"
            >
              <Eye className="w-4 h-4 text-gold-500" />
              <span>Try Interactive Demo</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => setDesktopRequiredOpen(true)}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-transparent hover:bg-gold-500/10 text-gold-500 border border-gold-500/30 font-bold text-sm flex items-center justify-center space-x-2 transition"
              >
                <Laptop className="w-4 h-4" />
                <span>Open Desktop Workstation</span>
              </button>
            ) : (
              <a
                href="https://github.com/KaranDarade/Agent-Board"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-transparent hover:bg-gold-500/10 text-gold-500 border border-gold-500/20 font-bold text-sm flex items-center justify-center space-x-2 transition"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub Source</span>
              </a>
            )}
          </div>

          {/* Trust badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Local Privacy</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-gold-500" />
              <span>Native SQLite Discovery</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Sub-800ms Steering</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Laptop className="w-4 h-4 text-blue-500" />
              <span>Zero Terminal Setup</span>
            </div>
          </div>
        </div>

        {/* Real Desktop Tool Interactive Video Walkthrough & Screenshots */}
        <div id="walkthrough" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <VideoWalkthroughPlayer 
            onOpenDownload={handleDirectDownload}
            onLaunchDemo={onLaunchDemo}
          />
        </div>
      </section>

      {/* Supported Engines Section */}
      <section id="engines" className="py-16 bg-ivory-100 dark:bg-obsidian-900/50 border-y border-gold-500/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-gold-500 uppercase tracking-wider">Multi-Engine Architecture</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Unified Support for Modern AI Agents</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Agent Board automatically scans and discovers local sessions from top coding tools without requiring manual API configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {engines.map((eng, idx) => {
              const IconComp = eng.icon;
              return (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl bg-ivory-50 dark:bg-obsidian-950 border border-gold-500/20 hover:border-gold-500/40 transition-all space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${eng.color} border flex items-center justify-center`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{eng.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400">{eng.badge}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {eng.description}
                  </p>

                  <ul className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                    {eng.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                        <Check className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-gold-500 uppercase tracking-wider">Features & Capabilities</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Built for Elite Agent Developers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need to orchestrate, steer, monitor, and scale multiple AI agents running simultaneously.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/20 hover:border-gold-500/40 transition-all space-y-3 shadow-sm hover:shadow-gold-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20">
                    {feat.tag}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{feat.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* System Architecture Section */}
      <section id="architecture" className="py-16 bg-ivory-100 dark:bg-obsidian-900/50 border-y border-gold-500/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-gold-500 uppercase tracking-wider">Under The Hood</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Local-First Process Architecture</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              How Agent Board achieves sub-800ms steering without intermediate cloud relays or invasive agents.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-ivory-50 dark:bg-obsidian-950 border border-gold-500/30 shadow-gold-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-black/5 dark:border-white/5 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-gold-500">
                  <HardDrive className="w-4 h-4" />
                  <span>1. Local Discovery</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Zero-Config DB Scanners</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Direct connection via Node.js SQLite with Write-Ahead Logging (WAL) mode enables concurrent inspection without locking agent databases.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-black/5 dark:border-white/5 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-500">
                  <Zap className="w-4 h-4" />
                  <span>2. Sub-Second Steering</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Subprocess Interceptors</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Steering commands are delivered directly to the local CLI process standard input with sub-800ms execution times and immediate SSE streaming.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-black/5 dark:border-white/5 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-blue-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Complete Isolation</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Electron Context Isolation</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The desktop app runs in an isolated context sandbox with zero node integration in renderer windows for total security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation & Download CTA Section */}
      <section id="installation" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-gold-500/15 via-ivory-100 dark:via-obsidian-900 to-ivory-50 dark:to-obsidian-950 border border-gold-500/40 shadow-gold-lg text-center space-y-8 relative overflow-hidden">
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gold-500/20 text-gold-600 dark:text-gold-400 border border-gold-500/30">
              WINDOWS 10 & 11 (64-BIT)
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Get Started with Agent Board Today
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
              Download the official native desktop installer. No cloud subscription or complex API setup required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDirectDownload}
              disabled={downloading}
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-base flex items-center justify-center space-x-3 shadow-gold-md hover:scale-[1.02] transition"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Preparing Download...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Download Desktop Installer (.exe)</span>
                </>
              )}
            </button>

            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-ivory-200 dark:bg-obsidian-850 hover:bg-ivory-300 dark:hover:bg-obsidian-800 text-slate-900 dark:text-white border border-gold-500/30 font-bold text-sm flex items-center justify-center space-x-2 transition"
            >
              <GithubIcon className="w-4 h-4" />
              <span>View on GitHub</span>
            </a>
          </div>

          {/* 3 Step Quickstart */}
          <div className="pt-6 border-t border-gold-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-3.5 rounded-xl bg-ivory-100/50 dark:bg-obsidian-950/60 border border-gold-500/20 space-y-1">
              <span className="text-[10px] font-mono font-bold text-gold-500">STEP 1</span>
              <h5 className="font-bold text-xs text-slate-900 dark:text-white">Download & Install</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Run the single-click Windows installer (111 MB).</p>
            </div>
            <div className="p-3.5 rounded-xl bg-ivory-100/50 dark:bg-obsidian-950/60 border border-gold-500/20 space-y-1">
              <span className="text-[10px] font-mono font-bold text-gold-500">STEP 2</span>
              <h5 className="font-bold text-xs text-slate-900 dark:text-white">Auto-Detection</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Agent Board discovers running OpenCode, Claude & Cursor agents.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-ivory-100/50 dark:bg-obsidian-950/60 border border-gold-500/20 space-y-1">
              <span className="text-[10px] font-mono font-bold text-gold-500">STEP 3</span>
              <h5 className="font-bold text-xs text-slate-900 dark:text-white">Start Orchestrating</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Steer, switch modes, and manage your fleet seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Repository Showcase Section */}
      <section id="github-repo" className="py-20 border-t border-gold-500/20 bg-ivory-100/60 dark:bg-obsidian-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-ivory-200 dark:bg-obsidian-800 border border-gold-500/30 text-xs font-mono text-gold-500">
              <GithubIcon className="w-3.5 h-3.5" />
              <span>100% Free & Open Source</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Crafted in Public on <span className="text-gold-gradient">GitHub</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Inspect the source code, verify 100% local database privacy, review release binaries, or contribute to the next evolution of AI Agent Cockpits.
            </p>
          </div>

          <div className="bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/30 rounded-3xl p-6 sm:p-8 shadow-gold-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold shadow-md">
                  <GithubIcon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="font-mono font-black text-lg text-slate-900 dark:text-white">
                      KaranDarade / Agent-Board
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                      Public
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Universal Mission Control & Sub-Second Steering for Autonomous AI Coding Agents
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <a
                  href="https://github.com/KaranDarade/Agent-Board"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-obsidian-850 hover:bg-gold-500/10 border border-black/10 dark:border-white/10 hover:border-gold-500/40 text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2 transition"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>Star on GitHub</span>
                </a>
                <a
                  href="https://github.com/KaranDarade/Agent-Board/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-obsidian-950 text-xs font-black flex items-center space-x-2 transition shadow-gold-sm"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Releases (.exe)</span>
                </a>
              </div>
            </div>

            {/* Quick Clone Snippet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 p-4 rounded-2xl bg-obsidian-900 border border-gold-500/20 text-slate-300 font-mono flex items-center justify-between">
                <div className="flex items-center space-x-2 overflow-x-auto select-all">
                  <span className="text-gold-500 select-none">$</span>
                  <code className="truncate font-mono">git clone https://github.com/KaranDarade/Agent-Board.git</code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('git clone https://github.com/KaranDarade/Agent-Board.git');
                    setCopiedClone(true);
                    setTimeout(() => setCopiedClone(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 font-bold ml-3 shrink-0 flex items-center space-x-1"
                >
                  {copiedClone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedClone ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/20 flex items-center justify-around text-center">
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white font-mono">MIT</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">License</div>
                </div>
                <div className="h-8 border-r border-black/10 dark:border-white/10" />
                <div>
                  <div className="text-base font-black text-gold-500 font-mono">v1.0.0</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Latest Tag</div>
                </div>
                <div className="h-8 border-r border-black/10 dark:border-white/10" />
                <div>
                  <div className="text-base font-black text-emerald-500 font-mono">Win x64</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Installer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold-500/20 py-8 bg-ivory-100 dark:bg-obsidian-950 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div 
            onClick={() => {
              if (window.location.pathname === '/' && !window.location.search && !window.location.hash) {
                window.location.reload();
              } else {
                window.location.href = '/';
              }
            }}
            className="flex items-center space-x-2 cursor-pointer hover:text-gold-500 transition"
            title="Refresh and return to homepage"
          >
            <span className="font-mono font-bold text-slate-900 dark:text-white">AGENT BOARD</span>
            <span>• Built for Autonomous Multi-Engine Fleet Orchestration</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold-500 transition flex items-center space-x-1">
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <a href="#features" className="hover:text-gold-500 transition">Features</a>
            <a href="#installation" className="hover:text-gold-500 transition">Download</a>
            <span className="text-slate-400">v1.0.0</span>
          </div>
        </div>
      </footer>

      <DesktopRequiredModal 
        isOpen={desktopRequiredOpen} 
        onClose={() => setDesktopRequiredOpen(false)} 
        onLaunchDemo={onLaunchDemo} 
      />
    </div>
  );
}
