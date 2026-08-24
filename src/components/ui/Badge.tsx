import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'success' | 'warning';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[12px] px-2.5 py-1 font-medium tracking-wide',
    md: 'text-[13px] px-3.5 py-1.5 font-semibold tracking-wide',
  };

  const variantStyles = {
    neutral: 'bg-[#1A2342] text-[#E2E8F0] border border-[#2D3A63]/60',
    accent: 'bg-[#CA3A32] text-[#F8FAFC] border border-[#E04B43]/50 font-bold',
    success: 'bg-[#064E3B] text-[#A7F3D0] border border-[#059669]/40',
    warning: 'bg-[#78350F] text-[#FDE68A] border border-[#D97706]/40',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-md uppercase whitespace-nowrap select-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
