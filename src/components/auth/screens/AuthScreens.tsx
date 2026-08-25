'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { config } from '@/config/flagskool.config';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { VerifyEmailView } from '@/components/auth/VerifyEmailView';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { createClient } from '@/lib/supabase/client';
import type {
  ForgotPasswordFormValues,
  LoadState,
  LoginFormValues,
  ResetPasswordFormValues,
  SignupFormValues,
} from '@/types/index';

const copy = config.copy.auth;

/**
 * These screens own their own LoadState rather than reading the dev-state
 * provider, now that the calls are real. The DevStateSwitcher no longer drives
 * them — it cannot fake a Supabase response, and pretending otherwise would
 * hide genuine auth failures during development.
 */
function useAuthAction(initialError?: string) {
  const [state, setState] = useState<LoadState<void>>(
    initialError ? { status: 'error', error: initialError } : { status: 'idle' },
  );

  const run = useCallback(
    async (action: () => Promise<{ error: { message: string } | null }>, onSuccess?: () => void) => {
      setState({ status: 'loading' });
      const { error } = await action();
      if (error) {
        setState({ status: 'error', error: error.message });
        return;
      }
      setState({ status: 'success', data: undefined });
      onSuccess?.();
    },
    [],
  );

  return { state, run };
}

/** Absolute origin for auth redirect links. Empty during SSR, which is fine —
 *  every caller here runs from an event handler in the browser. */
function siteOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? '';
}

export function LoginScreen({ next, initialError }: { next?: string; initialError?: string }) {
  const navigate = useAppNavigate();
  const router = useRouter();
  const { state, run } = useAuthAction(initialError);

  const handleSubmit = (values: LoginFormValues) => {
    const supabase = createClient();
    void run(
      () => supabase.auth.signInWithPassword({ email: values.email, password: values.password }),
      () => {
        // Relative same-origin paths only, so ?next=https://evil.example
        // cannot turn the login page into an open redirect.
        const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
        router.push(target);
        router.refresh();
      },
    );
  };

  return (
    <AuthLayout title={copy.login.title} subtitle={copy.login.subtitle} config={config} onNavigate={navigate}>
      {/* onGoogleSignIn is deliberately omitted until Stage 2. */}
      <LoginForm state={state} onSubmit={handleSubmit} onNavigate={navigate} />
    </AuthLayout>
  );
}

export function SignupScreen() {
  const navigate = useAppNavigate();
  const router = useRouter();
  const { state, run } = useAuthAction();

  const handleSubmit = (values: SignupFormValues) => {
    const supabase = createClient();
    void run(
      () =>
        supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            // handle_new_user() reads full_name off this metadata to populate
            // the profiles row.
            data: { full_name: values.fullName },
            emailRedirectTo: `${siteOrigin()}/auth/confirm`,
          },
        }),
      () => router.push(`/verify-email?email=${encodeURIComponent(values.email)}`),
    );
  };

  return (
    <AuthLayout title={copy.signup.title} subtitle={copy.signup.subtitle} config={config} onNavigate={navigate}>
      <SignupForm state={state} onSubmit={handleSubmit} onNavigate={navigate} />
    </AuthLayout>
  );
}

export function ForgotPasswordScreen() {
  const navigate = useAppNavigate();
  const { state, run } = useAuthAction();

  const handleSubmit = (values: ForgotPasswordFormValues) => {
    const supabase = createClient();
    void run(() =>
      supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${siteOrigin()}/auth/confirm?next=/reset`,
      }),
    );
  };

  return (
    <AuthLayout title={copy.forgot.title} subtitle={copy.forgot.subtitle} config={config} onNavigate={navigate}>
      <ForgotPasswordForm state={state} onSubmit={handleSubmit} onNavigate={navigate} />
    </AuthLayout>
  );
}

export function ResetPasswordScreen() {
  const navigate = useAppNavigate();
  const router = useRouter();
  const { state, run } = useAuthAction();

  const handleSubmit = (values: ResetPasswordFormValues) => {
    const supabase = createClient();
    // The recovery session was already established by /auth/confirm, so this
    // is a plain password update on the current user.
    void run(
      () => supabase.auth.updateUser({ password: values.password }),
      () => {
        router.push('/dashboard');
        router.refresh();
      },
    );
  };

  return (
    <AuthLayout title={copy.reset.title} subtitle={copy.reset.subtitle} config={config} onNavigate={navigate}>
      <ResetPasswordForm state={state} onSubmit={handleSubmit} onNavigate={navigate} />
    </AuthLayout>
  );
}

export function VerifyEmailScreen({ email }: { email?: string }) {
  const navigate = useAppNavigate();
  const { state, run } = useAuthAction();

  const handleResend = () => {
    if (!email) return;
    const supabase = createClient();
    void run(() =>
      supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${siteOrigin()}/auth/confirm` },
      }),
    );
  };

  return (
    <AuthLayout
      title={copy.verifyEmail.title}
      subtitle={copy.verifyEmail.subtitle}
      config={config}
      onNavigate={navigate}
    >
      <VerifyEmailView email={email} resendState={state} onResend={handleResend} onNavigate={navigate} />
    </AuthLayout>
  );
}
