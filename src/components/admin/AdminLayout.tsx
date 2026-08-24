import React from 'react';
import { Page } from '@/types/index';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Ticket,
  Film,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface AdminLayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function AdminLayout({ currentPage, onNavigate, children }: AdminLayoutProps) {
  const navItems: { page: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { page: 'admin', label: 'Overview', icon: LayoutDashboard },
    { page: 'admin/students', label: 'Students', icon: Users },
    { page: 'admin/sales', label: 'Sales & Ledger', icon: CreditCard },
    { page: 'admin/codes', label: 'Discount & Alumni Codes', icon: Ticket },
    { page: 'admin/content', label: 'Curriculum & Video Content', icon: Film },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-900 font-sans flex flex-col antialiased">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Brand & Console Tag */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('admin')}
              className="text-left font-bold text-sm tracking-tight text-gray-900 flex items-center space-x-2"
            >
              <span className="bg-gray-900 text-white text-[11px] font-mono px-1.5 py-0.5 rounded">
                FS
              </span>
              <span className="font-semibold text-gray-900">FLAG SKOOL</span>
              <span className="text-gray-400 font-normal">/</span>
              <span className="text-gray-600 text-xs font-mono tracking-wider uppercase">
                Console
              </span>
            </button>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gray-100 text-gray-600 border border-gray-200">
              FOUNDER
            </span>
          </div>

          {/* Quick Context & Student Portal Switcher */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-2 text-gray-500 font-mono text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>WAT {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="h-4 w-px bg-gray-200 hidden md:block" />

            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center space-x-1.5 text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors font-medium text-xs"
            >
              <span>Student Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center space-x-1 text-gray-500 hover:text-gray-800 px-2 py-1 transition-colors text-xs"
            >
              <span>Public Landing</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-4 -mb-px overflow-x-auto" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-gray-900 text-gray-900 font-semibold bg-gray-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {children}
      </main>

      {/* Low-profile Admin Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 font-mono">
          <div>FLAG SKOOL INTERNAL MANAGEMENT — RESTRICTED FOUNDER ACCESS</div>
          <div className="mt-1 sm:mt-0 flex items-center space-x-4">
            <span>SEAM: /lib/data-access.ts</span>
            <span>ENV: PRODUCTION-MOCK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
