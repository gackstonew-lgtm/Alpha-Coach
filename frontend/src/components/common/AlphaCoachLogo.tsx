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
  // Height classes aligned with previous dimension tiers
  const sizeClasses = {
    sm: showWordmark ? 'h-7 w-auto' : 'h-7 w-7 rounded-md object-cover',
    md: showWordmark ? 'h-9 w-auto' : 'h-9 w-9 rounded-lg object-cover',
    lg: showWordmark ? 'h-12 w-auto' : 'h-12 w-12 rounded-xl object-cover',
    xl: showWordmark ? 'h-16 w-auto' : 'h-16 w-16 rounded-2xl object-cover'
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
        className={`transition-opacity duration-200 object-contain ${sizeClasses} ${lightImgClass}`}
        loading="eager"
        decoding="async"
      />

      {/* Dark Theme Logo (White text on dark background) */}
      <img
        src="/brand/traders-edge-logo-dark.png"
        alt="Trader's Edge"
        className={`transition-opacity duration-200 object-contain ${sizeClasses} ${darkImgClass}`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export const AlphaCoachLogo = TradersEdgeLogo;
export const MetaCoachLogo = TradersEdgeLogo;
export default TradersEdgeLogo;
