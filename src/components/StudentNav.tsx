import React from 'react';
import { FlagSkoolConfig, Page, UserProfile } from '@/types/index';
import {
  LayoutDashboard,
  FolderLock,
  User,
  Send,
  LogOut,
  PlayCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui/Button';

export interface StudentNavProps {
  config: FlagSkoolConfig;
  currentPage: Page;
  user?: UserProfile;
  onNavigate?: (page: Page) => void;
  onLogout?: () => void;
}

export const StudentNav: React.FC<StudentNavProps> = ({
  config,
  currentPage,
  user,
  onNavigate,
  onLogout,
}) => {
  const navItems: { page: Page; label: string; icon: React.FC<{ className?: string }> }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'vault', label: 'Vault', icon: FolderLock },
    { page: 'account', label: 'Account', icon: User },
  ];

  return (
    <nav className="border-b border-ink-border bg-ink-raised/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand logo & back to landing */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="student-nav-brand-btn"
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-flag-red rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-flag-red flex items-center justify-center font-display font-black text-sm text-paper-soft shadow-sm">
              FS
            </div>
            <span className="font-display font-black tracking-wider text-base text-paper-soft hidden sm:inline">
              {config.org.wordmark}
            </span>
          </button>

          <span className="text-ink-border hidden sm:inline">/</span>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  id={`student-nav-link-${item.page}`}
                  type="button"
                  onClick={() => onNavigate && onNavigate(item.page)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-ink-border text-paper-soft'
                      : 'text-muted-text hover:text-paper-soft hover:bg-ink-border/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Telegram VIP + Profile Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            id="student-nav-telegram-btn"
            href={config.org.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-border hover:bg-[#222E54] text-xs font-medium text-paper-soft transition-colors focus:ring-2 focus:ring-flag-red"
            title="Open Telegram Technical Community"
          >
            <Send className="w-3.5 h-3.5 text-[#0088CC]" />
            <span className="hidden sm:inline">Telegram Lounge</span>
          </a>

          <button
            type="button"
            id="student-nav-avatar-btn"
            onClick={() => onNavigate && onNavigate('account')}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-ink-border transition-colors focus:ring-2 focus:ring-flag-red"
            title="Go to Account Settings"
          >
            <div className="w-8 h-8 rounded-full bg-flag-red text-paper-soft flex items-center justify-center font-bold text-xs">
              {user?.fullName
                ? user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'CO'}
            </div>
            <span className="text-xs font-medium text-body-text hidden lg:inline max-w-[120px] truncate">
              {user?.fullName || 'Chidi Okonkwo'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Secondary Tab Bar */}
      <div className="md:hidden flex border-t border-ink-border bg-ink-raised px-2 py-1 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate && onNavigate(item.page)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'text-flag-red bg-flag-red/10 font-bold'
                  : 'text-muted-text hover:text-body-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
