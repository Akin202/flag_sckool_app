'use client';

import { config } from '@/config/flagskool.config';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { VerifyEmailView } from '@/components/auth/VerifyEmailView';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useDevState } from '@/components/dev/DevStateProvider';
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  ResetPasswordFormValues,
  SignupFormValues,
} from '@/types/index';

const copy = config.copy.auth;

export function LoginScreen() {
  const navigate = useAppNavigate();
  const { authFormState, setAuthFormState } = useDevState();

  const handleSubmit = (values: LoginFormValues) => {
    // TODO(handoff): replace with a real Supabase Auth sign-in call.
    void values;
    setAuthFormState({ status: 'loading' });
  };

  const handleGoogle = () => {
    // TODO(handoff): replace with a real Supabase Google OAuth call.
    setAuthFormState({ status: 'loading' });
  };

  return (
    <AuthLayout title={copy.login.title} subtitle={copy.login.subtitle} config={config} onNavigate={navigate}>
      <LoginForm
        state={authFormState}
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogle}
        onNavigate={navigate}
      />
    </AuthLayout>
  );
}

export function SignupScreen() {
  const navigate = useAppNavigate();
  const { authFormState, setAuthFormState } = useDevState();

  const handleSubmit = (values: SignupFormValues) => {
    // TODO(handoff): replace with a real Supabase Auth sign-up call.
    void values;
    setAuthFormState({ status: 'loading' });
  };

  const handleGoogle = () => {
    // TODO(handoff): replace with a real Supabase Google OAuth call.
    setAuthFormState({ status: 'loading' });
  };

  return (
    <AuthLayout title={copy.signup.title} subtitle={copy.signup.subtitle} config={config} onNavigate={navigate}>
      <SignupForm
        state={authFormState}
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogle}
        onNavigate={navigate}
      />
    </AuthLayout>
  );
}

export function ForgotPasswordScreen() {
  const navigate = useAppNavigate();
  const { authFormState, setAuthFormState } = useDevState();

  const handleSubmit = (values: ForgotPasswordFormValues) => {
    // TODO(handoff): replace with a real Supabase password-reset request.
    void values;
    setAuthFormState({ status: 'loading' });
  };

  return (
    <AuthLayout title={copy.forgot.title} subtitle={copy.forgot.subtitle} config={config} onNavigate={navigate}>
      <ForgotPasswordForm state={authFormState} onSubmit={handleSubmit} onNavigate={navigate} />
    </AuthLayout>
  );
}

export function ResetPasswordScreen() {
  const navigate = useAppNavigate();
  const { authFormState, setAuthFormState } = useDevState();

  const handleSubmit = (values: ResetPasswordFormValues) => {
    // TODO(handoff): replace with a real Supabase password update.
    void values;
    setAuthFormState({ status: 'loading' });
  };

  return (
    <AuthLayout title={copy.reset.title} subtitle={copy.reset.subtitle} config={config} onNavigate={navigate}>
      <ResetPasswordForm state={authFormState} onSubmit={handleSubmit} onNavigate={navigate} />
    </AuthLayout>
  );
}

export function VerifyEmailScreen({ email }: { email?: string }) {
  const navigate = useAppNavigate();
  const { authFormState, setAuthFormState } = useDevState();

  const handleResend = () => {
    // TODO(handoff): replace with a real Supabase resend-verification call.
    setAuthFormState({ status: 'loading' });
  };

  return (
    <AuthLayout title={copy.verifyEmail.title} subtitle={copy.verifyEmail.subtitle} config={config} onNavigate={navigate}>
      <VerifyEmailView
        email={email}
        resendState={authFormState}
        onResend={handleResend}
        onNavigate={navigate}
      />
    </AuthLayout>
  );
}
