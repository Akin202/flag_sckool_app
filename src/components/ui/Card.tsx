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
    raised: 'bg-[#0A0F29] text-[#CBD5E1]',
    flat: 'bg-[#030617] text-[#CBD5E1]',
    highlight: 'bg-[#0A0F29] border-[#CA3A32]/40 text-[#CBD5E1]',
  };

  return (
    <div
      className={clsx(
        'rounded-xl p-6 md:p-8',
        hasBorder && 'border border-[#1A2342]',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
