import React from 'react';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'mark' | 'badge' | 'auto' | 'dark' | 'light';
  showCandlesticks?: boolean;
  showWordmark?: boolean;
  alt?: string;
  priority?: boolean;
}

const SIZE_PRESETS = {
  sm: {
    height: 32,
    width: 47,
    fullWidth: 135,
    style: 'h-8 w-auto'
  },
  md: {
    height: 44,
    width: 64,
    fullWidth: 180,
    style: 'h-11 w-auto'
  },
  lg: {
    height: 60,
    width: 88,
    fullWidth: 245,
    style: 'h-15 w-auto'
  },
  xl: {
    height: 84,
    width: 122,
    fullWidth: 345,
    style: 'h-21 w-auto'
  }
};

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  showCandlesticks = true,
  showWordmark = true,
  alt = 'ArcadeFx',
  priority = false
}) => {
  const isNumeric = typeof size === 'number';
  const preset = !isNumeric ? SIZE_PRESETS[size] : null;

  const height = isNumeric ? size : preset?.height ?? 44;
  const isMarkOnly = variant === 'mark' || variant === 'badge' || (!showWordmark && variant === 'auto');

  // Compute aspect-ratio dimensions (1024 x 702 native)
  const calculatedWidth = isMarkOnly
    ? Math.round((height * 460) / 631)
    : Math.round((height * 1024) / 702);

  // Mark-only badge view
  if (isMarkOnly) {
    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        role="img"
        aria-label={alt}
      >
        <img
          src="/assets/arcadefx-logo.svg"
          alt={alt}
          width={calculatedWidth}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-auto object-contain transition-transform duration-300"
          style={{ height: `${height}px`, width: 'auto' }}
          onError={(e) => {
            // Graceful fallback to transparent PNG
            const target = e.currentTarget;
            if (target.src.indexOf('.svg') !== -1) {
              target.src = '/assets/arcadefx-logo.png';
            }
          }}
        />
      </div>
    );
  }

  // Full brand logo (Gold wordmark + Red/Blue candlesticks)
  return (
    <div
      className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
      role="img"
      aria-label={alt}
    >
      <img
        src="/assets/arcadefx-logo.svg"
        alt={alt}
        width={calculatedWidth}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`h-full w-auto object-contain transition-transform duration-300 hover:scale-[1.02] ${
          !isNumeric && preset ? preset.style : ''
        }`}
        style={{ height: `${height}px`, width: 'auto', maxHeight: '100%' }}
        onError={(e) => {
          // Graceful fallback to transparent PNG
          const target = e.currentTarget;
          if (target.src.indexOf('.svg') !== -1) {
            target.src = '/assets/arcadefx-logo.png';
          }
        }}
      />
    </div>
  );
};

export default Logo;
