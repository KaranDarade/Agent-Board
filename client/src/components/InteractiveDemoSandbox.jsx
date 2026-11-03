import React, { useState } from 'react';
import { 
  Download, 
  ArrowLeft, 
  Search, 
  LayoutGrid, 
  List, 
  Folder, 
  Sparkles, 
  Terminal, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Laptop, 
  Sliders, 
  X,
  Plus,
  Radio,
  ExternalLink,
  ChevronRight,
  Eye
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

export default function InteractiveDemoSandbox({ onBackToLanding, onOpenDownload }) {
  const [engineFilter, setEngineFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerMessage, setBannerMessage] = useState(null);
  const [inspectingSession, setInspectingSession] = useState(null);
  const [showSteerModal, setShowSteerModal] = useState(false);

  const showBanner = (msg) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 3500);
  };

  const initialSessions = [
    {
      id: 'demo-opencode-01',
      title: 'Refactor Auth Middleware & Token Rotation',
      tool: 'opencode',
      toolName: 'OpenCode Interpreter',
      role: 'plan',
      agentRole: 'plan',
      model: 'deepseek-r1',
      status: 'active',
      workspace: 'AI Agent Dashboard',
      cost: 4.12,
      tokens: '6.2M',
      timeUpdated: 'Just now',
      tasks: [
        { id: 't1', title: 'Audit JWT expiration claims in server/auth.js', completed: true, priority: 'HIGH' },
        { id: 't2', title: 'Verify refresh token rotation and revocation list', completed: false, priority: 'HIGH' },
        { id: 't3', title: 'Validate rate-limiting threshold headers', completed: false, priority: 'MEDIUM' }
      ],
      conversation: [
        { role: 'user', text: 'Refactor auth middleware to support automatic token rotation and audit endpoint security.' },
        { role: 'thought', text: 'Inspecting server/auth.js and route declarations. We should verify SQLite session persistence before applying token rotation.' },
        { role: 'assistant', text: 'I have formulated the token rotation blueprint. Reviewing existing route handlers in plan mode before modifying code.' }
      ]
    },
    {
      id: 'demo-claude-02',
      title: 'Generate E2E Test Suite & Playwright Specs',
      tool: 'claude-code',
      toolName: 'Claude Code',
      role: 'build',
      agentRole: 'build',
      model: 'claude-3-7-sonnet',
      status: 'active',
      workspace: 'Core Engine Test',
      cost: 12.45,
      tokens: '18.4M',
      timeUpdated: '2m ago',
      tasks: [
        { id: 't4', title: 'Implement Playwright UI automation runner', completed: true, priority: 'HIGH' },
        { id: 't5', title: 'Add deep API validation for 18 endpoints', completed: true, priority: 'HIGH' },
        { id: 't6', title: 'Verify SSE fleet stream event dispatch', completed: true, priority: 'MEDIUM' }
      ],
      conversation: [
        { role: 'user', text: 'Run end-to-end tests across the entire application and report any regressions.' },
        { role: 'thought', text: 'Executing test harness against server endpoints. 129 checks passing. Zero unhandled errors detected.' },
        { role: 'assistant', text: 'All 129 automated test assertions passed successfully. Test report saved to workspace.' }
      ]
    },
    {
      id: 'demo-cursor-03',
      title: 'Stripe Billing Webhook & Subscription Sync',
      tool: 'cursor',
      toolName: 'Cursor AI',
      role: 'build',
      agentRole: 'build',
      model: 'gpt-4o',
      status: 'active',
      workspace: 'Billing Portal',
      cost: 6.80,
      tokens: '14.1M',
      timeUpdated: '12m ago',
      tasks: [
        { id: 't7', title: 'Parse customer.subscription.updated payload', completed: true, priority: 'HIGH' },
        { id: 't8', title: 'Handle signature verification in sandbox mode', completed: false, priority: 'MEDIUM' }
      ],
      conversation: [
        { role: 'user', text: 'Implement Stripe webhook handler with signature verification.' },
        { role: 'assistant', text: 'Webhook endpoint scaffolded with raw-body signature validation.' }
      ]
    },
    {
      id: 'demo-antigravity-04',
      title: 'Autonomous Codebase Refactoring Supervisor',
      tool: 'antigravity',
      toolName: 'Antigravity',
      role: 'plan',
      agentRole: 'plan',
      model: 'gemini-2.5-flash',
      status: 'active',
      workspace: 'Fleet Controller',
      cost: 3.72,
      tokens: '12.9M',
      timeUpdated: '25m ago',
      tasks: [
        { id: 't9', title: 'Decompose monolithic server into modular routers', completed: false, priority: 'HIGH' },
        { id: 't10', title: 'Benchmark subagent memory usage', completed: false, priority: 'LOW' }
      ],
      conversation: [
        { role: 'user', text: 'Analyze server structure and propose modular refactoring.' },
        { role: 'assistant', text: 'Identified 3 extraction candidates: fleet router, cloud sync worker, and steering dispatch.' }
      ]
    }
  ];

  const [sessions, setSessions] = useState(initialSessions);

  // Toggle Mode (PLAN ⇄ BUILD)
  const toggleMode = (sessionId) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const nextMode = s.role === 'plan' ? 'build' : 'plan';
        showBanner(`Demo session switched to ${nextMode.toUpperCase()} mode.`);
        return { ...s, role: nextMode, agentRole: nextMode };
      }
      return s;
    }));
  };

  // Toggle Task Completion
  const toggleTask = (sessionId, taskId) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const updatedTasks = s.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        return { ...s, tasks: updatedTasks };
      }
      return s;
    }));
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    if (engineFilter !== 'all' && s.tool !== engineFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchWorkspace = s.workspace.toLowerCase().includes(q);
      const matchModel = s.model.toLowerCase().includes(q);
      if (!matchTitle && !matchWorkspace && !matchModel) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-ivory-50 dark:bg-obsidian-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Demo Simulation Banner */}
      <div className="bg-obsidian-900 border-b border-gold-500/30 px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-500/20 text-gold-400 border border-gold-500/40">
            INTERACTIVE DEMO SANDBOX
          </span>
          <span className="text-slate-300 hidden sm:inline text-xs">
            Try clicking filters, inspecting agent thoughts, toggling PLAN ⇄ BUILD modes, and managing tasks!
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToLanding}
            className="flex items-center space-x-1 text-slate-300 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Showcase Home</span>
          </button>
          <button
            onClick={onOpenDownload}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 font-bold hover:scale-105 transition"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Download Desktop (.exe)</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {bannerMessage && (
        <div className="fixed top-16 right-6 z-50 p-3 rounded-xl bg-obsidian-900 border border-gold-500 text-gold-400 shadow-gold-md text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-gold-500" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Main Mission Control Header */}
      <header className="px-6 py-4 bg-ivory-100 dark:bg-obsidian-900 border-b border-gold-500/15 flex items-center justify-between gap-4">
        <div 
          onClick={() => {
            if (window.location.pathname === '/' && !window.location.search && !window.location.hash) {
              window.location.reload();
            } else {
              window.location.href = '/';
            }
          }}
          className="flex items-center space-x-3 shrink-0 cursor-pointer hover:opacity-90 transition select-none group"
          title="Refresh and return to homepage"
        >
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Radio className="w-5 h-5 text-gold-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white font-mono group-hover:text-gold-500 transition">
                AGENT<span className="text-gold-500">BOARD</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                LIVE DEMO FLEET
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">4 Engines Connected • Simulated Sandbox</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 ml-auto">
          <ThemeToggle />
          <button
            onClick={() => setShowSteerModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gold-500/10 text-gold-500 border border-gold-500/30 hover:bg-gold-500/20 text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Steer Agent</span>
          </button>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/20 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Active Fleet</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
              <span>{filteredSessions.length} AGENTS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/20 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Total Fleet Cost</span>
            <div className="text-2xl font-black text-gold-500 mt-1 font-mono">$27.09</div>
          </div>
          <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/20 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Total Tokens Burned</span>
            <div className="text-2xl font-black text-emerald-500 mt-1 font-mono">51.6M</div>
          </div>
          <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/20 shadow-sm">
            <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Steering Latency</span>
            <div className="text-2xl font-black text-blue-400 mt-1 font-mono">420ms</div>
          </div>
        </div>

        {/* Engine Tabs & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/20">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Engines (4)' },
              { id: 'opencode', label: 'OpenCode' },
              { id: 'claude-code', label: 'Claude Code' },
              { id: 'cursor', label: 'Cursor AI' },
              { id: 'antigravity', label: 'Antigravity' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEngineFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  engineFilter === tab.id
                    ? 'bg-gold-500 text-obsidian-950 shadow-gold-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-ivory-200 dark:bg-obsidian-950 border border-black/10 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-gold-500/50"
              />
            </div>

            <div className="flex items-center rounded-xl bg-ivory-200 dark:bg-obsidian-950 p-1 border border-black/10 dark:border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-gold-500 text-obsidian-950' : 'text-slate-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-gold-500 text-obsidian-950' : 'text-slate-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="p-5 rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/25 hover:border-gold-500/50 transition-all space-y-4 shadow-sm hover:shadow-gold-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                        {session.toolName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">• {session.workspace}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">
                      {session.title}
                    </h3>
                  </div>

                  {/* Mode Badge (Clickable) */}
                  <button
                    onClick={() => toggleMode(session.id)}
                    title="Click to toggle between PLAN and BUILD mode"
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition hover:scale-105 flex items-center space-x-1 ${
                      session.role === 'plan'
                        ? 'bg-amber-500/15 text-gold-500 border-gold-500/30'
                        : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    <span>{session.role.toUpperCase()} MODE</span>
                  </button>
                </div>

                {/* Tasks Checklist */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>TASKS ({session.tasks.filter(t => t.completed).length}/{session.tasks.length})</span>
                    <span className="text-[9px] text-gold-500">Click check to toggle</span>
                  </div>
                  <div className="space-y-1">
                    {session.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(session.id, task.id)}
                        className="flex items-center space-x-2 p-1.5 rounded-lg bg-ivory-200/60 dark:bg-obsidian-950/60 cursor-pointer hover:bg-gold-500/10 transition text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 accent-gold-500 rounded cursor-pointer"
                        />
                        <span className={`text-[11px] flex-1 ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {task.title}
                        </span>
                        <span className={`text-[9px] font-mono px-1 rounded ${task.priority === 'HIGH' ? 'text-red-400 bg-red-400/10' : 'text-slate-400'}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                      {session.model}
                    </span>
                    <span className="text-gold-500 font-bold">${session.cost} • {session.tokens}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setInspectingSession(session)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-ivory-200 dark:bg-obsidian-850 hover:bg-gold-500/15 hover:text-gold-500 text-slate-700 dark:text-slate-200 transition"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => setShowSteerModal(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gold-500 text-obsidian-950 hover:bg-gold-400 transition"
                    >
                      Steer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/20 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-200 dark:bg-obsidian-950 text-slate-400 font-mono text-[10px] uppercase border-b border-black/5 dark:border-white/5">
                <tr>
                  <th className="p-3">Session</th>
                  <th className="p-3">Engine</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Cost / Tokens</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gold-500/5 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{session.title}</div>
                      <div className="text-[10px] font-mono text-slate-400">{session.workspace}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{session.toolName}</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleMode(session.id)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gold-500/15 text-gold-500 border border-gold-500/30"
                      >
                        {session.role.toUpperCase()}
                      </button>
                    </td>
                    <td className="p-3 font-mono">{session.model}</td>
                    <td className="p-3 font-mono text-gold-500 font-bold">${session.cost} ({session.tokens})</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setInspectingSession(session)}
                        className="px-2.5 py-1 rounded text-xs font-bold bg-ivory-200 dark:bg-obsidian-850 hover:text-gold-500"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => setShowSteerModal(true)}
                        className="px-2.5 py-1 rounded text-xs font-bold bg-gold-500 text-obsidian-950 hover:bg-gold-400"
                      >
                        Steer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Inspector Modal (Interactive Preview) */}
      {inspectingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 rounded-2xl shadow-gold-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-ivory-200 dark:bg-obsidian-950 border-b border-gold-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-gold-500 uppercase font-bold">
                  {inspectingSession.toolName} • {inspectingSession.workspace}
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {inspectingSession.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Execution & Thought History</span>
                <div className="space-y-2.5">
                  {inspectingSession.conversation.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        msg.role === 'thought'
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-300 font-mono text-[11px]'
                          : msg.role === 'user'
                          ? 'bg-ivory-200 dark:bg-obsidian-850 border-black/10 dark:border-white/10 text-slate-800 dark:text-slate-200'
                          : 'bg-gold-500/10 border-gold-500/20 text-slate-900 dark:text-white'
                      }`}
                    >
                      <div className="font-mono text-[9px] uppercase font-bold opacity-70 mb-1">
                        {msg.role === 'thought' ? '💭 Agent Reasoning' : msg.role === 'user' ? '👤 Directive' : '🤖 Assistant Output'}
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-ivory-200 dark:bg-obsidian-950 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Model: <strong className="text-slate-900 dark:text-white">{inspectingSession.model}</strong>
              </span>
              <button
                onClick={() => {
                  setInspectingSession(null);
                  setShowSteerModal(true);
                }}
                className="px-4 py-1.5 rounded-xl bg-gold-500 text-obsidian-950 font-bold text-xs hover:bg-gold-400 transition"
              >
                Steer Live Agent →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Steer / Local Execution Modal (Calls user to Download Desktop App) */}
      {showSteerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/40 rounded-3xl shadow-gold-lg p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-500">
              <Laptop className="w-7 h-7 stroke-[2]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Live Agent Steering Runs Locally
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Agent Board interacts directly with local CLI processes and SQLite databases on your machine with sub-800ms latency.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To steer running OpenCode, Claude Code, Cursor, or Antigravity agents, please run the native desktop application.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  setShowSteerModal(false);
                  onOpenDownload();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-obsidian-950 font-black text-xs flex items-center justify-center space-x-2 shadow-gold-sm transition hover:scale-[1.01]"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download Desktop App for Windows (.exe)</span>
              </button>

              <button
                onClick={() => setShowSteerModal(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Continue Exploring Sandbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
