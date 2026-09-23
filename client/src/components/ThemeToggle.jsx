import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      className="relative p-2 rounded-xl border transition-all duration-200 flex items-center justify-center bg-ivory-100 dark:bg-obsidian-900 border-gold-500/20 hover:border-gold-500/50 text-gold-600 dark:text-gold-400 shadow-sm"
      title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
