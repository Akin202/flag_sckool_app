import React from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  headline: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  headline,
  body,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl bg-[#0A0F29]/60 border border-dashed border-[#1A2342]',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-[#1A2342]/70 flex items-center justify-center text-[#8492A6] mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">{headline}</h3>
      <p className="text-[#8492A6] max-w-md text-[16px] leading-relaxed mb-6">
        {body}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
