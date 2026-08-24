import React from 'react';
import { Countdown } from './ui/Countdown';
import { FlagSkoolConfig, PromoState, activePriceKobo, koboToNaira } from '@/types/index';
import { Flame, Tag } from 'lucide-react';
import { Button } from './ui/Button';

export interface PromoBarProps {
  config: FlagSkoolConfig;
  promoState: PromoState;
  onClaimPromo: () => void;
}

export const PromoBar: React.FC<PromoBarProps> = ({
  config,
  promoState,
  onClaimPromo,
}) => {
  const isLive = promoState === 'live';

  // Derived from config so a price or promo change never leaves stale copy
  // behind in the bar.
  const { recordings, cohort } = config.pricing;
  const savingKobo = recordings.fullPriceKobo - activePriceKobo(recordings, true);

  return (
    <section
      id="promo-bar-section"
      className="bg-ink-raised border-b border-ink-border py-5 px-4 sm:px-6 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        {/* Promo Title / Status */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="w-10 h-10 rounded-lg bg-ink-border border border-[#2D3A63]/50 flex items-center justify-center shrink-0">
            {isLive ? (
              <Flame className="w-5 h-5 text-flag-red" />
            ) : (
              <Tag className="w-5 h-5 text-muted-text" />
            )}
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="font-display font-bold text-lg text-paper-soft">
                {isLive ? config.promo.label : 'Standard Admission Open'}
              </span>
              {isLive && (
                <span className="px-2 py-0.5 rounded text-[12px] font-bold bg-flag-red text-paper-soft">
                  {config.promo.discountPercent}% OFF
                </span>
              )}
            </div>
            <p className="text-[15px] text-muted-text">
              {isLive
                ? `Save ${koboToNaira(savingKobo)} before the timer expires. Full recording archive included.`
                : `Full price: ${koboToNaira(recordings.fullPriceKobo)} (Recordings) / ${koboToNaira(cohort.fullPriceKobo)} (Live Cohort). Instant access.`}
            </p>
          </div>
        </div>

        {/* Live Countdown OR Expired Standard Price View */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-center">
          {isLive ? (
            <Countdown
              endsAt={config.promo.endsAt}
              isForcedExpired={false}
            />
          ) : (
            <div className="px-4 py-2.5 rounded-lg bg-ink-deep border border-ink-border text-body-text text-[15px] font-medium flex items-center gap-2">
              <span>Standard Tuitions Active</span>
              <span className="font-mono font-bold text-paper-soft">
                {koboToNaira(recordings.fullPriceKobo)}
              </span>
            </div>
          )}

          <Button
            variant={isLive ? 'primary' : 'secondary'}
            size="sm"
            onClick={onClaimPromo}
            className="w-full sm:w-auto whitespace-nowrap min-w-[140px]"
          >
            {isLive ? 'Lock in 50% discount' : 'View packages'}
          </Button>
        </div>
      </div>
    </section>
  );
};
