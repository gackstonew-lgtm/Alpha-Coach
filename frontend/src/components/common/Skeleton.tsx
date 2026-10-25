import React from 'react';

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'line' | 'block' | 'circle' | 'card' | 'tile';
}

/**
 * Base layout-matching skeleton primitive.
 * Uses neutral grey ink scale and subtle shimmer, zero layout shift.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  style,
  variant = 'block'
}) => {
  const variantStyles = {
    line: 'h-4 w-full rounded-md',
    block: 'h-12 w-full rounded-xl',
    circle: 'rounded-full shrink-0',
    card: 'h-36 w-full rounded-2xl',
    tile: 'h-48 w-full rounded-3xl'
  }[variant];

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`
        bg-surface-secondary/80 dark:bg-surface-secondary/40
        relative overflow-hidden
        animate-pulse
        before:absolute before:inset-0
        before:-translate-x-full
        before:animate-[shimmer_2s_infinite]
        before:bg-gradient-to-r
        before:from-transparent before:via-white/10 dark:before:via-white/5 before:to-transparent
        ${variantStyles}
        ${className}
      `}
    />
  );
};

export const SkeletonTile: React.FC<{
  title?: boolean;
  rows?: number;
  height?: string;
  className?: string;
}> = ({ title = true, rows = 3, height = 'h-52', className = '' }) => (
  <div className={`framer-card p-5 rounded-3xl space-y-4 ${height} ${className}`}>
    {title && (
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <Skeleton variant="line" className="w-1/3 h-4" />
        <Skeleton variant="circle" className="w-6 h-6" />
      </div>
    )}
    <div className="space-y-2.5 pt-1">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="line"
          className={i === 0 ? 'w-2/3 h-6' : i === 1 ? 'w-full h-3.5' : 'w-4/5 h-3.5'}
        />
      ))}
    </div>
  </div>
);

export const SkeletonMetricCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`framer-card p-5 rounded-2xl space-y-3 ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton variant="line" className="w-24 h-3.5" />
      <Skeleton variant="circle" className="w-6 h-6" />
    </div>
    <Skeleton variant="line" className="w-32 h-7" />
    <Skeleton variant="line" className="w-28 h-3" />
  </div>
);

export const SkeletonChart: React.FC<{ className?: string; height?: string }> = ({
  className = '',
  height = 'h-80 sm:h-96'
}) => (
  <div className={`framer-card p-6 sm:p-7 rounded-3xl space-y-4 w-full ${className}`}>
    <div className="flex flex-col sm:flex-row justify-between gap-3">
      <div className="space-y-2">
        <Skeleton variant="line" className="w-48 h-5" />
        <Skeleton variant="line" className="w-64 h-3.5" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="block" className="w-24 h-8 rounded-xl" />
        <Skeleton variant="block" className="w-24 h-8 rounded-xl" />
      </div>
    </div>
    <div className={`w-full ${height} flex items-end gap-2 pt-6`}>
      {Array.from({ length: 16 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-lg"
          style={{ height: `${20 + ((i * 17) % 70)}%` }}
        />
      ))}
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 6,
  className = ''
}) => (
  <div className={`framer-card p-6 rounded-3xl space-y-4 ${className}`}>
    <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
      <Skeleton variant="line" className="w-36 h-4" />
      <Skeleton variant="line" className="w-20 h-4" />
    </div>
    <div className="space-y-3 pt-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center py-2 border-b border-border-subtle/50">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} variant="line" className={`h-4 ${c === 0 ? 'w-20' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
