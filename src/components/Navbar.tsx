import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { FlagSkoolConfig } from '@/types/index';
import { Sparkles } from 'lucide-react';

export interface NavbarProps {
  config: FlagSkoolConfig;
  onLoginClick: () => void;
  onGetAccessClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onLoginClick,
  onGetAccessClick,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="main-nav"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#030617]/85 backdrop-blur-md border-b border-[#1A2342]/80 py-3.5 shadow-lg shadow-black/20'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Wordmark Left */}
        <a
          href="#"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CA3A32] rounded-md"
          id="nav-brand-logo"
        >
          <div className="w-8 h-8 rounded bg-[#CA3A32] flex items-center justify-center text-[#F8FAFC] font-black text-lg tracking-tighter">
            F
          </div>
          <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-[#F8FAFC] group-hover:text-[#CBD5E1] transition-colors">
            {config.org.wordmark}
          </span>
        </a>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          <Button
            id="nav-login-button"
            variant="ghost"
            size="sm"
            onClick={onLoginClick}
            className="text-[15px] text-[#CBD5E1] hover:text-[#F8FAFC]"
          >
            Log in
          </Button>

          <Button
            id="nav-get-access-button"
            variant="primary"
            size="sm"
            onClick={onGetAccessClick}
            rightIcon={<Sparkles className="w-4 h-4" />}
          >
            Get access
          </Button>
        </div>
      </div>
    </header>
  );
};
