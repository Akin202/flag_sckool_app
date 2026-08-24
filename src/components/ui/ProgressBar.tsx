import React from 'react';
import { clsx } from 'clsx';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = false,
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx('w-full', className)} {...props}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-[14px] text-muted-text mb-2 font-medium">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className="w-full h-2.5 bg-ink-border rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-flag-red rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
