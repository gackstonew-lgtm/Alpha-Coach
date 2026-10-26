import React, { useEffect, useRef } from 'react';

export interface HeroVideoProps {
  className?: string;
  src?: string;
  objectPosition?: string;
  cinematic?: boolean;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({
  className = '',
  src = '/hero%20arcade.mp4',
  objectPosition = 'object-center',
  cinematic = true,
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
    <div className="relative w-full h-full overflow-hidden select-none pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`w-full h-full object-cover ${objectPosition} pointer-events-none select-none ${
          cinematic ? 'hero-cinematic-video' : ''
        } ${className}`}
      >
        <source src={src} type="video/mp4" />
        <source src="/hero%20arcade.mp4" type="video/mp4" />
        <source src="/arcade_fx_hero.mp4" type="video/mp4" />
      </video>

      {/* 4K Cinematic Depth & Vignette Grading */}
      {cinematic && (
        <div
          className="absolute inset-0 pointer-events-none select-none bg-gradient-to-t from-black/50 via-transparent to-black/20 lg:bg-gradient-to-l lg:from-black/40 lg:via-transparent lg:to-black/10 mix-blend-multiply opacity-75"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default HeroVideo;
