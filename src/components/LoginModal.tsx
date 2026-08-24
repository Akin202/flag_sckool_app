import React, { useState } from 'react';
import { X, Lock, KeyRound, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/FormControls';
import { FlagSkoolConfig } from '@/types/index';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FlagSkoolConfig;
  onGetAccessClick: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  config,
  onGetAccessClick,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-deep/90 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-ink-raised border border-ink-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-ink-border flex items-center justify-between bg-ink-deep">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-flag-red" />
            <h3 id="login-modal-title" className="font-display font-bold text-lg text-paper-soft">
              Student Portal Access
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

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-ink-border text-flag-red flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="font-display text-xl font-bold text-paper-soft">
              Authentication Handoff
            </h4>
            <p className="text-[15px] text-body-text">
              Visual presentation only. No authentication is implemented on this client.
            </p>
            <div className="p-3 bg-ink-deep rounded-lg border border-ink-border font-mono text-xs text-muted-text">
              // TODO(handoff): wire to auth
            </div>
            <Button variant="secondary" size="md" fullWidth onClick={() => setSubmitted(false)}>
              Back
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-[14px] text-muted-text">
              Enter your registered email to access recordings, download blueprints, and view live sessions.
            </p>

            <Input
              id="login-email"
              type="email"
              label="Registered Email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="login-password"
              type="password"
              label="Password or Access Passcode"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" fullWidth>
                Log In to Portal
              </Button>
            </div>

            <div className="text-center pt-2 text-xs font-mono text-muted-text">
              // TODO(handoff): wire to auth
            </div>

            <div className="pt-3 border-t border-ink-border text-center text-sm text-muted-text">
              Don't have access yet?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGetAccessClick();
                }}
                className="text-flag-red hover:underline font-semibold"
              >
                Enroll here
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
