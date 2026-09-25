import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  variant?: 'auto' | 'light' | 'dark' | 'color';
}

export const AlphaCoachLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
  variant = 'auto'
}) => {
  const iconDimensions = {
    sm: { width: 24, height: 24, text: 'text-sm' },
    md: { width: 34, height: 34, text: 'text-base' },
    lg: { width: 44, height: 44, text: 'text-xl' },
    xl: { width: 64, height: 64, text: 'text-3xl' }
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Alpha Coach Icon Mark */}
      <div
        className="relative flex-shrink-0 transition-transform duration-300 hover:scale-105"
        style={{ width: iconDimensions.width, height: iconDimensions.height }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >

          {/* Curved Book Top / Journal Flap */}
          <path
            d="M22 68C22 42 22 24 44 24C66 24 78 30 78 44C78 54 70 60 52 60H34"
            className="stroke-blue-600 dark:stroke-indigo-400 fill-blue-700/10 dark:fill-indigo-500/20"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main Book Cover Body */}
          <path
            d="M36 24H52C70 24 78 32 78 44C78 56 68 62 50 62H32C24 62 20 66 20 72C20 78 24 82 32 82H74"
            className="stroke-blue-600 dark:stroke-blue-400"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Spine Ribbon Loop */}
          <path
            d="M32 68H44"
            className="stroke-blue-500 dark:stroke-blue-300"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Notched Bookmark Ribbon */}
          <path
            d="M48 68V88L58 82L68 88V68"
            className="fill-blue-600 dark:fill-indigo-500 stroke-blue-700 dark:stroke-indigo-400"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${iconDimensions.text} font-sans`}>
              Alpha
            </span>
          </div>
          <span className={`font-semibold tracking-tight text-slate-700 dark:text-slate-300 ${iconDimensions.text} font-sans -mt-0.5`}>
            Coach
          </span>
        </div>
      )}
    </div>
  );
};

export default AlphaCoachLogo;
