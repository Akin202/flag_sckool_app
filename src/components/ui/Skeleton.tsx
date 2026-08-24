import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  circle = false,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'relative overflow-hidden bg-[#1A2342]/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#2D3A63]/30 before:to-transparent',
        circle ? 'rounded-full' : 'rounded-lg',
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    />
  );
};
