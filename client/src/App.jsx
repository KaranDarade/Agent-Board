import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import FleetStats from './components/FleetStats.jsx';
import SessionCard from './components/SessionCard.jsx';
import SessionTableView from './components/SessionTableView.jsx';
import SessionInspector from './components/SessionInspector.jsx';
import ManualPromptModal from './components/ManualPromptModal.jsx';
import MobileAccessModal from './components/MobileAccessModal.jsx';
import CreateSessionModal from './components/CreateSessionModal.jsx';
import ModelSelectorModal from './components/ModelSelectorModal.jsx';
import DownloadAppModal from './components/DownloadAppModal.jsx';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Folder, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from 'lucide-react';

export default function App() {
  // Theme state: default to 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fleet state
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [toolFilter, setToolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'idle' | 'archived'
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  // Modals & Drawers
  const [inspectingSessionId, setInspectingSessionId] = useState(null);
  const [promptingSession, setPromptingSession] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [modelSelectorSession, setModelSelectorSession] = useState(null);
  const [bannerMessage, setBannerMessage] = useState(null);

  const showBanner = (msg) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 3500);
  };

  // Fetch Fleet Stats & Sessions
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [statsRes, sessionsRes, toolsRes] = await Promise.all([
        fetch('/api/fleet/stats'),
        fetch('/api/fleet/sessions'),
        fetch('/api/tools')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
      }

      if (toolsRes.ok) {
        const toolsData = await toolsRes.json();
        setTools(toolsData);
      }
    } catch (err) {
      console.error('Failed to fetch fleet data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // SSE connection for live updates
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('connected', () => {
        setIsConnected(true);
      });

      eventSource.addEventListener('fleet_updated', () => fetchData(true));
      eventSource.addEventListener('session_created', () => fetchData(true));
      eventSource.addEventListener('session_mode_changed', () => fetchData(true));
      eventSource.addEventListener('session_model_changed', () => fetchData(true));
      eventSource.addEventListener('session_deactivated', () => fetchData(true));
      eventSource.addEventListener('session_activated', () => fetchData(true));
      eventSource.addEventListener('session_deleted', () => fetchData(true));
      eventSource.addEventListener('task_added', () => fetchData(true));
      eventSource.addEventListener('task_updated', () => fetchData(true));
      eventSource.addEventListener('task_deleted', () => fetchData(true));

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.warn('SSE not supported or failed to connect');
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchData]);

  // Mode Switch Handler (PLAN ⇄ BUILD)
  const handleModeChange = async (sessionId, newMode) => {
    // Optimistic UI update
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, role: newMode, agentRole: newMode } : s));
    showBanner(`Session switched to ${newMode.toUpperCase()} mode.`);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
      if (res.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed to switch mode:', err);
      fetchData(true);
    }
  };

  // Model Reallocation Handler
  const handleModelAllocated = async (sessionId, modelObj) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, model: modelObj.id, modelParsed: modelObj } : s));
    showBanner(`Model allocated: ${modelObj.id}.`);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelObj })
      });
      if (res.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed to allocate model:', err);
      fetchData(true);
    }
  };

  // Session Created Handler
  const handleSessionCreated = (newSession) => {
    setSessions(prev => [newSession, ...prev]);
    showBanner(`New session "${newSession.title}" initialized!`);
    fetchData(true);
  };

  // Actions with optimistic UI update
  const handleDeactivate = async (id, tool) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'archived' } : s));
    showBanner(`Session ${id.substring(0, 8)}… deactivated.`);

    try {
      const res = await fetch(`/api/sessions/${id}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool })
      });
      if (res.ok) {
        fetchData(true);
      }
    } catch (e) {
      console.error('Error deactivating session:', e);
      fetchData(true);
    }
  };

  const handleActivate = async (id, tool) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'idle' } : s));
    showBanner(`Session ${id.substring(0, 8)}… reactivated.`);

    try {
      const res = await fetch(`/api/sessions/${id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool })
      });
      if (res.ok) {
        fetchData(true);
      }
    } catch (e) {
      console.error('Error activating session:', e);
      fetchData(true);
    }
  };

  const handleDelete = async (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showBanner(`Session ${id.substring(0, 8)}… deleted.`);

    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (inspectingSessionId === id) setInspectingSessionId(null);
        fetchData(true);
      }
    } catch (e) {
      console.error('Error deleting session:', e);
      fetchData(true);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    if (toolFilter !== 'all' && s.tool !== toolFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    if (selectedModel && s.model !== selectedModel) return false;
    if (selectedProject !== 'all' && s.projectName !== selectedProject) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (s.title || '').toLowerCase().includes(q);
      const dirMatch = (s.directory || '').toLowerCase().includes(q);
      const idMatch = s.id.toLowerCase().includes(q);
      const modelMatch = (s.model || '').toLowerCase().includes(q);
      const toolMatch = (s.toolName || '').toLowerCase().includes(q);
      if (!titleMatch && !dirMatch && !idMatch && !modelMatch && !toolMatch) return false;
    }
    return true;
  });

  // Sort sessions: Active sessions first, then most recently updated first
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    // 1. Active sessions prioritized
    const aActive = a.isActive || a.status === 'active';
    const bActive = b.isActive || b.status === 'active';
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    // 2. Most recent first (compare timeUpdated, updatedAt, or timeCreated)
    const aTime = (a.timeUpdated || 0) || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) || (a.timeCreated || 0);
    const bTime = (b.timeUpdated || 0) || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) || (b.timeCreated || 0);
    return bTime - aTime;
  });

  const uniqueProjects = Array.from(new Set(sessions.map(s => s.projectName).filter(Boolean)));

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar 
        theme={theme}
        onToggleTheme={toggleTheme}
        isConnected={isConnected} 
        isRefreshing={isRefreshing} 
        onRefresh={() => fetchData(false)}
        totalSessions={stats?.totalSessions || 0}
        activeCount={stats?.activeSessions || 0}
        onOpenMobile={() => setIsMobileOpen(true)}
        onOpenCreateSession={() => setIsCreateOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        tools={tools}
      />

      {/* Floating Action Banner */}
      {bannerMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className="glass-panel px-4 py-3 rounded-2xl border border-gold-500/40 text-xs font-bold text-gold-700 dark:text-gold-300 flex items-center space-x-2 shadow-gold-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{bannerMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI & Fleet Telemetry */}
        <FleetStats 
          stats={stats}
          selectedTool={toolFilter}
          onSelectTool={setToolFilter}
          selectedRole={roleFilter}
          onSelectRole={setRoleFilter}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {/* Filter Bar & View Toggle */}
        <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-ivory-200 dark:bg-obsidian-950 rounded-xl border border-gold-500/15 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-gold-500 text-obsidian-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active ({sessions.filter(s => s.status === 'active').length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('idle')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'idle'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
              }`}
            >
              Idle ({sessions.filter(s => s.status === 'idle').length})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'archived'
                  ? 'bg-slate-700 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Deactivated ({sessions.filter(s => s.status === 'archived').length})
            </button>
          </div>

          {/* Search, Project Dropdown & View Mode Switcher */}
          <div className="flex items-center flex-wrap sm:flex-nowrap space-x-2.5 flex-1 max-w-xl">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gold-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search session title, model, ID, project..."
                className="w-full bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-gold-100 placeholder-slate-400 focus:outline-none focus:border-gold-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-gold-500 transition cursor-pointer"
            >
              <option value="all">All Workspaces ({uniqueProjects.length})</option>
              {uniqueProjects.map(proj => (
                <option key={proj} value={proj}>{proj}</option>
              ))}
            </select>

            {/* Grid vs Table View Mode Switch */}
            <div className="flex items-center bg-ivory-200 dark:bg-obsidian-950 p-1 rounded-xl border border-gold-500/15">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Compact Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Matrix */}
        {loading ? (
          <div className="text-center py-24 space-y-3">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Scanning local engines and aggregating fleet data...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-gold-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">No Sessions Match Your Filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your tool filter, role filter, status tab, or search query.
            </p>
            <button
              onClick={() => {
                setToolFilter('all');
                setStatusFilter('all');
                setRoleFilter('all');
                setSearchQuery('');
                setSelectedModel('');
                setSelectedProject('all');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 text-gold-700 dark:text-gold-300 text-xs font-bold transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-mono">
              <span>
                Displaying {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} across {toolFilter === 'all' ? 'all tools' : toolFilter}
              </span>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onDeactivate={handleDeactivate}
                    onActivate={handleActivate}
                    onInspect={(id) => setInspectingSessionId(id)}
                    onPrompt={(s) => setPromptingSession(s)}
                    onDelete={handleDelete}
                    onModeChange={handleModeChange}
                    onOpenModelSelector={(s) => setModelSelectorSession(s)}
                  />
                ))}
              </div>
            ) : (
              <SessionTableView
                sessions={sortedSessions}
                onInspect={(id) => setInspectingSessionId(id)}
                onDeactivate={handleDeactivate}
                onActivate={handleActivate}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile Web (Create Session) */}
      <button
        onClick={() => setIsCreateOpen(true)}
        className="sm:hidden fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-gold-500 text-obsidian-950 flex items-center justify-center shadow-gold-lg hover:scale-105 active:scale-95 transition"
        title="Create Session"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Slide-over Inspector Drawer */}
      {inspectingSessionId && (
        <SessionInspector
          sessionId={inspectingSessionId}
          onClose={() => setInspectingSessionId(null)}
          onDeactivate={handleDeactivate}
          onActivate={handleActivate}
          onModeChange={handleModeChange}
          onOpenModelSelector={(s) => setModelSelectorSession(s)}
          onPrompt={(s) => setPromptingSession(s)}
        />
      )}

      {/* Manual Prompt Modal */}
      {promptingSession && (
        <ManualPromptModal
          session={promptingSession}
          onClose={() => setPromptingSession(null)}
          onComplete={() => {
            fetchData(true);
            if (inspectingSessionId === promptingSession.id) {
              setInspectingSessionId(promptingSession.id);
            }
          }}
        />
      )}

      {/* Mobile Access Modal */}
      {isMobileOpen && (
        <MobileAccessModal onClose={() => setIsMobileOpen(false)} />
      )}

      {/* Create Session Modal */}
      {isCreateOpen && (
        <CreateSessionModal
          onClose={() => setIsCreateOpen(false)}
          onSessionCreated={handleSessionCreated}
        />
      )}

      {/* Model Selector Modal */}
      {modelSelectorSession && (
        <ModelSelectorModal
          session={modelSelectorSession}
          onClose={() => setModelSelectorSession(null)}
          onModelAllocated={handleModelAllocated}
        />
      )}

      {/* Download Desktop App Modal */}
      {isDownloadOpen && (
        <DownloadAppModal
          isOpen={isDownloadOpen}
          onClose={() => setIsDownloadOpen(false)}
        />
      )}
    </div>
  );
}
