import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  variant?: 'auto' | 'light' | 'dark' | 'color';
}

export const MetaCoachLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const iconDimensions = {
    sm: { width: 24, height: 28, text: 'text-sm', gap: 'gap-2' },
    md: { width: 32, height: 38, text: 'text-base', gap: 'gap-2.5' },
    lg: { width: 42, height: 50, text: 'text-xl', gap: 'gap-3' },
    xl: { width: 56, height: 66, text: 'text-3xl', gap: 'gap-3.5' }
  }[size];

  return (
    <div className={`inline-flex items-center ${iconDimensions.gap} select-none ${className}`}>
      {/* Official Meta Coach Shield Icon Mark */}
      <div
        className="relative flex-shrink-0 transition-transform duration-300 hover:scale-105"
        style={{ width: iconDimensions.width, height: iconDimensions.height }}
      >
        <svg
          viewBox="0 0 320 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="mcGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F7D89C" />
              <stop offset="50%" stop-color="#D5AB5A" />
              <stop offset="100%" stop-color="#B28532" />
            </linearGradient>
            <linearGradient id="mcSwooshGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#B28532" />
              <stop offset="50%" stop-color="#E2B766" />
              <stop offset="100%" stop-color="#FCE1A8" />
            </linearGradient>
          </defs>

          {/* Outer Shield Facets (3D Bevel) */}
          <path d="M 160 16 L 20 84 L 48 112 L 160 56 Z" fill="#4B515A" />
          <path d="M 160 16 L 300 84 L 272 112 L 160 56 Z" fill="#262A30" />
          <path d="M 20 84 L 20 240 L 48 228 L 48 112 Z" fill="#3E434B" />
          <path d="M 300 84 L 300 240 L 272 228 L 272 112 Z" fill="#32363E" />
          <path d="M 20 240 L 160 396 L 160 356 L 48 228 Z" fill="#2D3239" />
          <path d="M 300 240 L 160 396 L 160 356 L 272 228 Z" fill="#1A1E24" />

          {/* Inner Shield Face (Two-Tone Split) */}
          <path d="M 160 56 L 48 112 L 48 228 L 160 356 Z" fill="#24282F" />
          <path d="M 160 56 L 272 112 L 272 228 L 160 356 Z" fill="#16191E" />

          {/* Candlesticks */}
          {/* Candle 1 (Left) */}
          <line x1="108" y1="174" x2="108" y2="224" stroke="url(#mcGoldGrad)" strokeWidth="4.5" strokeLinecap="square" />
          <polygon points="93,224 123,224 123,242 93,270" fill="url(#mcGoldGrad)" />
          <line x1="108" y1="256" x2="108" y2="304" stroke="url(#mcGoldGrad)" strokeWidth="4.5" strokeLinecap="square" />

          {/* Candle 2 (Middle) */}
          <line x1="160" y1="142" x2="160" y2="186" stroke="url(#mcGoldGrad)" strokeWidth="4.5" strokeLinecap="square" />
          <polygon points="145,186 175,186 175,234 145,262" fill="url(#mcGoldGrad)" />
          <line x1="160" y1="248" x2="160" y2="294" stroke="url(#mcGoldGrad)" strokeWidth="4.5" strokeLinecap="square" />

          {/* Candle 3 (Right) */}
          <line x1="212" y1="106" x2="212" y2="148" stroke="url(#mcGoldGrad)" strokeWidth="4.5" strokeLinecap="square" />
          <polygon points="197,148 227,148 227,196 197,224" fill="url(#mcGoldGrad)" />
          <line x1="212" y1="210" x2="212" y2="254" stroke="url(#mcGoldGrad)" strokeWidth="4.5" strokeLinecap="square" />

          {/* Golden Swoosh Curve */}
          <path d="M 160 356 Q 226 344 266 214 Q 228 312 160 342 Z" fill="url(#mcSwooshGrad)" />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none font-sans">
          <div className="flex items-center gap-1">
            <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${iconDimensions.text}`}>
              Meta
            </span>
          </div>
          <span className={`font-semibold tracking-tight text-amber-500 dark:text-amber-400 ${iconDimensions.text} -mt-0.5`}>
            Coach
          </span>
        </div>
      )}
    </div>
  );
};

export const AlphaCoachLogo = MetaCoachLogo;
export default MetaCoachLogo;
