import React from 'react';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  variant?: 'auto' | 'light' | 'dark' | 'badge';
}

export const ArcadeFxLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
  variant = 'auto'
}) => {
  // Dimension tokens scaled slightly larger for crisp visibility across all screens
  const sizeStyles = {
    sm: {
      wordmark: 'h-9 sm:h-10 w-auto',
      mark: 'h-9 w-9',
      width: 140,
      height: 40,
      container: 'px-2.5 py-1'
    },
    md: {
      wordmark: 'h-11 sm:h-12 w-auto',
      mark: 'h-11 w-11',
      width: 175,
      height: 48,
      container: 'px-3 py-1'
    },
    lg: {
      wordmark: 'h-16 sm:h-18 w-auto',
      mark: 'h-16 w-16',
      width: 250,
      height: 72,
      container: 'px-3.5 py-1.5'
    },
    xl: {
      wordmark: 'h-22 sm:h-26 w-auto',
      mark: 'h-22 w-22',
      width: 360,
      height: 104,
      container: 'px-5 py-2.5'
    }
  }[size];

  // If badge mode requested, render circular badge
  if (variant === 'badge' || (!showWordmark && variant === 'auto')) {
    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        role="img"
        aria-label="Arcade Fx"
      >
        <img
          src="/brand/arcade-fx-badge.png"
          alt="Arcade Fx"
          width={sizeStyles.height}
          height={sizeStyles.height}
          className={`${sizeStyles.mark} object-contain transition-transform duration-200 hover:scale-105`}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center select-none shrink-0 ${className}`}
      role="img"
      aria-label="Arcade Fx"
    >
      {/* Dark Theme Wordmark (Direct transparent gold/candlestick on dark canvas) */}
      <div className="hidden dark:inline-flex items-center">
        {showWordmark ? (
          <picture>
            <source srcSet="/brand/arcade-fx-wordmark.webp 1x, /brand/arcade-fx-wordmark@2x.webp 2x, /brand/arcade-fx-wordmark@3x.webp 3x" type="image/webp" />
            <img
              src="/brand/arcade-fx-wordmark.png"
              srcSet="/brand/arcade-fx-wordmark.png 1x, /brand/arcade-fx-wordmark@2x.png 2x, /brand/arcade-fx-wordmark@3x.png 3x"
              alt="Arcade Fx"
              width={sizeStyles.width}
              height={sizeStyles.height}
              className={`${sizeStyles.wordmark} object-contain transition-opacity duration-200`}
              loading="eager"
              decoding="async"
            />
          </picture>
        ) : (
          <img
            src="/brand/arcade-fx-mark.png"
            alt="Arcade Fx"
            width={sizeStyles.height}
            height={sizeStyles.height}
            className={`${sizeStyles.mark} object-contain`}
            loading="eager"
            decoding="async"
          />
        )}
      </div>

      {/* Light Theme Container (Protects gold metallic text contrast against light surfaces) */}
      <div className="inline-flex dark:hidden items-center">
        {showWordmark ? (
          <div className={`bg-[#06080e] rounded-xl border border-slate-800/80 shadow-xs flex items-center ${sizeStyles.container}`}>
            <picture>
              <source srcSet="/brand/arcade-fx-wordmark.webp 1x, /brand/arcade-fx-wordmark@2x.webp 2x" type="image/webp" />
              <img
                src="/brand/arcade-fx-wordmark.png"
                srcSet="/brand/arcade-fx-wordmark.png 1x, /brand/arcade-fx-wordmark@2x.png 2x"
                alt="Arcade Fx"
                width={sizeStyles.width}
                height={sizeStyles.height}
                className={`${sizeStyles.wordmark} object-contain`}
                loading="eager"
                decoding="async"
              />
            </picture>
          </div>
        ) : (
          <img
            src="/brand/arcade-fx-badge.png"
            alt="Arcade Fx"
            width={sizeStyles.height}
            height={sizeStyles.height}
            className={`${sizeStyles.mark} object-contain shadow-xs rounded-full`}
            loading="eager"
            decoding="async"
          />
        )}
      </div>
    </div>
  );
};

// Aliases for seamless backward compatibility across the codebase
export const AlphaCoachLogo = ArcadeFxLogo;
export const TradersEdgeLogo = ArcadeFxLogo;
export const MetaCoachLogo = ArcadeFxLogo;
export default ArcadeFxLogo;
