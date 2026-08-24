import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Clock } from 'lucide-react';

export interface CountdownProps {
  endsAt: string;
  isForcedExpired?: boolean;
  expiredSlot?: React.ReactNode;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(endsAt: string): TimeRemaining {
  const target = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = target - now;

  if (isNaN(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

export const Countdown: React.FC<CountdownProps> = ({
  endsAt,
  isForcedExpired = false,
  expiredSlot,
  className,
}) => {
  const [time, setTime] = useState<TimeRemaining>(() => calculateTimeRemaining(endsAt));

  useEffect(() => {
    if (isForcedExpired) return;

    const timer = setInterval(() => {
      setTime(calculateTimeRemaining(endsAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt, isForcedExpired]);

  const isExpired = isForcedExpired || time.isExpired;

  if (isExpired) {
    if (expiredSlot) {
      return <div className={className}>{expiredSlot}</div>;
    }
    return (
      <div
        className={clsx(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A2342]/60 border border-[#1A2342] text-[#8492A6] text-[15px]',
          className
        )}
      >
        <Clock className="w-4 h-4 text-[#8492A6]" />
        <span>Offer expired — Standard pricing applies</span>
      </div>
    );
  }

  const formatUnit = (val: number) => String(val).padStart(2, '0');

  return (
    <div className={clsx('flex items-center gap-2 sm:gap-3', className)}>
      <div className="flex flex-col items-center bg-[#0A0F29] border border-[#1A2342] rounded-lg px-3 py-2 min-w-[56px]">
        <span className="font-mono text-xl sm:text-2xl font-bold text-[#F8FAFC]">
          {formatUnit(time.days)}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[#8492A6] font-medium">Days</span>
      </div>
      <span className="font-mono text-xl font-bold text-[#8492A6] -mt-3">:</span>

      <div className="flex flex-col items-center bg-[#0A0F29] border border-[#1A2342] rounded-lg px-3 py-2 min-w-[56px]">
        <span className="font-mono text-xl sm:text-2xl font-bold text-[#F8FAFC]">
          {formatUnit(time.hours)}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[#8492A6] font-medium">Hours</span>
      </div>
      <span className="font-mono text-xl font-bold text-[#8492A6] -mt-3">:</span>

      <div className="flex flex-col items-center bg-[#0A0F29] border border-[#1A2342] rounded-lg px-3 py-2 min-w-[56px]">
        <span className="font-mono text-xl sm:text-2xl font-bold text-[#F8FAFC]">
          {formatUnit(time.minutes)}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[#8492A6] font-medium">Mins</span>
      </div>
      <span className="font-mono text-xl font-bold text-[#8492A6] -mt-3">:</span>

      <div className="flex flex-col items-center bg-[#0A0F29] border border-[#1A2342] rounded-lg px-3 py-2 min-w-[56px]">
        <span className="font-mono text-xl sm:text-2xl font-bold text-[#F8FAFC]">
          {formatUnit(time.seconds)}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[#8492A6] font-medium">Secs</span>
      </div>
    </div>
  );
};
