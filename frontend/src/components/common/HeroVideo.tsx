import React, { useState, useEffect } from 'react';

export interface HeroVideoProps {
  className?: string;
  poster?: string;
  src?: string;
  objectPosition?: string;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({
  className = '',
  poster = '/hero-poster.jpg',
  src = '/arcade_fx_hero.mp4',
  objectPosition = 'object-[right_center]',
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Respect prefers-reduced-motion user preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Reduced motion or fallback if video fails to load
  if (prefersReducedMotion || hasError) {
    return (
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className={`w-full h-full object-cover ${objectPosition} pointer-events-none select-none ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      onError={() => setHasError(true)}
      aria-hidden="true"
      className={`w-full h-full object-cover ${objectPosition} pointer-events-none select-none ${className}`}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

export default HeroVideo;
