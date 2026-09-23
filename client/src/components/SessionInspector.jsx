import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Circle, 
  Terminal, 
  Cpu, 
  PowerOff, 
  Power, 
  Copy, 
  Check, 
  Folder, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  Layers,
  Plus,
  Trash2,
  Send,
  Loader2,
  Edit3,
  User,
  Bot,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import ModeSwitchBadge from './ModeSwitchBadge.jsx';

export default function SessionInspector({ 
  sessionId, 
  onClose, 
  onDeactivate, 
  onActivate,
  onModeChange,
  onOpenModelSelector,
  onPrompt
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'messages' | 'telemetry'
  const [copied, setCopied] = useState(false);
  const [expandedParts, setExpandedParts] = useState({});

  // Task manager input state
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const fetchDetail = (id) => {
    if (!id) return;
    fetch(`/api/sessions/${id}`)
      .then(r => r.json())
      .then(data => {
        setDetail(data);
        setLoading(false);
        if ((!data.todos || data.todos.length === 0) && activeTab === 'todos' && data.tool !== 'opencode') {
          setActiveTab('telemetry');
        }
      })
      .catch(err => {
        console.error('Failed to load session detail', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetchDetail(sessionId);

    let es = null;
    try {
      es = new EventSource('/api/events');
      es.addEventListener('fleet_updated', (e) => {
        try {
          const d = JSON.parse(e.data);
          if (!d.sessionId || d.sessionId === sessionId) {
            fetchDetail(sessionId);
          }
        } catch (err) {}
      });
      es.addEventListener('directive_completed', (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.sessionId === sessionId) {
            fetchDetail(sessionId);
          }
        } catch (err) {}
      });
      es.addEventListener('task_added', () => fetchDetail(sessionId));
      es.addEventListener('task_updated', () => fetchDetail(sessionId));
      es.addEventListener('task_deleted', () => fetchDetail(sessionId));
    } catch (e) {}

    return () => {
      if (es) es.close();
    };
  }, [sessionId]);

  if (!sessionId) return null;

  const toggleExpand = (id) => {
    setExpandedParts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Task Manager Handlers
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskContent.trim() || isAddingTask) return;

    setIsAddingTask(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newTaskContent.trim(),
          priority: newTaskPriority
        })
      });
      if (res.ok) {
        const addedTask = await res.json();
        setDetail(prev => ({
          ...prev,
          todos: [...(prev.todos || []), addedTask]
        }));
        setNewTaskContent('');
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task, e) => {
    e.stopPropagation();
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const identifier = task.position !== undefined ? task.position : task.content;

    // Optimistic update
    setDetail(prev => ({
      ...prev,
      todos: prev.todos.map(t => (t.position === task.position || t.content === task.content) ? { ...t, status: newStatus } : t)
    }));

    try {
      await fetch(`/api/sessions/${sessionId}/tasks/${encodeURIComponent(identifier)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to update task:', err);
      fetchDetail(sessionId);
    }
  };

  const handleDeleteTask = async (task, e) => {
    e.stopPropagation();
    const identifier = task.position !== undefined ? task.position : task.content;

    // Optimistic update
    setDetail(prev => ({
      ...prev,
      todos: prev.todos.filter(t => (t.position !== task.position && t.content !== task.content))
    }));

    try {
      await fetch(`/api/sessions/${sessionId}/tasks/${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchDetail(sessionId);
    }
  };

  const isArchived = detail?.status === 'archived';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-ivory-100 dark:bg-obsidian-900 border-l border-gold-500/20 h-full flex flex-col shadow-2xl z-50 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-gold-500/20 bg-ivory-200 dark:bg-obsidian-950 flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-gold-500" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {detail?.title || 'Session Inspector'}
                </h2>

                {/* Mode Switcher Badge */}
                {detail && (
                  <ModeSwitchBadge
                    sessionId={detail.id}
                    currentMode={detail.role || detail.agentRole}
                    onModeChange={async (id, newMode) => {
                      if (onModeChange) await onModeChange(id, newMode);
                      setDetail(prev => ({ ...prev, role: newMode, agentRole: newMode }));
                    }}
                    size="sm"
                  />
                )}

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                  detail?.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                  detail?.status === 'archived' ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-700' :
                  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                  {detail?.status || 'loading'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono mt-0.5">
                <span>{sessionId}</span>
                <button 
                  onClick={handleCopyId}
                  className="hover:text-gold-500 transition"
                  title="Copy session ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {detail && (
              <button
                onClick={async () => {
                  if (isArchived) {
                    await onActivate(sessionId, detail.tool);
                    setDetail(prev => ({ ...prev, status: 'active', time_archived: null }));
                  } else {
                    await onDeactivate(sessionId, detail.tool);
                    setDetail(prev => ({ ...prev, status: 'archived', time_archived: Date.now() }));
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  isArchived
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/25'
                }`}
              >
                {isArchived ? (
                  <>
                    <Power className="w-3.5 h-3.5" />
                    <span>Reactivate</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Deactivate</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gold-500/20 bg-ivory-200 dark:bg-obsidian-950 px-5">
          <button
            onClick={() => setActiveTab('todos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'todos'
                ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Agent Tasks ({detail?.todos?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'messages'
                ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Tool Traces ({detail?.parts?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'telemetry'
                ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Engine & Telemetry</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-500">
              <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading telemetry details...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: INTERACTIVE TASK MANAGER */}
              {activeTab === 'todos' && (
                <div className="space-y-4">
                  {/* Add New Task Form */}
                  <form onSubmit={handleAddTask} className="p-3.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/20 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>Add New Task to Agent Plan</span>
                      <span className="text-gold-500 font-mono text-[10px]">
                        {detail.todos?.filter(t => t.status === 'completed').length || 0} / {detail.todos?.length || 0} Done
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newTaskContent}
                        onChange={e => setNewTaskContent(e.target.value)}
                        placeholder="Type task directive (e.g. Add unit test for JWT verification)..."
                        className="flex-1 p-2 rounded-lg bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-gold-500"
                        disabled={isAddingTask}
                      />
                      <select
                        value={newTaskPriority}
                        onChange={e => setNewTaskPriority(e.target.value)}
                        className="p-2 rounded-lg bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isAddingTask || !newTaskContent.trim()}
                        className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-obsidian-950 font-bold text-xs transition"
                      >
                        {isAddingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Add</span>
                      </button>
                    </div>
                  </form>

                  {/* Task List */}
                  {(!detail.todos || detail.todos.length === 0) ? (
                    <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                      <p>No discrete tasks recorded for this session yet.</p>
                      <p className="text-[11px] text-slate-400">Add tasks above to structure the agent's execution plan.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {detail.todos.map((todo, idx) => {
                        const isDone = todo.status === 'completed';
                        const isInProgress = todo.status === 'in_progress';

                        return (
                          <div 
                            key={todo.id || todo.position || idx}
                            className={`p-3.5 rounded-xl border text-xs flex items-start justify-between space-x-3 transition group ${
                              isDone 
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400' 
                                : isInProgress
                                ? 'bg-gold-500/10 border-gold-500/30 text-slate-900 dark:text-white'
                                : 'bg-ivory-200 dark:bg-obsidian-850 border-black/5 dark:border-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-start space-x-3 flex-1">
                              <button 
                                onClick={(e) => handleToggleTaskStatus(todo, e)}
                                className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
                                title={isDone ? "Mark Pending" : "Mark Completed"}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : isInProgress ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400 hover:text-gold-500" />
                                )}
                              </button>
                              <div className="space-y-1 flex-1">
                                <div className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                  {todo.content}
                                </div>
                                <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                                  <span className={`px-1.5 py-0.2 rounded uppercase font-bold text-[9px] ${
                                    todo.priority === 'high' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' :
                                    todo.priority === 'low' ? 'bg-slate-500/15 text-slate-500' :
                                    'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {todo.priority || 'medium'}
                                  </span>
                                  <span>• Status: {todo.status || 'pending'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Task Actions */}
                            <div className="flex items-center space-x-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                              {/* Steer Agent on this Task */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onPrompt) {
                                    onPrompt({ ...detail, initialPrompt: `Focus on task: ${todo.content}` });
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-600 dark:text-gold-400 transition"
                                title="Steer agent on this task"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Task */}
                              <button
                                onClick={(e) => handleDeleteTask(todo, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MESSAGES, THREAD & TOOL CALLS */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  {/* Recent Directives Banner */}
                  {detail.directives && detail.directives.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-gold-500/10 border border-gold-500/25 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gold-600 dark:text-gold-400">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Active Fleet Steering Directives ({detail.directives.length})</span>
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {detail.directives.slice(0, 3).map((d) => (
                          <div key={d.id} className="p-2 rounded-lg bg-black/40 border border-gold-500/15 flex items-center justify-between text-[11px] font-mono">
                            <span className="truncate text-slate-300 mr-2">"{d.prompt}"</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              d.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                              d.status === 'running' ? 'bg-gold-500/20 text-gold-400 animate-pulse' :
                              d.status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conversation Messages Thread */}
                  {detail.messages && detail.messages.length > 0 ? (
                    <div className="space-y-3.5">
                      {detail.messages.map((msg, mIdx) => {
                        const mData = msg.dataParsed || {};
                        const role = mData.role || (mData.agent ? 'assistant' : 'user');
                        const isUser = role === 'user';
                        const msgParts = (detail.parts || []).filter(p => p.message_id === msg.id);

                        return (
                          <div 
                            key={msg.id || mIdx}
                            className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition ${
                              isUser 
                                ? 'bg-gold-500/5 border-gold-500/30 text-slate-900 dark:text-gold-100 ml-4' 
                                : 'bg-ivory-200 dark:bg-obsidian-850 border-black/5 dark:border-white/5 mr-4'
                            }`}
                          >
                            {/* Message Header */}
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <div className="flex items-center space-x-2">
                                {isUser ? (
                                  <div className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center">
                                    <User className="w-3 h-3" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                    <Bot className="w-3 h-3" />
                                  </div>
                                )}
                                <span className="font-bold uppercase tracking-wider">
                                  {isUser ? 'User Prompt / Directive' : `${mData.agent || 'Agent'} (${mData.modelID || detail.model || 'OpenCode'})`}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {msg.time_created ? new Date(msg.time_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>

                            {/* Message Content & Linked Parts */}
                            <div className="space-y-2 pl-7">
                              {msgParts.length > 0 ? (
                                msgParts.map((p, pIdx) => {
                                  const partData = p.dataParsed || {};
                                  const pType = partData.type;

                                  // 1. Text part
                                  if (pType === 'text' && partData.text) {
                                    return (
                                      <div key={p.id || pIdx} className="whitespace-pre-wrap leading-relaxed font-sans text-xs">
                                        {partData.text}
                                      </div>
                                    );
                                  }

                                  // 2. Reasoning / Thinking part
                                  if (pType === 'reasoning' && partData.text) {
                                    const isExp = expandedParts[p.id];
                                    return (
                                      <div key={p.id || pIdx} className="rounded-xl border border-gold-500/20 bg-black/20 p-2.5 space-y-1.5">
                                        <div 
                                          onClick={() => toggleExpand(p.id)}
                                          className="flex items-center justify-between cursor-pointer text-[10px] font-mono text-gold-500 font-bold"
                                        >
                                          <span className="flex items-center gap-1.5">
                                            <BrainCircuit className="w-3 h-3" />
                                            <span>Reasoning & Plan</span>
                                          </span>
                                          {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        </div>
                                        {isExp && (
                                          <div className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap pl-2 border-l border-gold-500/30">
                                            {partData.text}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }

                                  // 3. Tool execution part (bash, edits, etc.)
                                  if (pType === 'tool' || partData.tool) {
                                    const toolName = partData.tool || pType;
                                    const isExp = expandedParts[p.id];
                                    const cmd = partData.state?.input?.command || partData.input?.command || partData.state?.title || '';
                                    const out = partData.state?.metadata?.output || partData.output || '';

                                    return (
                                      <div key={p.id || pIdx} className="rounded-xl border border-white/10 bg-black/40 overflow-hidden font-mono text-[11px]">
                                        <div 
                                          onClick={() => toggleExpand(p.id)}
                                          className="p-2 flex items-center justify-between cursor-pointer hover:bg-white/5"
                                        >
                                          <div className="flex items-center space-x-2 truncate">
                                            <Terminal className="w-3 h-3 text-gold-500 shrink-0" />
                                            <span className="font-bold text-gold-400 uppercase text-[10px]">{toolName}</span>
                                            {cmd && <span className="text-slate-400 truncate text-[10px]">{cmd}</span>}
                                          </div>
                                          <div className="flex items-center space-x-1.5">
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                                              {partData.state?.status || 'done'}
                                            </span>
                                            {isExp ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                          </div>
                                        </div>
                                        {isExp && (
                                          <div className="p-2.5 bg-black/80 border-t border-white/5 space-y-1.5 text-[10px]">
                                            {cmd && (
                                              <div>
                                                <div className="text-gold-500 uppercase font-bold mb-0.5">Command:</div>
                                                <pre className="p-1.5 rounded bg-black/60 text-gold-200 whitespace-pre-wrap">{cmd}</pre>
                                              </div>
                                            )}
                                            {out && (
                                              <div>
                                                <div className="text-slate-400 uppercase font-bold mb-0.5">Output:</div>
                                                <pre className="p-1.5 rounded bg-black/70 text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">{out}</pre>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }

                                  return null;
                                })
                              ) : (
                                <div className="text-slate-400 italic text-[11px]">
                                  {mData.summary?.diffs?.length ? `${mData.summary.diffs.length} file changes applied` : 'Action processed'}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Fallback: Direct Tool Parts List */
                    (!detail.parts || detail.parts.length === 0) ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        No conversational messages or tool calls recorded in transcript.
                      </div>
                    ) : (
                      detail.parts.map((p, idx) => {
                        const partData = p.dataParsed || {};
                        const toolName = partData.tool || partData.type;
                        const isExpanded = expandedParts[p.id];
                        const command = partData.state?.input?.command || partData.input?.command || JSON.stringify(partData.input || {});
                        const output = partData.state?.metadata?.output || partData.output || '';

                        return (
                          <div key={p.id || idx} className="rounded-xl border border-gold-500/15 bg-ivory-200 dark:bg-obsidian-850 overflow-hidden text-xs">
                            <div 
                              onClick={() => toggleExpand(p.id)}
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-gold-500/5 transition"
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <Terminal className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                                <span className="font-mono font-bold text-gold-700 dark:text-gold-300 uppercase text-[11px]">{toolName || 'PART'}</span>
                                <span className="font-mono text-slate-500 truncate text-[11px]">
                                  {command.length > 50 ? command.substring(0, 50) + '…' : command}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500">
                                  {partData.state?.status || 'done'}
                                </span>
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-3 bg-black/90 dark:bg-black/70 border-t border-white/5 space-y-2 font-mono text-[11px]">
                                {command && (
                                  <div>
                                    <div className="text-gold-400 text-[10px] uppercase font-bold mb-1">Command / Input:</div>
                                    <pre className="p-2 rounded bg-black/80 text-gold-200 overflow-x-auto whitespace-pre-wrap">
                                      {command}
                                    </pre>
                                  </div>
                                )}
                                {output && (
                                  <div>
                                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Output:</div>
                                    <pre className="p-2 rounded bg-black/90 text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                      {output}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              )}

              {/* TAB 3: TELEMETRY & CONFIG */}
              {activeTab === 'telemetry' && (
                <div className="space-y-4 text-xs">
                  <div className="glass-card p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-gold-500" />
                        <span>Model Configuration & Cost</span>
                      </h4>
                      <button
                        onClick={() => onOpenModelSelector && onOpenModelSelector(detail)}
                        className="flex items-center space-x-1 text-gold-600 dark:text-gold-400 hover:underline font-bold text-[11px]"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Reallocate Model</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/15">
                        <div className="text-slate-500 text-[10px]">Model ID</div>
                        <div className="text-slate-900 dark:text-gold-200 font-bold text-sm truncate">{detail.model || detail.modelParsed?.id}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/15">
                        <div className="text-slate-500 text-[10px]">Provider / Variant</div>
                        <div className="text-slate-900 dark:text-slate-200 font-semibold">{detail.provider || detail.modelParsed?.providerID}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/15">
                        <div className="text-slate-500 text-[10px]">Financial Cost</div>
                        <div className="text-gold-700 dark:text-gold-400 font-black text-sm">${(detail.cost || 0).toFixed(4)} USD</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/15">
                        <div className="text-slate-500 text-[10px]">Current Mode</div>
                        <div className="text-gold-500 font-bold uppercase">{detail.role || detail.agentRole}</div>
                      </div>
                    </div>
                  </div>

                  {/* Token Details */}
                  <div className="glass-card p-4 rounded-2xl space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gold-500" />
                      <span>Token Usage Metrics</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                      <div className="p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950">
                        <div className="text-slate-500 text-[10px]">Input Tokens</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{(detail.tokens?.input || detail.tokens_input || 0).toLocaleString()}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950">
                        <div className="text-slate-500 text-[10px]">Output Tokens</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{(detail.tokens?.output || detail.tokens_output || 0).toLocaleString()}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950">
                        <div className="text-slate-500 text-[10px]">Total Tokens</div>
                        <div className="text-gold-600 dark:text-gold-400 font-bold">{(detail.tokens?.total || (detail.tokens_input || 0) + (detail.tokens_output || 0)).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Target Directory */}
                  <div className="glass-card p-4 rounded-2xl space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <Folder className="w-4 h-4 text-gold-500" />
                      <span>Target Workspace Directory</span>
                    </h4>
                    <pre className="p-2.5 rounded-xl bg-ivory-200 dark:bg-obsidian-950 text-slate-800 dark:text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap border border-black/5 dark:border-white/5">
                      {detail.directory || 'Global OpenCode directory'}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
