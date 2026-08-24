import React from 'react';
import { clsx } from 'clsx';

export interface BaseFieldProps {
  label?: string;
  id: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>,
    BaseFieldProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  id,
  error,
  helperText,
  required,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[15px] font-medium text-[#F8FAFC] mb-1.5">
          {label}
          {required && <span className="text-[#CA3A32] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 pointer-events-none text-[#8492A6]">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          className={clsx(
            'w-full min-h-[48px] px-4 py-3 bg-[#0A0F29] border rounded-lg text-[16px] text-[#F8FAFC] placeholder-[#8492A6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CA3A32] focus:border-transparent',
            error ? 'border-[#CA3A32]' : 'border-[#1A2342] hover:border-[#2D3A63]',
            leftIcon && 'pl-11',
            rightIcon && 'pr-11',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 pointer-events-none text-[#8492A6]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[14px] text-[#CA3A32] font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-helper`} className="mt-1.5 text-[14px] text-[#8492A6]">
          {helperText}
        </p>
      )}
    </div>
  );
};

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>,
    BaseFieldProps {}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  id,
  error,
  helperText,
  required,
  className,
  rows = 4,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[15px] font-medium text-[#F8FAFC] mb-1.5">
          {label}
          {required && <span className="text-[#CA3A32] ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={clsx(
          'w-full min-h-[48px] px-4 py-3 bg-[#0A0F29] border rounded-lg text-[16px] text-[#F8FAFC] placeholder-[#8492A6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CA3A32] focus:border-transparent',
          error ? 'border-[#CA3A32]' : 'border-[#1A2342] hover:border-[#2D3A63]',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[14px] text-[#CA3A32] font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-helper`} className="mt-1.5 text-[14px] text-[#8492A6]">
          {helperText}
        </p>
      )}
    </div>
  );
};

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'>,
    BaseFieldProps {
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  id,
  options,
  error,
  helperText,
  required,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[15px] font-medium text-[#F8FAFC] mb-1.5">
          {label}
          {required && <span className="text-[#CA3A32] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={clsx(
            'w-full min-h-[48px] px-4 py-3 bg-[#0A0F29] border rounded-lg text-[16px] text-[#F8FAFC] transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-[#CA3A32] focus:border-transparent cursor-pointer',
            error ? 'border-[#CA3A32]' : 'border-[#1A2342] hover:border-[#2D3A63]',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0A0F29] text-[#F8FAFC]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8492A6]">
          ▼
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[14px] text-[#CA3A32] font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-helper`} className="mt-1.5 text-[14px] text-[#8492A6]">
          {helperText}
        </p>
      )}
    </div>
  );
};
