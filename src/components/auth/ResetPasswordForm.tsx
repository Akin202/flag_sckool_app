import React, { useState } from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { AuthFormProps, ResetPasswordFormValues } from '@/types/index';

export const ResetPasswordForm: React.FC<AuthFormProps<ResetPasswordFormValues>> = ({
  state,
  onSubmit,
  onNavigate,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mismatchError, setMismatchError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMismatchError('Passwords do not match. Please re-enter.');
      return;
    }
    if (password.length < 8) {
      setMismatchError('Password must be at least 8 characters long.');
      return;
    }
    setMismatchError(null);
    onSubmit({ password, confirmPassword });
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
            Password Reset Complete
          </h3>
          <p className="text-[14px] text-[#8492A6] leading-relaxed">
            Your credentials have been securely updated. You can now sign in to Flag Skool.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => onNavigate && onNavigate('login')}
          >
            Sign In with New Password
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mismatchError && (
        <div className="p-3.5 rounded-xl bg-[#CA3A32]/10 border border-[#CA3A32]/30 text-xs text-[#F8FAFC]">
          {mismatchError}
        </div>
      )}

      {state.status === 'error' && (
        <div className="p-3.5 rounded-xl bg-[#CA3A32]/10 border border-[#CA3A32]/30 text-xs text-[#F8FAFC]">
          {state.error}
        </div>
      )}

      <p className="text-[14px] text-[#8492A6]">
        Create a new, strong password for your Flag Skool account.
      </p>

      <Input
        id="reset-password-input"
        type="password"
        label="New Password (min. 8 characters)"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />

      <Input
        id="reset-confirm-password-input"
        type="password"
        label="Confirm New Password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={isLoading}
      />

      <div className="pt-2">
        <Button
          id="btn-reset-submit"
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          Update Password
        </Button>
      </div>

      {onNavigate && (
        <div className="pt-4 border-t border-[#1A2342] text-center text-sm text-[#8492A6]">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#CA3A32] hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#CA3A32] rounded"
          >
            Cancel and return to login
          </button>
        </div>
      )}
    </form>
  );
};
