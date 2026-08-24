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
    <footer id="main-footer" className="bg-[#030617] border-t border-[#1A2342] py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#CA3A32] flex items-center justify-center text-[#F8FAFC] font-black text-base">
                F
              </div>
              <span className="font-display font-black text-xl text-[#F8FAFC]">
                {config.org.wordmark}
              </span>
            </div>
            <p className="text-[15px] text-[#8492A6] max-w-md leading-relaxed">
              Equipping Nigerian builders with commercial-grade AI engineering, autonomous agent architectures, and production automation skills.
            </p>
            <div className="pt-2 text-xs font-mono text-[#8492A6]">
              Designed with precision · Optimized for Nigerian web bandwidth
            </div>
          </div>

          {/* Direct Community & Socials */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#F8FAFC] font-semibold mb-4">
              Connect & Portals
            </h4>
            <ul className="space-y-3 text-[15px]">
              <li>
                <a
                  href={config.org.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#CA3A32]" />
                  <span>Join Official Telegram</span>
                  <ExternalLink className="w-3 h-3 text-[#8492A6]" />
                </a>
              </li>
              <li>
                <a
                  href={config.org.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors flex items-center gap-2"
                >
                  <span className="font-mono font-bold text-sm">𝕏</span>
                  <span>Follow {config.org.xHandle}</span>
                  <ExternalLink className="w-3 h-3 text-[#8492A6]" />
                </a>
              </li>
              {onNavigate && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('redeem')}
                      className="text-[#CBD5E1] hover:text-[#059669] transition-colors flex items-center gap-2 text-left"
                    >
                      <Gift className="w-4 h-4 text-[#059669]" />
                      <span>Alumni Voucher Redeem</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('login')}
                      className="text-[#CBD5E1] hover:text-[#CA3A32] transition-colors flex items-center gap-2 text-left"
                    >
                      <KeyRound className="w-4 h-4 text-[#8492A6]" />
                      <span>Student Portal Login</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Policies & Links */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#F8FAFC] font-semibold mb-4">
              Policies & Support
            </h4>
            <ul className="space-y-3 text-[15px]">
              <li>
                <button
                  type="button"
                  onClick={onOpenRefundModal}
                  className="text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors flex items-center gap-2 text-left"
                >
                  <Shield className="w-4 h-4 text-[#059669]" />
                  <span>7-Day Refund Policy</span>
                </button>
              </li>
              <li>
                <a
                  href={`mailto:${config.org.supportEmail}`}
                  className="text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-[#8492A6]" />
                  <span>{config.org.supportEmail}</span>
                </a>
              </li>
              <li className="text-[14px] text-[#8492A6]">
                All Nigerian bank cards, transfers & USSD accepted
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1A2342] flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[#8492A6]">
          <p>© {currentYear} {config.org.name}. All rights reserved.</p>
          <p className="font-mono text-xs text-[#8492A6]">
            Strictly visual front-end presentation · Zero network calls
          </p>
        </div>
      </div>
    </footer>
  );
};
