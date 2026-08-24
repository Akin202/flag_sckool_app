import React from 'react';
import { FlagSkoolConfig, PromoState, activePriceKobo, koboToNaira } from '@/types/index';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Check, Sparkles, ShieldCheck } from 'lucide-react';

export interface PricingSectionProps {
  config: FlagSkoolConfig;
  promoState: PromoState;
  onSelectTier: (tierId: 'recordings' | 'cohort') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  config,
  promoState,
  onSelectTier,
}) => {
  const isPromoLive = promoState === 'live';
  const { recordings, cohort } = config.pricing;

  return (
    <section
      id="pricing-section"
      className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-ink-border/60"
    >
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-text block mb-2">
          Transparent Investment
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-paper-soft tracking-tight mb-4">
          Choose Your Path to Mastery
        </h2>
        <p className="text-lg text-muted-text">
          One project, one automated workflow, or one freelance client pays back the entire tuition. Select self-paced recordings or join the live interactive cohort.
        </p>
      </div>

      {/* Two Cards Side-by-Side, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        
        {/* Tier 1: Recordings Card */}
        <Card
          id="pricing-card-recordings"
          className="flex flex-col justify-between border-ink-border hover:border-[#2D3A63] transition-all relative"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-text">
                {recordings.tag}
              </span>
              {isPromoLive && (
                <Badge variant="neutral" size="sm">
                  Save 50%
                </Badge>
              )}
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-bold text-paper-soft mb-2">
              {recordings.name}
            </h3>
            <p className="text-[15px] text-muted-text mb-6 leading-relaxed">
              {recordings.description}
            </p>

            {/* Price Display */}
            <div className="mb-6 p-4 rounded-xl bg-ink-deep border border-ink-border">
              <div className="flex items-baseline gap-3">
                {isPromoLive ? (
                  <>
                    <span className="font-mono text-3xl sm:text-4xl font-bold text-paper-soft">
                      {koboToNaira(activePriceKobo(recordings, true))}
                    </span>
                    <span className="font-mono text-lg sm:text-xl text-muted-text line-through">
                      {koboToNaira(recordings.fullPriceKobo)}
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-3xl sm:text-4xl font-bold text-paper-soft">
                    {koboToNaira(recordings.fullPriceKobo)}
                  </span>
                )}
              </div>
              <span className="text-[13px] text-muted-text mt-1 block">
                One-time payment · Permanent lifetime archive access
              </span>
            </div>

            {/* Feature List */}
            <div className="space-y-3 mb-8">
              <span className="text-xs uppercase font-mono tracking-wider text-muted-text block mb-2">
                What's Included:
              </span>
              {recordings.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 text-[15px] text-body-text">
                  <Check className="w-4 h-4 text-[#059669] shrink-0 mt-1" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Button
              id="cta-select-recordings"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => onSelectTier('recordings')}
              className="font-semibold"
            >
              {recordings.ctaText}
            </Button>
            {recordings.footnote && (
              <p className="text-[13px] text-muted-text text-center mt-3">
                {recordings.footnote}
              </p>
            )}
            <p className="font-mono text-[11px] text-muted-text text-center mt-2">
              // TODO(handoff): wire to checkout
            </p>
          </div>
        </Card>

        {/* Tier 2: Live Cohort Card (Premium Option) */}
        <Card
          id="pricing-card-cohort"
          className="flex flex-col justify-between border-flag-red/50 shadow-2xl shadow-flag-red/10 relative bg-gradient-to-b from-ink-raised to-[#0D1438]"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-flag-red rounded-t-xl" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-flag-red" />
                <span className="font-mono text-xs uppercase tracking-wider text-paper-soft font-semibold">
                  {cohort.tag}
                </span>
              </div>
              <Badge variant="accent" size="sm">
                Premium
              </Badge>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-bold text-paper-soft mb-2">
              {cohort.name}
            </h3>
            <p className="text-[15px] text-body-text mb-6 leading-relaxed">
              {cohort.description}
            </p>

            {/* Price Display */}
            <div className="mb-6 p-4 rounded-xl bg-ink-deep border border-flag-red/30">
              <div className="flex items-baseline gap-3">
                {isPromoLive ? (
                  <>
                    <span className="font-mono text-3xl sm:text-4xl font-bold text-paper-soft">
                      {koboToNaira(activePriceKobo(cohort, true))}
                    </span>
                    <span className="font-mono text-lg sm:text-xl text-muted-text line-through">
                      {koboToNaira(cohort.fullPriceKobo)}
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-3xl sm:text-4xl font-bold text-paper-soft">
                    {koboToNaira(cohort.fullPriceKobo)}
                  </span>
                )}
              </div>
              <span className="text-[13px] text-muted-text mt-1 block">
                6 Weeks Live + Complete Cohort 1 Archive Included
              </span>
            </div>

            {/* Feature List */}
            <div className="space-y-3 mb-8">
              <span className="text-xs uppercase font-mono tracking-wider text-paper-soft font-semibold block mb-2">
                Everything in Recordings PLUS:
              </span>
              {cohort.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 text-[15px] text-paper-soft">
                  <Check className="w-4 h-4 text-flag-red shrink-0 mt-1" />
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Button
              id="cta-select-cohort"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onSelectTier('cohort')}
              className="font-bold text-lg shadow-lg shadow-flag-red/25"
            >
              {cohort.ctaText}
            </Button>
            {cohort.footnote && (
              <p className="text-[13px] text-muted-text text-center mt-3">
                {cohort.footnote}
              </p>
            )}
            <p className="font-mono text-[11px] text-muted-text text-center mt-2">
              // TODO(handoff): wire to checkout
            </p>
          </div>
        </Card>

      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-text">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#059669]" /> 7-Day Money-Back Guarantee
        </span>
        <span>•</span>
        <span>Bank Transfer & Card Options</span>
        <span>•</span>
        <span>Direct Telegram Community Access</span>
      </div>
    </section>
  );
};
