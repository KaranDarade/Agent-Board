import React, { useState, useEffect } from 'react';
import { X, Terminal, Send, CheckCircle2, AlertCircle, Loader2, PlayCircle, Check, Copy } from 'lucide-react';

export default function ManualPromptModal({ session, onClose, onComplete }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [streamLog, setStreamLog] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Listen to SSE directive chunks if open
    let es = null;
    try {
      es = new EventSource('/api/events');
      es.addEventListener('directive_chunk', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.sessionId === session?.id) {
            setStreamLog(prev => prev + data.chunk);
          }
        } catch (err) {}
      });
      es.addEventListener('directive_completed', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.sessionId === session?.id) {
            setIsLoading(false);
            if (data.directive?.output) {
              setStreamLog(data.directive.output);
            }
          }
        } catch (err) {}
      });
    } catch (e) {}

    return () => {
      if (es) es.close();
    };
  }, [session]);

  if (!session) return null;

  const handleCopyCmd = () => {
    const cmd = session.tool === 'opencode'
      ? `opencode run --session "${session.id}" "${prompt.replace(/"/g, '\\"')}"`
      : prompt;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setStreamLog('Dispatching instruction to agent process...\n');

    try {
      const res = await fetch(`/api/sessions/${session.id}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch command');
      }

      setResult(data);
      if (data.directive?.output) {
        setStreamLog(data.directive.output);
      }
      if (onComplete) onComplete(session.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 rounded-2xl shadow-gold-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-ivory-200 dark:bg-obsidian-950 border-b border-gold-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-gold-500" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Steer Agent Board</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{session.title || session.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Steering Directive / Prompt</span>
              <span className="text-[10px] text-gold-600 dark:text-gold-400 font-mono uppercase font-bold">
                {session.toolName || session.tool}
              </span>
            </div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Stop the current subtask and run unit tests first, or inspect auth tokens..."
              className="w-full rounded-xl bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/25 p-3 text-xs text-slate-900 dark:text-gold-100 placeholder-slate-400 focus:outline-none focus:border-gold-500 font-mono resize-none transition"
              disabled={isLoading}
              autoFocus
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Runs non-blocking command or records directive in agent fleet.</span>
              {prompt.trim() && (
                <button
                  type="button"
                  onClick={handleCopyCmd}
                  className="flex items-center space-x-1 text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied CLI Command' : 'Copy CLI Command'}</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-mono text-[11px] whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {/* Live Execution Logs */}
          {streamLog && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <PlayCircle className="w-3 h-3 text-gold-500" />
                  <span>Runtime Output Log</span>
                </span>
                {isLoading && (
                  <span className="text-gold-500 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-ping" />
                    <span>Streaming</span>
                  </span>
                )}
              </div>
              <pre className="p-3 rounded-xl bg-black/90 text-gold-200 font-mono text-[11px] max-h-40 overflow-y-auto whitespace-pre-wrap border border-gold-500/20 shadow-inner">
                {streamLog}
              </pre>
            </div>
          )}

          {result && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center space-x-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{result.message || 'Directive dispatched successfully!'}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-bold text-emerald-500 underline hover:text-emerald-400"
              >
                Close
              </button>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-obsidian-950 font-bold text-xs transition shadow-gold-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Directive</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
