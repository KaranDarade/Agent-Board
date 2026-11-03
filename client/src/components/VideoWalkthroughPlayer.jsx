import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sparkles, 
  Download, 
  Eye, 
  Laptop, 
  ChevronRight, 
  Image as ImageIcon, 
  Film, 
  CheckCircle2, 
  ExternalLink,
  X,
  Zap,
  Sliders,
  Terminal,
  Activity,
  HardDrive
} from 'lucide-react';

export default function VideoWalkthroughPlayer({ onOpenDownload, onLaunchDemo }) {
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'screenshots'
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  const videoRef = useRef(null);

  const steps = [
    {
      time: 0,
      title: 'Download & Setup',
      tag: '0:00',
      desc: 'One-click Windows .exe installer download and setup instructions.',
      icon: Download
    },
    {
      time: 4,
      title: 'Workstation Auth',
      tag: '0:04',
      desc: 'Dedicated desktop sign-in and account creation with real Google OAuth 2.0.',
      icon: HardDrive
    },
    {
      time: 8,
      title: 'Fleet Cockpit & KPIs',
      tag: '0:08',
      desc: 'Real-time token counters, aggregate cost burn, and multi-tool session grid.',
      icon: Activity
    },
    {
      time: 12,
      title: 'PLAN ⇄ BUILD Switch',
      tag: '0:12',
      desc: 'Instant architecture locking to review plans before executing code changes.',
      icon: Sliders
    },
    {
      time: 16,
      title: 'Model Allocation',
      tag: '0:16',
      desc: 'Reallocate reasoning models (Claude 3.7 Sonnet, DeepSeek v4.1, GLM) on the fly.',
      icon: Sparkles
    },
    {
      time: 20,
      title: 'Deep AST Inspector',
      tag: '0:20',
      desc: 'Inspect parsed tool invocation cards, active file changes, and thought traces.',
      icon: Terminal
    },
    {
      time: 24,
      title: 'Sub-Second Steering',
      tag: '0:24',
      desc: 'Inject sub-second high-priority steering instructions without killing processes.',
      icon: Zap
    },
    {
      time: 28,
      title: 'Mobile LAN Companion',
      tag: '0:28',
      desc: 'Monitor agent fleet and inject directives from your phone over local Wi-Fi.',
      icon: Laptop
    }
  ];

  const screenshots = [
    {
      id: 1,
      file: '/screenshots/1-desktop-auth.png',
      title: 'Native Desktop Workstation First-Run',
      desc: 'Dedicated desktop sign-in screen featuring real Google OAuth 2.0 and local engine health beacons.'
    },
    {
      id: 2,
      file: '/screenshots/2-fleet-overview.png',
      title: 'Universal Fleet Mission Control',
      desc: 'Unified KPI telemetry across OpenCode, Claude Code, Cursor, and Antigravity with live active agents.'
    },
    {
      id: 3,
      file: '/screenshots/3-mode-switcher.png',
      title: 'Dynamic PLAN ⇄ BUILD Mode Switcher',
      desc: 'One-click role toggle locking agents into planning mode to safeguard critical codebases.'
    },
    {
      id: 4,
      file: '/screenshots/4-model-allocator.png',
      title: 'Dynamic Model Allocation Modal',
      desc: 'Curated model catalog to switch reasoning engines mid-session based on task complexity.'
    },
    {
      id: 5,
      file: '/screenshots/5-session-inspector.png',
      title: 'Session Inspector & AST Execution Cards',
      desc: 'Granular tool execution telemetry showing parameters, stdout output, and agent thought streams.'
    },
    {
      id: 6,
      file: '/screenshots/6-prompt-steering.png',
      title: 'Sub-Second Agent Steering Drawer',
      desc: 'Non-blocking prompt injection mechanism sending commands directly into running CLI agents.'
    },
    {
      id: 7,
      file: '/screenshots/7-task-board.png',
      title: 'Hierarchical Task Checklist & Mobile Companion',
      desc: 'Task management with priority levels and 24/7 local Wi-Fi mobile monitoring coordinates.'
    }
  ];

  // Sync active step based on video playback time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    for (let i = steps.length - 1; i >= 0; i--) {
      if (current >= steps[i].time) {
        setActiveStepIndex(i);
        break;
      }
    }
  };

  const jumpToStep = (index) => {
    if (!videoRef.current) return;
    setActiveStepIndex(index);
    videoRef.current.currentTime = steps[index].time;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    videoRef.current.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2 bg-ivory-200 dark:bg-obsidian-900 p-1.5 rounded-2xl border border-gold-500/20 text-xs font-bold shadow-sm">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Interactive Video Walkthrough (30s)</span>
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'screenshots'
                ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>High-Res Desktop Screenshots (7)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-gold-600 dark:text-gold-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>REAL RECORDING FROM DESKTOP WORKSTATION</span>
        </div>
      </div>

      {/* Main Showcase Panel */}
      <div className="relative rounded-3xl border border-gold-500/35 bg-obsidian-950/95 p-3 sm:p-4 shadow-gold-lg overflow-hidden group">
        {/* Native Window Titlebar */}
        <div className="h-10 px-4 rounded-2xl bg-obsidian-900/95 border border-white/5 flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-400 pl-2">
              Agent Board Desktop Workstation — Autonomous Fleet Mission Control
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono text-gold-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>4 ENGINES CONNECTED</span>
            </span>
          </div>
        </div>

        {/* Tab 1: Video Player Walkthrough */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-gold-500/20 group/video shadow-inner">
              <video
                ref={videoRef}
                src="/video/agent-board-walkthrough.webm"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* Floating Play/Pause Center Indicator on hover */}
              <div 
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity bg-black/30 pointer-events-none"
              >
                <div className="w-16 h-16 rounded-full bg-gold-500/90 text-obsidian-950 flex items-center justify-center shadow-gold-md pointer-events-auto cursor-pointer hover:scale-110 transition">
                  {isPlaying ? <Pause className="w-7 h-7 fill-obsidian-950" /> : <Play className="w-7 h-7 fill-obsidian-950 translate-x-0.5" />}
                </div>
              </div>

              {/* Floating Bottom Video Controls Bar */}
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-obsidian-950/85 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs text-white">
                <div className="flex items-center space-x-3">
                  <button onClick={togglePlay} className="p-1 hover:text-gold-400 transition">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button onClick={toggleMute} className="p-1 hover:text-gold-400 transition">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="font-mono text-[11px] text-slate-300">
                    Step {activeStepIndex + 1} of {steps.length}: <strong className="text-gold-400">{steps[activeStepIndex]?.title}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={changeSpeed}
                    className="px-2 py-0.5 rounded font-mono text-[11px] bg-white/10 hover:bg-white/20 text-gold-300 transition"
                  >
                    {playbackSpeed}x Speed
                  </button>
                  <button onClick={toggleFullscreen} className="p-1 hover:text-gold-400 transition">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Step Timeline Bar */}
            <div className="p-4 rounded-2xl bg-obsidian-900/90 border border-gold-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  <span>Click any step below to jump to that live feature demo:</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {steps[activeStepIndex]?.tag} / 0:30
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = activeStepIndex === idx;
                  return (
                    <button
                      key={step.title}
                      onClick={() => jumpToStep(idx)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isActive
                          ? 'bg-gold-500/20 border-gold-500 text-white shadow-gold-sm scale-[1.02]'
                          : 'bg-obsidian-950/80 border-white/5 text-slate-400 hover:text-white hover:border-gold-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : 'text-slate-500'}`} />
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-gold-500 text-obsidian-950 font-bold' : 'bg-white/5'}`}>
                          {step.tag}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold truncate">{step.title}</div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-obsidian-950/80 border border-gold-500/15 flex items-center justify-between text-xs text-slate-300">
                <span className="font-normal">{steps[activeStepIndex]?.desc}</span>
                <button
                  onClick={onOpenDownload}
                  className="shrink-0 flex items-center space-x-1 text-gold-400 hover:text-gold-300 font-bold ml-4"
                >
                  <span>Download to use this</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: High-Resolution Screenshot Gallery */}
        {activeTab === 'screenshots' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {screenshots.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedScreenshot(s)}
                  className="group/card relative rounded-2xl overflow-hidden border border-gold-500/20 bg-obsidian-900 cursor-pointer hover:border-gold-500/50 transition hover:scale-[1.01] shadow-sm"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-black">
                    <img
                      src={s.file}
                      alt={s.title}
                      className="w-full h-full object-cover object-top group-hover/card:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white truncate">{s.title}</h4>
                      <span className="text-[10px] font-mono text-gold-400">Click to zoom</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div 
            className="max-w-5xl w-full bg-obsidian-950 border border-gold-500/40 rounded-3xl p-4 shadow-gold-lg overflow-hidden space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-white">{selectedScreenshot.title}</h3>
                <p className="text-xs text-slate-400">{selectedScreenshot.desc}</p>
              </div>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 max-h-[75vh] bg-black">
              <img
                src={selectedScreenshot.file}
                alt={selectedScreenshot.title}
                className="w-full h-auto object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500 font-mono">1080p Native Workstation Screenshot</span>
              <button
                onClick={onOpenDownload}
                className="px-4 py-2 rounded-xl bg-gold-500 text-obsidian-950 font-bold text-xs hover:bg-gold-400 transition flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Desktop App to Run This</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
