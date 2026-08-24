import React from 'react';
import { X, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { FlagSkoolConfig } from '@/types/index';

export interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FlagSkoolConfig;
}

export const RefundPolicyModal: React.FC<RefundPolicyModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-deep/90 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-ink-raised border border-ink-border rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-ink-border flex items-center justify-between bg-ink-deep">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#059669]" />
            <h3 id="refund-modal-title" className="font-display font-bold text-lg sm:text-xl text-paper-soft">
              Flag Skool 7-Day Money-Back Guarantee
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-lg bg-ink-border/60 hover:bg-ink-border text-muted-text hover:text-paper-soft flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-flag-red"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[15px] sm:text-[16px] text-body-text leading-relaxed">
          <p>
            We designed Flag Skool specifically to be the highest return-on-investment technical education program in Nigeria.
          </p>

          <div className="p-4 rounded-xl bg-ink-deep border border-ink-border space-y-2">
            <h4 className="font-bold text-paper-soft flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              Our Commitment
            </h4>
            <p className="text-[14px] text-muted-text">
              If within 7 days of purchase you complete the onboarding module, review Module 1, and feel the course does not deliver practical engineering value, you are entitled to a 100% full refund with zero questions asked.
            </p>
          </div>

          <p>
            To request a refund, simply send an email from your registered address to{' '}
            <a
              href={`mailto:${config.org.supportEmail}`}
              className="text-flag-red underline font-semibold"
            >
              {config.org.supportEmail}
            </a>{' '}
            with your transaction reference or receipt. Refunds to Nigerian bank cards and accounts are processed within 2–5 business days.
          </p>

          <div className="pt-4 border-t border-ink-border flex justify-end">
            <Button variant="secondary" size="md" onClick={onClose}>
              I understand
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
