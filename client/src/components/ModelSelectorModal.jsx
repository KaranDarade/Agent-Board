import React, { useState } from 'react';
import { X, Cpu, Check, Loader2, Sparkles } from 'lucide-react';

const PRESET_MODELS = [
  { id: 'deepseek-v4.1-flash', name: 'DeepSeek v4.1 Flash', providerID: 'opencode-go', variant: 'default', tag: 'Fast & Lightweight' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek v4 Pro', providerID: 'opencode-go', variant: 'high', tag: 'Heavy Reasoning' },
  { id: 'glm-5.3-flash', name: 'GLM-5.3 Flash', providerID: 'opencode-go', variant: 'default', tag: 'Fast Generalist' },
  { id: 'kimi-k3', name: 'Kimi k3', providerID: 'opencode-go', variant: 'high', tag: 'Long Context' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', providerID: 'anthropic', variant: 'high', tag: 'Top Coding Tier' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', providerID: 'anthropic', variant: 'high', tag: 'Advanced Agentic' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', providerID: 'google', variant: 'default', tag: 'Google Flash' },
  { id: 'gpt-4o', name: 'GPT-4o', providerID: 'openai', variant: 'default', tag: 'OpenAI Flagship' }
];

export default function ModelSelectorModal({ session, onClose, onModelAllocated }) {
  const [selectedModelId, setSelectedModelId] = useState(session?.model || 'deepseek-v4.1-flash');
  const [customModelId, setCustomModelId] = useState('');
  const [providerId, setProviderId] = useState('opencode-go');
  const [variant, setVariant] = useState('default');
  const [isSaving, setIsSaving] = useState(false);

  if (!session) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const isCustom = selectedModelId === 'custom';
    const finalModelId = isCustom ? customModelId.trim() : selectedModelId;
    const preset = PRESET_MODELS.find(m => m.id === selectedModelId);

    const modelObj = {
      id: finalModelId || 'deepseek-v4.1-flash',
      providerID: preset ? preset.providerID : providerId,
      variant: preset ? preset.variant : variant
    };

    try {
      if (onModelAllocated) {
        await onModelAllocated(session.id, modelObj);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-ivory-100 dark:bg-obsidian-900 border border-gold-500/30 rounded-2xl shadow-gold-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-ivory-200 dark:bg-obsidian-950 border-b border-gold-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-gold-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Allocate AI Model</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{session.title || session.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select AI Model from Catalog:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {PRESET_MODELS.map((m) => {
                const isSelected = selectedModelId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModelId(m.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-gold-500/15 border-gold-500 text-slate-900 dark:text-gold-200 shadow-sm'
                        : 'bg-ivory-200 dark:bg-obsidian-950 border-black/5 dark:border-white/5 hover:border-gold-500/30 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-500">{m.tag}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-gold-500 shrink-0 ml-1" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Model Option */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="customModel"
                name="modelOption"
                checked={selectedModelId === 'custom'}
                onChange={() => setSelectedModelId('custom')}
                className="text-gold-500 focus:ring-gold-500"
              />
              <label htmlFor="customModel" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Enter Custom Model Identifier
              </label>
            </div>

            {selectedModelId === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <input
                  type="text"
                  value={customModelId}
                  onChange={e => setCustomModelId(e.target.value)}
                  placeholder="e.g. qwen3-72b or mistral"
                  className="col-span-2 p-2 rounded-lg bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/30 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={providerId}
                  onChange={e => setProviderId(e.target.value)}
                  placeholder="Provider (e.g. opencode-go)"
                  className="p-2 rounded-lg bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/30 text-slate-900 dark:text-white"
                />
                <select
                  value={variant}
                  onChange={e => setVariant(e.target.value)}
                  className="p-2 rounded-lg bg-ivory-200 dark:bg-obsidian-950 border border-gold-500/30 text-slate-900 dark:text-white"
                >
                  <option value="default">Variant: Default</option>
                  <option value="high">Variant: High</option>
                  <option value="minimal">Variant: Minimal</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-bold text-xs transition shadow-gold-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Allocating...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Allocate Model</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
