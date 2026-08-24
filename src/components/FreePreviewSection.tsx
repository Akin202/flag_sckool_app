import React from 'react';
import { Play, Sparkles, Clock, MonitorPlay } from 'lucide-react';
import { Badge } from './ui/Badge';
import { FlagSkoolConfig } from '@/types/index';

export interface FreePreviewSectionProps {
  config: FlagSkoolConfig;
  onPlayPreview: () => void;
}

export const FreePreviewSection: React.FC<FreePreviewSectionProps> = ({
  config,
  onPlayPreview,
}) => {
  return (
    <section
      id="free-preview-section"
      className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-ink-border/60"
    >
      <div className="text-center mb-8 sm:mb-12">
        <Badge variant="accent" size="sm" className="mb-3">
          Sample the standard
        </Badge>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-paper-soft tracking-tight mb-4">
          Experience Flag Skool Unfiltered
        </h2>
        <p className="text-lg text-muted-text max-w-2xl mx-auto">
          We believe the engineering quality speaks for itself. Watch the full 95-minute foundational lecture from Module 1 at no cost.
        </p>
      </div>

      {/* 16:9 Video Placeholder Container with play affordance */}
      <div className="relative group cursor-pointer" onClick={onPlayPreview} id="free-preview-player-block">
        <div className="w-full aspect-video rounded-2xl bg-ink-raised border border-ink-border group-hover:border-flag-red/60 transition-all duration-300 overflow-hidden relative shadow-2xl flex flex-col items-center justify-center p-6 text-center">
          
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-15 bg-[radial-gradient(#2D3A63_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
            aria-hidden="true"
          />

          {/* Large Editorial Play Button */}
          <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-flag-red text-paper-soft flex items-center justify-center shadow-xl shadow-flag-red/30 group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
          </div>

          {/* Play Hint */}
          <div className="relative z-10 mt-6 flex items-center gap-3">
            <span className="text-lg sm:text-xl font-bold text-paper-soft group-hover:text-paper-soft transition-colors">
              Click to start stream
            </span>
          </div>

          {/* Metadata chips inside player */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-center justify-between gap-3 bg-ink-deep/85 backdrop-blur-md px-4 py-3 rounded-xl border border-ink-border">
            <div className="flex items-center gap-2.5 text-left">
              <MonitorPlay className="w-5 h-5 text-flag-red shrink-0" />
              <div>
                <p className="text-[14px] sm:text-[15px] font-semibold text-paper-soft leading-tight">
                  {config.copy.freePreviewCaption}
                </p>
                <p className="text-[12px] sm:text-[13px] text-muted-text">
                  Full 95m session · Transformers, Latency & Token Economics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[13px] font-mono text-muted-text">
                <Clock className="w-3.5 h-3.5" /> 95 mins
              </span>
              <span className="px-2.5 py-1 rounded bg-flag-red text-paper-soft text-[11px] font-bold uppercase tracking-wider">
                Free
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[14px] text-muted-text px-2">
        <span className="font-mono text-[13px]">
          // TODO(handoff): wire to signed playback
        </span>
        <span className="flex items-center gap-1.5 text-body-text">
          <Sparkles className="w-4 h-4 text-flag-red" />
          Streamed via low-bandwidth Nigerian CDN optimization
        </span>
      </div>
    </section>
  );
};
