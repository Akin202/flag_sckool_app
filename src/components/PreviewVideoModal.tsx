import React from 'react';
import { X, Play, Volume2, Maximize, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { FlagSkoolConfig } from '@/types/index';

export interface PreviewVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FlagSkoolConfig;
  onProceedToEnroll: () => void;
}

export const PreviewVideoModal: React.FC<PreviewVideoModalProps> = ({
  isOpen,
  onClose,
  config,
  onProceedToEnroll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-deep/90 backdrop-blur-md"
    >
      <div className="relative w-full max-w-4xl bg-ink-raised border border-ink-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-ink-border flex items-center justify-between bg-ink-deep">
          <div className="flex items-center gap-3">
            <Badge variant="accent" size="sm">
              Free Access
            </Badge>
            <h3 id="video-modal-title" className="font-display font-bold text-lg sm:text-xl text-paper-soft">
              {config.copy.freePreviewCaption}
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

        {/* Video Player Display */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          <div className="relative w-full aspect-video bg-ink-deep rounded-xl border border-ink-border overflow-hidden flex flex-col justify-between p-4 sm:p-6">
            {/* Top watermarks */}
            <div className="flex items-center justify-between text-xs font-mono text-muted-text">
              <span className="flex items-center gap-1.5 text-body-text">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                Adaptive CDN: Lagos Edge Relay (360p / 720p / 1080p)
              </span>
              <span>ID: 7a119bc2-31fa-4f90-84cf-ea8547c94b01</span>
            </div>

            {/* Simulated Frame */}
            <div className="text-center my-auto py-8">
              <div className="w-16 h-16 rounded-full bg-flag-red text-paper-soft flex items-center justify-center mx-auto mb-4 shadow-lg shadow-flag-red/30">
                <Play className="w-7 h-7 fill-current translate-x-0.5" />
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-paper-soft mb-1">
                Module 1 · Lesson 1: Fundamentals of AI
              </p>
              <p className="text-[14px] text-muted-text max-w-lg mx-auto">
                Transformers, self-attention mechanisms, Nigerian enterprise latency factors, and token optimization economics.
              </p>
              <p className="font-mono text-xs text-muted-text mt-4">
                // TODO(handoff): wire to signed playback
              </p>
            </div>

            {/* Simulated Player Controls Bar */}
            <div className="bg-ink-raised/90 border border-ink-border rounded-lg p-2 sm:p-3 flex items-center justify-between gap-3 text-xs font-mono text-body-text">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-ink-border text-paper-soft transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-ink-border text-muted-text transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <span className="text-muted-text">04:12 / 95:00</span>
              </div>

              {/* Progress Scrubber (Red Fill) */}
              <div className="flex-1 mx-4 h-1.5 bg-ink-border rounded-full overflow-hidden">
                <div className="w-[12%] h-full bg-flag-red rounded-full" />
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-ink-border text-[11px]">1080p HD</span>
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-ink-border text-muted-text transition-colors"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info & Next Steps */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-ink-deep border border-ink-border">
            <div>
              <p className="text-[15px] font-bold text-paper-soft">
                Ready to unlock all 15+ hours of curriculum?
              </p>
              <p className="text-[13px] text-muted-text">
                Includes full n8n JSON blueprints, agents source code & Telegram cohort access.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onProceedToEnroll();
              }}
              rightIcon={<Sparkles className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0"
            >
              Get full access
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
