import React from 'react';
import { FlagSkoolConfig, Page } from '@/types/index';
import { Send, Mail, ExternalLink, Shield, Gift, KeyRound } from 'lucide-react';

export interface FooterProps {
  config: FlagSkoolConfig;
  onOpenRefundModal?: () => void;
  onNavigate?: (page: Page) => void;
}

export const Footer: React.FC<FooterProps> = ({ config, onOpenRefundModal, onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="main-footer" className="bg-ink-deep border-t border-ink-border py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-flag-red flex items-center justify-center text-paper-soft font-black text-base">
                F
              </div>
              <span className="font-display font-black text-xl text-paper-soft">
                {config.org.wordmark}
              </span>
            </div>
            <p className="text-[15px] text-muted-text max-w-md leading-relaxed">
              Equipping Nigerian builders with commercial-grade AI engineering, autonomous agent architectures, and production automation skills.
            </p>
            <div className="pt-2 text-xs font-mono text-muted-text">
              Designed with precision · Optimized for Nigerian web bandwidth
            </div>
          </div>

          {/* Direct Community & Socials */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-paper-soft font-semibold mb-4">
              Connect & Portals
            </h4>
            <ul className="space-y-3 text-[15px]">
              <li>
                <a
                  href={config.org.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-text hover:text-paper-soft transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-flag-red" />
                  <span>Join Official Telegram</span>
                  <ExternalLink className="w-3 h-3 text-muted-text" />
                </a>
              </li>
              <li>
                <a
                  href={config.org.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-text hover:text-paper-soft transition-colors flex items-center gap-2"
                >
                  <span className="font-mono font-bold text-sm">𝕏</span>
                  <span>Follow {config.org.xHandle}</span>
                  <ExternalLink className="w-3 h-3 text-muted-text" />
                </a>
              </li>
              {onNavigate && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('redeem')}
                      className="text-body-text hover:text-[#059669] transition-colors flex items-center gap-2 text-left"
                    >
                      <Gift className="w-4 h-4 text-[#059669]" />
                      <span>Alumni Voucher Redeem</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('login')}
                      className="text-body-text hover:text-flag-red transition-colors flex items-center gap-2 text-left"
                    >
                      <KeyRound className="w-4 h-4 text-muted-text" />
                      <span>Student Portal Login</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Policies & Links */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-paper-soft font-semibold mb-4">
              Policies & Support
            </h4>
            <ul className="space-y-3 text-[15px]">
              <li>
                <button
                  type="button"
                  onClick={onOpenRefundModal}
                  className="text-body-text hover:text-paper-soft transition-colors flex items-center gap-2 text-left"
                >
                  <Shield className="w-4 h-4 text-[#059669]" />
                  <span>7-Day Refund Policy</span>
                </button>
              </li>
              <li>
                <a
                  href={`mailto:${config.org.supportEmail}`}
                  className="text-body-text hover:text-paper-soft transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-muted-text" />
                  <span>{config.org.supportEmail}</span>
                </a>
              </li>
              <li className="text-[14px] text-muted-text">
                All Nigerian bank cards, transfers & USSD accepted
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-ink-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-muted-text">
          <p>© {currentYear} {config.org.name}. All rights reserved.</p>
          <p className="font-mono text-xs text-muted-text">
            Strictly visual front-end presentation · Zero network calls
          </p>
        </div>
      </div>
    </footer>
  );
};
