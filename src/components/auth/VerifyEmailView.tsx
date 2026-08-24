import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadState, Page } from '@/types/index';

export interface VerifyEmailViewProps {
  email?: string;
  resendState: LoadState<void>;
  onResend: () => void;
  onNavigate?: (page: Page) => void;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({
  email = 'student@example.com',
  resendState,
  onResend,
  onNavigate,
}) => {
  const [resendTriggered, setResendTriggered] = useState(false);

  const handleResendClick = () => {
    setResendTriggered(true);
    onResend();
  };

  const isResending = resendState.status === 'loading';

  return (
    <div className="space-y-6 text-center">
      <div className="relative mx-auto w-16 h-16 rounded-2xl bg-flag-red/10 border border-flag-red/30 flex items-center justify-center text-flag-red">
        <Mail className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-flag-red opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-flag-red"></span>
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="font-display font-bold text-2xl text-paper-soft">
          Check Your Inbox
        </h2>
        <p className="text-[15px] text-muted-text leading-relaxed max-w-sm mx-auto">
          We sent a verification link to{' '}
          <span className="text-paper-soft font-semibold font-mono">{email}</span>. Click the link to activate your access.
        </p>
      </div>

      {resendState.status === 'success' && resendTriggered && (
        <div className="p-3 rounded-xl bg-[#059669]/10 border border-[#059669]/30 text-xs text-[#10B981] flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Fresh verification link dispatched to your inbox!</span>
        </div>
      )}

      {resendState.status === 'error' && (
        <div className="p-3 rounded-xl bg-flag-red/10 border border-flag-red/30 text-xs text-paper-soft">
          {resendState.error}
        </div>
      )}

      <div className="p-4 rounded-xl bg-ink-deep border border-ink-border text-xs text-muted-text text-left space-y-1.5">
        <p className="font-semibold text-body-text">Can't find the email?</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Check your Promotions, Spam, or Junk folders.</li>
          <li>Ensure your email provider isn't blocking notifications.</li>
          <li>Wait up to 2 minutes for network delivery.</li>
        </ul>
      </div>

      <div className="space-y-3 pt-2">
        <Button
          id="btn-resend-email"
          type="button"
          variant="secondary"
          size="md"
          fullWidth
          loading={isResending}
          disabled={isResending}
          onClick={handleResendClick}
          className="flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
          Resend Verification Link
        </Button>

        {onNavigate && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => onNavigate('login')}
          >
            Back to Sign In
          </Button>
        )}
      </div>
    </div>
  );
};
