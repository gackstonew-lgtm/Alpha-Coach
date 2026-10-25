import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4 | 6;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className = '',
  columns = 4
}) => {
  const colClasses = {
    2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    6: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4'
  }[columns];

  return (
    <div className={`${colClasses} ${className}`} data-bento-grid="true">
      {children}
    </div>
  );
};

export interface BentoTileProps {
  children: React.ReactNode;
  span?: '1x1' | '2x1' | '2x2' | '3x2' | '4x2' | 'full';
  variant?: 'default' | 'hero' | 'subtle';
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  onDrillIn?: () => void;
  className?: string;
  contentClassName?: string;
}

export const BentoTile: React.FC<BentoTileProps> = ({
  children,
  span = '1x1',
  variant = 'default',
  title,
  subtitle,
  icon,
  badge,
  action,
  onDrillIn,
  className = '',
  contentClassName = ''
}) => {
  const spanClasses = {
    '1x1': 'col-span-1 row-span-1',
    '2x1': 'col-span-1 md:col-span-2 row-span-1',
    '2x2': 'col-span-1 md:col-span-2 row-span-2',
    '3x2': 'col-span-1 md:col-span-2 lg:col-span-3 row-span-2',
    '4x2': 'col-span-1 md:col-span-2 lg:col-span-4 row-span-2',
    'full': 'col-span-full'
  }[span];

  const variantClasses = {
    default: 'framer-card bg-surface border-border-subtle',
    hero: 'framer-card bg-surface border-border-strong dark:bg-[#0c0e14] shadow-md',
    subtle: 'framer-card bg-surface-secondary/70 border-border-subtle'
  }[variant];

  const isClickable = Boolean(onDrillIn);

  return (
    <div
      onClick={onDrillIn}
      className={`
        ${spanClasses}
        ${variantClasses}
        p-5 sm:p-6 rounded-3xl
        flex flex-col justify-between
        ${isClickable ? 'cursor-pointer hover:border-sky-500/50 hover:shadow-lg dark:hover:shadow-sky-500/10 active:scale-[0.99] transition-all duration-200 group' : ''}
        ${className}
      `}
      data-bento-tile="true"
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onDrillIn!() : undefined}
    >
      {(title || icon || badge || action || onDrillIn) && (
        <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="p-2 rounded-xl bg-surface-secondary text-sky-500 dark:text-sky-400 border border-border-subtle shrink-0">
                {icon}
              </div>
            )}
            {title && (
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-content-primary truncate tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-[11px] text-content-muted truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {badge}
            {action}
            {onDrillIn && (
              <ChevronRight className="w-4 h-4 text-content-muted group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </div>
      )}

      <div className={`flex-1 min-w-0 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default BentoGrid;
