import React from 'react';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  variant?: 'auto' | 'light' | 'dark' | 'color';
}

export const TradersEdgeLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
  variant = 'auto'
}) => {
  // Height and dimensions scaled +20% for enhanced visual presence and legibility across devices
  const sizeClasses = {
    sm: showWordmark ? 'h-[34px] w-auto max-w-[160px]' : 'h-[34px] w-[34px] rounded-lg object-contain',
    md: showWordmark ? 'h-11 w-auto max-w-[200px]' : 'h-11 w-11 rounded-xl object-contain',
    lg: showWordmark ? 'h-[58px] w-auto max-w-[260px]' : 'h-[58px] w-[58px] rounded-2xl object-contain',
    xl: showWordmark ? 'h-[78px] w-auto max-w-[340px]' : 'h-[78px] w-[78px] rounded-2xl object-contain'
  }[size];

  // Zero-flash CSS-driven theme swapping classes
  let lightImgClass = 'block dark:hidden';
  let darkImgClass = 'hidden dark:block';

  if (variant === 'light') {
    lightImgClass = 'block';
    darkImgClass = 'hidden';
  } else if (variant === 'dark') {
    lightImgClass = 'hidden';
    darkImgClass = 'block';
  }

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      role="img"
      aria-label="Trader's Edge"
    >
      {/* Light Theme Logo (Dark text on light background) */}
      <img
        src="/brand/traders-edge-logo-light.png"
        alt="Trader's Edge"
        className={`transition-opacity duration-200 object-contain aspect-square ${sizeClasses} ${lightImgClass}`}
        loading="eager"
        decoding="async"
      />

      {/* Dark Theme Logo (White text on dark background) */}
      <img
        src="/brand/traders-edge-logo-dark.png"
        alt="Trader's Edge"
        className={`transition-opacity duration-200 object-contain aspect-square ${sizeClasses} ${darkImgClass}`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export const AlphaCoachLogo = TradersEdgeLogo;
export const MetaCoachLogo = TradersEdgeLogo;
export default TradersEdgeLogo;
