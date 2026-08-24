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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#030617]/90 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#0A0F29] border border-[#1A2342] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1A2342] flex items-center justify-between bg-[#030617]">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#CA3A32]" />
            <h3 id="login-modal-title" className="font-display font-bold text-lg text-[#F8FAFC]">
              Student Portal Access
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-lg bg-[#1A2342]/60 hover:bg-[#1A2342] text-[#8492A6] hover:text-[#F8FAFC] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#CA3A32]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#1A2342] text-[#CA3A32] flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="font-display text-xl font-bold text-[#F8FAFC]">
              Authentication Handoff
            </h4>
            <p className="text-[15px] text-[#CBD5E1]">
              Visual presentation only. No authentication is implemented on this client.
            </p>
            <div className="p-3 bg-[#030617] rounded-lg border border-[#1A2342] font-mono text-xs text-[#8492A6]">
              // TODO(handoff): wire to auth
            </div>
            <Button variant="secondary" size="md" fullWidth onClick={() => setSubmitted(false)}>
              Back
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-[14px] text-[#8492A6]">
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

            <div className="text-center pt-2 text-xs font-mono text-[#8492A6]">
              // TODO(handoff): wire to auth
            </div>

            <div className="pt-3 border-t border-[#1A2342] text-center text-sm text-[#8492A6]">
              Don't have access yet?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGetAccessClick();
                }}
                className="text-[#CA3A32] hover:underline font-semibold"
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
