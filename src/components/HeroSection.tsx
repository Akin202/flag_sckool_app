import React from 'react';
import { Button } from './ui/Button';
import { FlagSkoolConfig } from '@/types/index';
import { Play, ArrowRight, Users, CheckCircle2 } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface HeroSectionProps {
  config: FlagSkoolConfig;
  onGetAccessClick: () => void;
  onWatchFreeLesson: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  config,
  onGetAccessClick,
  onWatchFreeLesson,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="hero-section"
      className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 overflow-hidden border-b border-[#1A2342]/60"
    >
      {/* Subtle animated ambient gradient behind hero — transform and opacity only */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] lg:w-[800px] h-[340px] sm:h-[600px] lg:h-[800px] rounded-full pointer-events-none opacity-20 -z-10 blur-[90px] sm:blur-[140px] bg-gradient-to-tr from-[#CA3A32]/40 via-[#1A2342] to-transparent"
        style={{
          animation: prefersReducedMotion ? 'none' : 'subtlePulse 10s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Editorial Sub-badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A0F29] border border-[#1A2342] text-[13px] sm:text-[14px] text-[#8492A6] mb-6 sm:mb-8 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[#CA3A32] inline-block" />
          <span className="font-mono uppercase tracking-wider text-[#CBD5E1]">
            Curriculum for Nigerian Engineers & Builders
          </span>
        </div>

        {/* Hero Headline (Fraunces Display Font) */}
        <h1
          id="hero-headline"
          className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F8FAFC] leading-[1.08] mb-6 sm:mb-8 max-w-4xl mx-auto"
        >
          {config.copy.heroHeadline}
        </h1>

        {/* Hero Subline (Instrument Sans) */}
        <p
          id="hero-subline"
          className="font-sans text-lg sm:text-xl md:text-2xl text-[#CBD5E1] leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-10 font-normal"
        >
          {config.copy.heroSubline}
        </p>

        {/* Call to Actions (Min 48px touch targets, mobile stacked) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-10 sm:mb-12">
          <Button
            id="hero-cta-primary"
            variant="primary"
            size="lg"
            onClick={onGetAccessClick}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto text-lg px-8 py-4 shadow-lg shadow-[#CA3A32]/20"
          >
            Get access
          </Button>

          <Button
            id="hero-cta-secondary"
            variant="secondary"
            size="lg"
            onClick={onWatchFreeLesson}
            leftIcon={<Play className="w-5 h-5 fill-current text-[#CBD5E1]" />}
            className="w-full sm:w-auto text-lg px-8 py-4"
          >
            Watch lesson 1 free
          </Button>
        </div>

        {/* Muted Stat Line */}
        <div
          id="hero-muted-stat"
          className="flex items-center justify-center gap-2.5 text-[#8492A6] text-[15px] sm:text-[16px] font-medium"
        >
          <Users className="w-4 h-4 text-[#8492A6]" />
          <span>{config.copy.heroMutedStat}</span>
          <span className="text-[#1A2342]">•</span>
          <span className="inline-flex items-center gap-1 text-[#8492A6]">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            Practical & Production-Ready
          </span>
        </div>
      </div>
    </section>
  );
};
