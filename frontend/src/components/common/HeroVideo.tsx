import React, { useEffect, useRef } from 'react';

export interface HeroVideoProps {
  className?: string;
  src?: string;
  objectPosition?: string;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({
  className = '',
  src = '/arcade_fx_hero.mp4',
  objectPosition = 'object-center',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion: pause on first frame without swapping to an image
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (!videoRef.current) return;
      if (e.matches) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      className={`w-full h-full object-cover ${objectPosition} pointer-events-none select-none ${className}`}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

export default HeroVideo;
