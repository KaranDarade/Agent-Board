import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Folder, 
  Shield, 
  Hammer, 
  Cpu, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';

const PRESET_MODELS = [
  { id: 'deepseek-v4.1-flash', name: 'DeepSeek v4.1 Flash', providerID: 'opencode-go', variant: 'default', tag: 'Fast & Light' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek v4 Pro', providerID: 'opencode-go', variant: 'high', tag: 'Heavy Reasoning' },
  { id: 'glm-5.3-flash', name: 'GLM-5.3 Flash', providerID: 'opencode-go', variant: 'default', tag: 'General Fast' },
  { id: 'kimi-k3', name: 'Kimi k3', providerID: 'opencode-go', variant: 'high', tag: 'Long Context' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', providerID: 'anthropic', variant: 'high', tag: 'Top Coding' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', providerID: 'anthropic', variant: 'high', tag: 'Advanced Agentic' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', providerID: 'google', variant: 'default', tag: 'Google Flash' },
  { id: 'gpt-4o', name: 'GPT-4o', providerID: 'openai', variant: 'default', tag: 'OpenAI Flagship' }
];

export default function CreateSessionModal({ onClose, onSessionCreated }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [customWorkspace, setCustomWorkspace] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('plan'); // 'plan' | 'build'
  const [selectedModel, setSelectedModel] = useState('deepseek-v4.1-flash');
  const [tasks, setTasks] = useState([
    { content: '', priority: 'high' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdSession, setCreatedSession] = useState(null);

  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(data => {
        setWorkspaces(data);
        if (data.length > 0) {
          setSelectedWorkspace(data[0].path);
        }
      })
      .catch(e => console.error(e));
  }, []);

  const handleAddTask = () => {
    setTasks(prev => [...prev, { content: '', priority: 'medium' }]);
  };

  const handleTaskChange = (index, field, value) => {
    setTasks(prev => prev.map((t, idx) => idx === index ? { ...t, [field]: value } : t));
  };

  const handleRemoveTask = (index) => {
    setTasks(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const targetDir = selectedWorkspace === 'custom'
      ? customWorkspace.trim()
      : selectedWorkspace;

    const preset = PRESET_MODELS.find(m => m.id === selectedModel);
    const modelObj = {
      id: selectedModel,
      providerID: preset?.providerID || 'opencode-go',
      variant: preset?.variant || 'default'
    };

    const cleanTasks = tasks
      .filter(t => t.content.trim())
      .map(t => ({ content: t.content.trim(), priority: t.priority }));

    try {
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          directory: targetDir,
          agentRole: mode,
          modelObj,
          initialTasks: cleanTasks
        })
      });

      const newSession = await res.json();
      setCreatedSession(newSession);

      if (onSessionCreated) {
        onSessionCreated(newSession);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 rounded-2xl shadow-gold-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-ivory-200 dark:bg-obsidian-950 border-b border-gold-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Create New Agent Session</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure mission, workspace, mode & model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {createdSession ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Session Initialized & Ready!</h4>
              <p className="text-xs text-slate-500">
                Created session <span className="font-mono text-gold-500 font-bold">{createdSession.id}</span> in {createdSession.role.toUpperCase()} mode.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 text-xs text-left font-mono space-y-1 max-w-md mx-auto">
              <div><span className="text-slate-500">Title:</span> <span className="text-slate-900 dark:text-white font-bold">{createdSession.title}</span></div>
              <div><span className="text-slate-500">Model:</span> <span className="text-gold-500 font-bold">{createdSession.model}</span></div>
              <div><span className="text-slate-500">Directory:</span> <span className="text-slate-400 truncate">{createdSession.directory}</span></div>
              <div><span className="text-slate-500">Tasks:</span> <span className="text-emerald-500">{createdSession.initialTasksCount} tasks queued</span></div>
            </div>

            <div className="pt-3 flex items-center justify-center space-x-3">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-bold text-xs transition shadow-gold-sm"
              >
                Review in Fleet Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* 1. Workspace Directory (Option A) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-gold-500" />
                <span>Target Project Workspace</span>
              </label>
              <select
                value={selectedWorkspace}
                onChange={e => setSelectedWorkspace(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-gold-500 font-mono"
              >
                {workspaces.map(ws => (
                  <option key={ws.path} value={ws.path}>
                    {ws.name} ({ws.path})
                  </option>
                ))}
                <option value="custom">+ Enter Custom Folder Path...</option>
              </select>

              {selectedWorkspace === 'custom' && (
                <input
                  type="text"
                  value={customWorkspace}
                  onChange={e => setCustomWorkspace(e.target.value)}
                  placeholder="C:/path/to/your/project"
                  className="w-full p-2.5 mt-1 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/30 text-slate-900 dark:text-white font-mono"
                  required
                />
              )}
            </div>

            {/* 2. Session Title */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Session Title & Mission
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Build authentication flow, refactor navbar, or add test cases"
                className="w-full p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 text-slate-900 dark:text-white focus:outline-none focus:border-gold-500"
                required
              />
            </div>

            {/* 3. Initial Mode Selection: PLAN vs BUILD */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Initial Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setMode('plan')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center space-x-3 ${
                    mode === 'plan'
                      ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'bg-ivory-200 dark:bg-obsidian-950 border-black/5 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-purple-500/30'
                  }`}
                >
                  <Shield className="w-5 h-5 text-purple-500 shrink-0" />
                  <div>
                    <div className="font-bold uppercase tracking-wide">PLAN Mode</div>
                    <div className="text-[10px] text-slate-500">Safe, read-only architecting</div>
                  </div>
                </div>

                <div
                  onClick={() => setMode('build')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center space-x-3 ${
                    mode === 'build'
                      ? 'bg-gold-500/15 border-gold-500 text-gold-700 dark:text-gold-300 shadow-sm'
                      : 'bg-ivory-200 dark:bg-obsidian-950 border-black/5 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-gold-500/30'
                  }`}
                >
                  <Hammer className="w-5 h-5 text-gold-500 shrink-0" />
                  <div>
                    <div className="font-bold uppercase tracking-wide">BUILD Mode</div>
                    <div className="text-[10px] text-slate-500">Direct code edits & tools</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Model Catalog Allocation */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-gold-500" />
                <span>Allocate AI Model</span>
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 text-slate-900 dark:text-slate-100 font-mono"
              >
                {PRESET_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.providerID}) — {m.tag}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Initial Tasks Checklist */}
            <div className="space-y-2 pt-1 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Initial Tasks / Todos
                </label>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="flex items-center space-x-1 text-gold-600 dark:text-gold-400 hover:underline font-bold text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {tasks.map((t, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={t.content}
                      onChange={e => handleTaskChange(idx, 'content', e.target.value)}
                      placeholder={`Task ${idx + 1}...`}
                      className="flex-1 p-2 rounded-lg bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 text-slate-900 dark:text-white"
                    />
                    <select
                      value={t.priority}
                      onChange={e => handleTaskChange(idx, 'priority', e.target.value)}
                      className="p-2 rounded-lg bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 text-[11px] font-semibold"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-obsidian-950 font-bold shadow-gold-sm transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initializing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Session (Ready Mode)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
