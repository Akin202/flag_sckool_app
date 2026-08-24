import React, { useState } from 'react';
import {
  Gift,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FlagSkoolConfig, Page, RedeemState } from '@/types/index';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface RedeemPageProps {
  config: FlagSkoolConfig;
  redeemState?: RedeemState;
  onNavigate?: (page: Page) => void;
  onStateChange?: (state: RedeemState) => void;
}

export const RedeemPage: React.FC<RedeemPageProps> = ({
  config,
  redeemState: controlledRedeemState,
  onNavigate,
  onStateChange,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [internalState, setInternalState] = useState<RedeemState>({ status: 'idle' });
  const activeState = controlledRedeemState || internalState;

  const [rawInput, setRawInput] = useState('');

  const updateState = (newState: RedeemState) => {
    setInternalState(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  };

  // Auto-formatting with ALUMNI- prefix
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/\s+/g, '');
    if (!val) {
      setRawInput('');
      return;
    }

    // Strip existing prefix if user typed or pasted ALUMNI-
    let body = val;
    if (body.startsWith('ALUMNI-')) {
      body = body.slice(7);
    } else if (body.startsWith('ALUMNI')) {
      body = body.slice(6);
      if (body.startsWith('-')) body = body.slice(1);
    }

    if (body.length > 0) {
      setRawInput(`ALUMNI-${body}`);
    } else {
      setRawInput('ALUMNI-');
    }
  };

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = rawInput.trim();
    if (!cleanCode || cleanCode === 'ALUMNI-') return;

    // TODO(handoff): wire to alumni redemption
    updateState({ status: 'checking', code: cleanCode });

    setTimeout(() => {
      if (cleanCode.includes('USED') || cleanCode === 'ALUMNI-CLAIMED') {
        updateState({
          status: 'already-redeemed',
          code: cleanCode,
          error: 'This alumni code has already been redeemed on an active student account.',
        });
      } else if (cleanCode === 'ALUMNI-FAIL' || cleanCode === 'ALUMNI-ERROR') {
        updateState({
          status: 'error',
          error: 'Server verification encountered a temporary issue. Please try again.',
        });
      } else if (cleanCode.length < 9) {
        updateState({
          status: 'invalid',
          code: cleanCode,
          error: 'Unrecognized invite code. Please check the code emailed to your January cohort address.',
        });
      } else {
        updateState({
          status: 'success',
          code: cleanCode,
          productName: 'Live Cohort 2 + Complete Archive',
        });
      }
    }, 700);
  };

  const isChecking = activeState.status === 'checking';

  return (
    <div className="min-h-screen bg-ink-deep flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle warm glow background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-flag-red/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-8 z-10">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('landing')}
          className="flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-flag-red rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-flag-red flex items-center justify-center font-display font-black text-sm text-paper-soft">
            FS
          </div>
          <span className="font-display font-black tracking-wider text-base text-paper-soft">
            {config.org.wordmark}
          </span>
        </button>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="text-xs font-mono text-muted-text hover:text-body-text transition-colors"
          >
            ← Home
          </button>
        )}
      </div>

      {/* Main Centered Gift Card */}
      <div className="w-full max-w-lg mx-auto z-10">
        <Card className="p-8 sm:p-10 bg-ink-raised border-ink-border shadow-2xl rounded-2xl">
          
          {/* SUCCESS STATE: Celebratory but restrained */}
          {activeState.status === 'success' ? (
            <div
              className={`space-y-6 text-center transition-all ${
                prefersReducedMotion
                  ? ''
                  : 'animate-in fade-in duration-500'
              }`}
              style={{
                // Flourish restricted strictly to transform and opacity
                transform: 'translateY(0)',
                opacity: 1,
              }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#059669]/10 border border-[#059669]/30 text-[#059669] flex items-center justify-center mx-auto shadow-xl shadow-[#059669]/10">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-widest text-[#059669] font-semibold block">
                  Alumni Access Granted
                </span>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-paper-soft">
                  {activeState.productName}
                </h1>
                <p className="text-lg text-body-text font-medium pt-1">
                  You have lifetime access.
                </p>
                <p className="text-xs text-muted-text">
                  Your account is unlocked with all live masterclasses, n8n templates, and Discord/Telegram channels.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  id="btn-redeem-dashboard"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => onNavigate && onNavigate('dashboard')}
                  className="font-bold text-base flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857]"
                >
                  Go to Student Dashboard <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            /* INPUT & VERIFICATION FORM */
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-flag-red/10 border border-flag-red/30 text-flag-red flex items-center justify-center mx-auto">
                <Gift className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-widest text-flag-red font-semibold block">
                  Cohort 1 Alumni Recognition
                </span>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-paper-soft">
                  Claim Your Cohort 2 Access
                </h1>
                <p className="text-[15px] text-muted-text leading-relaxed max-w-sm mx-auto">
                  As promised to our founding students, your loyalty unlocks the upgraded live curriculum with zero tuition fee.
                </p>
              </div>

              {/* Status Alert Banners */}
              {activeState.status === 'invalid' && (
                <div className="p-3.5 rounded-xl bg-flag-red/10 border border-flag-red/30 text-left flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-flag-red shrink-0 mt-0.5" />
                  <p className="text-xs text-paper-soft">{activeState.error}</p>
                </div>
              )}

              {activeState.status === 'already-redeemed' && (
                <div className="p-3.5 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/30 text-left flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#EAB308] shrink-0 mt-0.5" />
                  <p className="text-xs text-paper-soft">{activeState.error}</p>
                </div>
              )}

              {activeState.status === 'error' && (
                <div className="p-3.5 rounded-xl bg-flag-red/10 border border-flag-red/30 text-left flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-flag-red shrink-0 mt-0.5" />
                  <p className="text-xs text-paper-soft">{activeState.error}</p>
                </div>
              )}

              <form onSubmit={handleRedeemSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5 text-left">
                  <label
                    htmlFor="alumni-code-input"
                    className="block text-xs uppercase font-mono tracking-wider text-muted-text"
                  >
                    Your Unique Alumni Voucher
                  </label>
                  <input
                    id="alumni-code-input"
                    type="text"
                    placeholder="ALUMNI-XXXX-XXXX"
                    value={rawInput}
                    onChange={handleInputChange}
                    disabled={isChecking}
                    required
                    className="w-full text-center px-4 py-3.5 bg-ink-deep border border-ink-border focus:border-flag-red focus:ring-1 focus:ring-flag-red text-lg font-mono font-bold tracking-wider uppercase text-paper-soft placeholder-muted-text/60 rounded-xl outline-none transition-colors"
                  />
                  <span className="text-[11px] text-muted-text block text-center pt-1">
                    Auto-formats with the ALUMNI- prefix
                  </span>
                </div>

                <Button
                  id="btn-redeem-submit"
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isChecking}
                  disabled={!rawInput || rawInput === 'ALUMNI-' || isChecking}
                  className="font-bold text-base"
                >
                  Redeem Lifetime Access
                </Button>
              </form>

              <div className="pt-4 border-t border-ink-border text-xs text-muted-text space-y-1">
                <p>
                  Questions about your code? Email{' '}
                  <a
                    href={`mailto:${config.org.supportEmail}?subject=Alumni%20Voucher%20Assistance`}
                    className="text-flag-red underline"
                  >
                    {config.org.supportEmail}
                  </a>
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center text-xs text-muted-text z-10 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#059669]" />
        <span>Verified Flag Skool Alumni Program</span>
      </div>
    </div>
  );
};
