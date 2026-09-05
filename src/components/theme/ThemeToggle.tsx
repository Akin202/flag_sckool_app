'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  /**
   * - 'icon': Sleek compact icon button for headers & navigation bars
   * - 'pill': Pill button with icon and descriptive text
   * - 'segmented': Segmented radio-style control for settings pages
   */
  variant?: 'icon' | 'pill' | 'segmented';
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  size = 'md',
  className = '',
  id = 'theme-toggle-btn',
}) => {
  const { theme, setTheme, toggleTheme, isHighContrastLight } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        id={id}
        role="radiogroup"
        aria-label="Color theme selection"
        className={`inline-flex p-1 bg-ink-deep border border-ink-border rounded-xl gap-1 ${className}`}
      >
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'dark'}
          id={`${id}-dark`}
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-flag-red min-h-[44px] ${
            theme === 'dark'
              ? 'bg-ink-border text-paper-soft shadow-sm'
              : 'text-muted-text hover:text-body-text hover:bg-ink-raised/40'
          }`}
        >
          <Moon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Default Dark</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={theme === 'light'}
          id={`${id}-light`}
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-flag-red min-h-[44px] ${
            theme === 'light'
              ? 'bg-flag-red text-white shadow-sm'
              : 'text-muted-text hover:text-body-text hover:bg-ink-raised/40'
          }`}
        >
          <Sun className="w-3.5 h-3.5" aria-hidden="true" />
          <span>FlagIQ Light</span>
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        id={id}
        type="button"
        onClick={toggleTheme}
        aria-label={
          isHighContrastLight
            ? 'Switch to default dark mode'
            : 'Switch to FlagIQ light mode'
        }
        title={
          isHighContrastLight
            ? 'Switch to default dark mode'
            : 'Switch to FlagIQ light mode'
        }
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-border bg-ink-raised hover:bg-ink-border text-xs font-medium text-body-text hover:text-paper-soft transition-colors focus:outline-none focus:ring-2 focus:ring-flag-red min-h-[44px] sm:min-h-[38px] cursor-pointer ${className}`}
      >
        {isHighContrastLight ? (
          <>
            <Moon className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span>Dark mode</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />
            <span>FlagIQ Light</span>
          </>
        )}
      </button>
    );
  }

  // Default: 'icon'
  const buttonDimensions =
    size === 'sm'
      ? 'w-9 h-9 min-w-[36px] min-h-[36px]'
      : 'w-10 h-10 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]';

  return (
    <button
      id={id}
      type="button"
      onClick={toggleTheme}
      aria-label={
        isHighContrastLight
          ? 'Currently in FlagIQ Light mode. Click to switch to default dark mode'
          : 'Currently in Default Dark mode. Click to switch to FlagIQ light mode'
      }
      aria-pressed={isHighContrastLight}
      title={
        isHighContrastLight
          ? 'Switch to default dark mode'
          : 'Switch to FlagIQ light mode'
      }
      className={`relative inline-flex items-center justify-center rounded-lg border border-ink-border bg-ink-raised hover:bg-ink-border text-body-text hover:text-paper-soft transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-flag-red cursor-pointer ${buttonDimensions} ${className}`}
    >
      <span className="sr-only">
        {isHighContrastLight ? 'Switch to dark mode' : 'Switch to FlagIQ light mode'}
      </span>
      {isHighContrastLight ? (
        <Moon
          className="w-4 h-4 text-[#0284C7] transition-transform duration-200 rotate-0 hover:-rotate-12"
          aria-hidden="true"
        />
      ) : (
        <Sun
          className="w-4 h-4 text-[#DC2626] transition-transform duration-200 rotate-0 hover:rotate-45"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
