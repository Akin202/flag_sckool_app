import React from 'react';
import { FlagSkoolConfig, Page } from '@/types/index';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  config: FlagSkoolConfig;
  onNavigate?: (page: Page) => void;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  config,
  onNavigate,
  children,
}) => {
  return (
    <div className="min-h-screen bg-ink-deep flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-flag-red/10 blur-[100px] pointer-events-none" />

      {/* Header with Wordmark and Back Link */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-8 z-10">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('landing')}
          className="flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-flag-red rounded-lg p-1"
          aria-label="Return to Flag Skool homepage"
        >
          <div className="w-8 h-8 rounded-lg bg-flag-red flex items-center justify-center font-display font-black text-sm text-paper-soft">
            FS
          </div>
          <span className="font-display font-black tracking-wider text-base text-paper-soft">
            {config.org.wordmark}
          </span>
        </button>

        <div className="flex items-center gap-3">
          <ThemeToggle id="auth-theme-toggle" size="sm" />
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="text-xs font-mono text-muted-text hover:text-body-text flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </button>
          )}
        </div>
      </div>

      {/* Centered Auth Card */}
      <div className="w-full max-w-md mx-auto z-10">
        <Card className="p-6 sm:p-8 bg-ink-raised border-ink-border shadow-2xl shadow-black/60 rounded-2xl">
          <div className="mb-6 text-left">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-paper-soft tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-text mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </Card>
      </div>

      {/* Trust Footer */}
      <div className="w-full max-w-md mx-auto mt-8 text-center text-xs text-muted-text z-10 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#059669]" />
        <span>Official {config.org.name} Student Authentication Gateway</span>
      </div>
    </div>
  );
};
