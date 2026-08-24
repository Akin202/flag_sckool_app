import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const isButtonLoading = isLoading || loading;

  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CA3A32] disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[48px] min-w-[48px] rounded-lg tracking-tight';

  const sizeStyles = {
    sm: 'text-[15px] px-4 py-2.5 gap-2',
    md: 'text-[16px] px-6 py-3 gap-2.5',
    lg: 'text-[17px] px-8 py-3.5 gap-3 font-semibold',
  };

  // Flag Red (#CA3A32) is used as a background with Paper Soft (#F8FAFC) text for contrast AA verification
  const variantStyles = {
    primary:
      'bg-[#CA3A32] text-[#F8FAFC] hover:bg-[#B32E27] active:bg-[#9B2520] shadow-sm border border-transparent',
    secondary:
      'bg-[#0A0F29] text-[#F8FAFC] hover:bg-[#121A3F] active:bg-[#1A2342] border border-[#1A2342] hover:border-[#2D3A63]',
    ghost:
      'bg-transparent text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#0A0F29]/60 active:bg-[#0A0F29] border border-transparent',
    danger:
      'bg-[#991B1B] text-[#F8FAFC] hover:bg-[#7F1D1D] active:bg-[#5C1414] border border-transparent',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isButtonLoading}
      {...props}
    >
      {isButtonLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
