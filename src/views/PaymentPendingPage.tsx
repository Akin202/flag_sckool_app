import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Copy,
  Check,
  Mail,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FlagSkoolConfig, Page } from '@/types/index';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface PaymentPendingPageProps {
  config: FlagSkoolConfig;
  reference?: string;
  forceDelayedState?: boolean;
  onNavigate?: (page: Page) => void;
}

export const PaymentPendingPage: React.FC<PaymentPendingPageProps> = ({
  config,
  reference = 'FLG-84920193',
  forceDelayedState = false,
  onNavigate,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isCheckingAgain, setIsCheckingAgain] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isDelayed = forceDelayedState || elapsedSeconds >= 10;

  const handleCopyReference = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckAgain = () => {
    // TODO(handoff): poll webhook status
    setIsCheckingAgain(true);
    setTimeout(() => {
      setIsCheckingAgain(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-ink-deep flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Wordmark */}
      <div className="w-full max-w-md mx-auto flex items-center justify-center mb-6">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('landing')}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-flag-red rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-flag-red flex items-center justify-center font-display font-black text-sm text-paper-soft">
            FS
          </div>
          <span className="font-display font-black tracking-wider text-base text-paper-soft">
            {config.org.wordmark}
          </span>
        </button>
      </div>

      {/* Centered Card */}
      <div className="w-full max-w-lg mx-auto">
        <Card className="p-8 sm:p-10 bg-ink-raised border-ink-border shadow-2xl rounded-2xl text-center space-y-6">
          
          {/* Pulsing indicator (opacity only) */}
          <div className="flex justify-center">
            <div
              className={`w-16 h-16 rounded-2xl bg-flag-red/10 border border-flag-red/30 flex items-center justify-center text-flag-red ${
                prefersReducedMotion ? '' : 'animate-pulse'
              }`}
              style={{
                // Explicitly constrain animation to opacity only
                animationDuration: '2.5s',
              }}
            >
              {isDelayed ? (
                <Clock className="w-8 h-8 text-[#EAB308]" />
              ) : (
                <Loader2 className="w-8 h-8 animate-spin text-flag-red" />
              )}
            </div>
          </div>

          {/* Heading and subtext */}
          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-paper-soft tracking-tight">
              {isDelayed ? 'Taking longer than usual' : 'Confirming your payment…'}
            </h1>
            <p className="text-[15px] text-muted-text max-w-sm mx-auto leading-relaxed">
              {isDelayed
                ? 'Paystack has received your transfer, but webhook confirmation is experiencing a brief network delay.'
                : "This usually takes a few seconds. Don't close this page."}
            </p>
          </div>

          {/* Fallback state displayed after 10 seconds or when triggered */}
          {isDelayed ? (
            <div className="space-y-5 pt-2 text-left">
              <div className="p-4 rounded-xl bg-ink-deep border border-ink-border space-y-2">
                <span className="text-xs uppercase font-mono text-muted-text block">
                  Transaction Reference
                </span>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm sm:text-base text-paper-soft font-semibold break-all">
                    {reference}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    aria-label="Copy transaction reference"
                    className="p-2 rounded-lg bg-ink-border/60 hover:bg-ink-border text-muted-text hover:text-paper-soft transition-colors shrink-0 flex items-center gap-1 text-xs font-mono"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#059669]" />
                        <span className="text-[#059669]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-flag-red/10 border border-flag-red/20 text-xs text-body-text space-y-1">
                <p className="font-semibold text-paper-soft flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-flag-red" /> Need instant assistance?
                </p>
                <p>
                  If this screen does not advance automatically within 1 minute, email{' '}
                  <a
                    href={`mailto:${config.org.supportEmail}?subject=Payment%20Reference%20${reference}`}
                    className="text-flag-red underline font-semibold"
                  >
                    {config.org.supportEmail}
                  </a>{' '}
                  with your reference above. We will unlock your portal immediately.
                </p>
              </div>

              {/* Never a dead end: Routes forward */}
              <div className="space-y-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={isCheckingAgain}
                  onClick={handleCheckAgain}
                  className="flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingAgain ? 'animate-spin' : ''}`} />
                  Check Status Again
                </Button>

                {onNavigate && (
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center justify-center gap-2"
                  >
                    Continue to Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-4 space-y-4">
              <div className="p-3 bg-ink-deep rounded-xl border border-ink-border text-xs font-mono text-muted-text flex items-center justify-between">
                <span>Reference:</span>
                <span className="text-body-text font-semibold">{reference}</span>
              </div>
              <p className="text-xs text-muted-text">
                Simulating secure bank & webhook reconciliation ({elapsedSeconds}s)
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center text-xs text-muted-text">
        Flag Skool Admissions · Secure Paystack Webhook Engine
      </div>
    </div>
  );
};
