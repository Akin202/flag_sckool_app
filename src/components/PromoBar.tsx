import React from 'react';
import { Countdown } from './ui/Countdown';
import { FlagSkoolConfig, PromoState } from '@/types/index';
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

  return (
    <section
      id="promo-bar-section"
      className="bg-[#0A0F29] border-b border-[#1A2342] py-5 px-4 sm:px-6 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        {/* Promo Title / Status */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="w-10 h-10 rounded-lg bg-[#1A2342] border border-[#2D3A63]/50 flex items-center justify-center shrink-0">
            {isLive ? (
              <Flame className="w-5 h-5 text-[#CA3A32]" />
            ) : (
              <Tag className="w-5 h-5 text-[#8492A6]" />
            )}
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="font-display font-bold text-lg text-[#F8FAFC]">
                {isLive ? config.promo.label : 'Standard Admission Open'}
              </span>
              {isLive && (
                <span className="px-2 py-0.5 rounded text-[12px] font-bold bg-[#CA3A32] text-[#F8FAFC]">
                  50% OFF
                </span>
              )}
            </div>
            <p className="text-[15px] text-[#8492A6]">
              {isLive
                ? 'Save ₦50,000 before the timer expires. Full recording archive included.'
                : 'Full price: ₦100,000 (Recordings) / ₦150,000 (Live Cohort). Instant access.'}
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
            <div className="px-4 py-2.5 rounded-lg bg-[#030617] border border-[#1A2342] text-[#CBD5E1] text-[15px] font-medium flex items-center gap-2">
              <span>Standard Tuitions Active</span>
              <span className="font-mono font-bold text-[#F8FAFC]">₦100,000</span>
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
