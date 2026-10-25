import React from 'react';
import { Logo, LogoProps } from './Logo';

export type { LogoProps };

/**
 * ArcadeFxLogo - Universal brand logo component.
 * Renders the transparent SVG ArcadeFx wordmark with candlestick accents,
 * with automatic fallback to high-resolution transparent PNG.
 */
export const ArcadeFxLogo: React.FC<LogoProps> = (props) => {
  return <Logo {...props} />;
};

// Aliases for seamless backward compatibility across the codebase
export const AlphaCoachLogo = ArcadeFxLogo;
export const TradersEdgeLogo = ArcadeFxLogo;
export const MetaCoachLogo = ArcadeFxLogo;
export default ArcadeFxLogo;
