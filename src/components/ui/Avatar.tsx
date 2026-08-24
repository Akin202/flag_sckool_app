import React from 'react';
import { clsx } from 'clsx';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  initials,
  size = 'md',
  className,
  ...props
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);

  const calculatedInitials =
    initials ||
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-[#1A2342] bg-[#0A0F29] text-[#F8FAFC]',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {src && !imageFailed ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="font-mono select-none tracking-wider text-[#F8FAFC]">
          {calculatedInitials || 'FS'}
        </span>
      )}
    </div>
  );
};
