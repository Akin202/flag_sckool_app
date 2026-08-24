import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/FormControls';
import { AuthFormProps, LoginFormValues, Page } from '@/types/index';

export const LoginForm: React.FC<AuthFormProps<LoginFormValues>> = ({
  state,
  onSubmit,
  onGoogleSignIn,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  const isLoading = state.status === 'loading';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state.status === 'error' && (
        <div className="p-3.5 rounded-xl bg-[#CA3A32]/10 border border-[#CA3A32]/30 text-xs text-[#F8FAFC]">
          {state.error}
        </div>
      )}

      {state.status === 'success' && (
        <div className="p-3.5 rounded-xl bg-[#059669]/10 border border-[#059669]/30 text-xs text-[#10B981]">
          Authentication successful. Redirecting to your student dashboard...
        </div>
      )}

      <Input
        id="login-email-input"
        type="email"
        label="Email Address"
        placeholder="you@domain.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
      />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password-input"
            className="block text-xs uppercase font-mono tracking-wider text-[#8492A6]"
          >
            Password
          </label>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('forgot')}
              className="text-xs text-[#CA3A32] hover:underline focus:outline-none focus:ring-1 focus:ring-[#CA3A32] rounded"
            >
              Forgot password?
            </button>
          )}
        </div>
        <input
          id="login-password-input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="w-full px-4 py-3 bg-[#030617] border border-[#1A2342] focus:border-[#CA3A32] focus:ring-1 focus:ring-[#CA3A32] text-[16px] text-[#F8FAFC] placeholder-[#8492A6] rounded-xl outline-none transition-colors"
        />
      </div>

      <div className="pt-2">
        <Button
          id="btn-login-submit"
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          Sign In to Portal
        </Button>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1A2342]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase font-mono">
          <span className="bg-[#0A0F29] px-2 text-[#8492A6]">or</span>
        </div>
      </div>

      <button
        type="button"
        id="btn-google-login"
        onClick={onGoogleSignIn}
        disabled={isLoading}
        className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#030617] hover:bg-[#1A2342]/60 border border-[#1A2342] text-[#F8FAFC] text-[15px] font-medium flex items-center justify-center gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-[#CA3A32]"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
          />
        </svg>
        Continue with Google
      </button>

      {onNavigate && (
        <div className="pt-4 border-t border-[#1A2342] text-center text-sm text-[#8492A6]">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-[#CA3A32] hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#CA3A32] rounded"
          >
            Create account
          </button>
        </div>
      )}
    </form>
  );
};
