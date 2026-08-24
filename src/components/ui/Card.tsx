import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'raised' | 'flat' | 'highlight';
  hasBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'raised',
  hasBorder = true,
  ...props
}) => {
  const variantStyles = {
    raised: 'bg-ink-raised text-body-text',
    flat: 'bg-ink-deep text-body-text',
    highlight: 'bg-ink-raised border-flag-red/40 text-body-text',
  };

  return (
    <div
      className={clsx(
        'rounded-xl p-6 md:p-8',
        hasBorder && 'border border-ink-border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
