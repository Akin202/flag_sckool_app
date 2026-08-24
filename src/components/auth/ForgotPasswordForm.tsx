import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { AuthFormProps, ForgotPasswordFormValues } from '@/types/index';

export const ForgotPasswordForm: React.FC<AuthFormProps<ForgotPasswordFormValues>> = ({
  state,
  onSubmit,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email });
  };

  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';

  if (isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center mx-auto border border-[#059669]/30">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-bold text-xl text-[#F8FAFC]">
            Reset Link Dispatched
          </h3>
          <p className="text-[14px] text-[#8492A6] leading-relaxed">
            If an account exists for <span className="text-[#F8FAFC] font-medium">{email || 'your email'}</span>, you will receive password reset instructions within 2 minutes.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => onNavigate && onNavigate('login')}
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state.status === 'error' && (
        <div className="p-3.5 rounded-xl bg-[#CA3A32]/10 border border-[#CA3A32]/30 text-xs text-[#F8FAFC]">
          {state.error}
        </div>
      )}

      <p className="text-[14px] text-[#8492A6]">
        Enter your registered email address and we'll send a secure link to reset your password.
      </p>

      <Input
        id="forgot-email-input"
        type="email"
        label="Registered Email"
        placeholder="you@domain.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
      />

      <div className="pt-2">
        <Button
          id="btn-forgot-submit"
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          Send Reset Instructions
        </Button>
      </div>

      {onNavigate && (
        <div className="pt-4 border-t border-[#1A2342] text-center text-sm text-[#8492A6]">
          Remember your password?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#CA3A32] hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#CA3A32] rounded inline-flex items-center gap-1"
          >
            Back to login
          </button>
        </div>
      )}
    </form>
  );
};
