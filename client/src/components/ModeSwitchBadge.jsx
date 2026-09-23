import React, { useState } from 'react';
import { Shield, Hammer, Loader2 } from 'lucide-react';

export default function ModeSwitchBadge({ 
  sessionId, 
  currentMode = 'plan', 
  onModeChange, 
  disabled = false,
  size = 'sm'
}) {
  const [isSwitching, setIsSwitching] = useState(false);
  const isPlan = currentMode?.toLowerCase() === 'plan';

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (disabled || isSwitching) return;

    const newMode = isPlan ? 'build' : 'plan';
    setIsSwitching(true);

    try {
      if (onModeChange) {
        await onModeChange(sessionId, newMode);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isSwitching}
      className={`relative inline-flex items-center space-x-1.5 rounded-full font-mono uppercase font-extrabold transition-all duration-200 border group shadow-sm select-none ${
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } ${
        isPlan
          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
          : 'bg-gold-500/15 text-gold-700 dark:text-gold-300 border-gold-500/40 hover:bg-gold-500/25'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      title={`Current mode: ${currentMode.toUpperCase()}. Click to switch to ${isPlan ? 'BUILD' : 'PLAN'} mode.`}
    >
      {isSwitching ? (
        <Loader2 className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} animate-spin`} />
      ) : isPlan ? (
        <Shield className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-purple-500`} />
      ) : (
        <Hammer className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-gold-500`} />
      )}
      <span>{currentMode}</span>
      <span className="opacity-0 group-hover:opacity-100 text-[9px] lowercase font-normal transition text-slate-400">
        (⇄ {isPlan ? 'build' : 'plan'})
      </span>
    </button>
  );
}
