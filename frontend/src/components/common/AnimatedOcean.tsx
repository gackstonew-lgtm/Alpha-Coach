import React, { useEffect, useRef, useState } from 'react';

interface AnimatedOceanProps {
  /**
   * 'full': Desktop full bleed with left white panel wavy overlay + right animated ocean.
   * 'photo': Dedicated ocean photo/video only (used in mobile hero banner or standalone hero section).
   */
  variant?: 'full' | 'photo';
  className?: string;
  priority?: boolean;
}

export const AnimatedOcean: React.FC<AnimatedOceanProps> = ({
  variant = 'full',
  className = '',
  priority = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    // Detect user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Pause video when out of viewport to save battery & GPU
    if (!containerRef.current || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
    >
      {/* 1. Static Poster / High-Res Fallback (always present for instant LCP) */}
      <picture className="absolute inset-0 w-full h-full">
        {variant === 'full' ? (
          <>
            <source
              srcSet="/assets/auth-bg-full-2400.webp 2400w, /assets/auth-bg-full-1600.webp 1600w, /assets/auth-bg-full-1024.webp 1024w"
              sizes="100vw"
              type="image/webp"
            />
            <img
              src="/assets/auth-bg-full.jpg"
              alt=""
              className="w-full h-full object-cover object-[center_left]"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
            />
          </>
        ) : (
          <>
            <source
              srcSet="/assets/auth-photo-1024.webp 1024w, /assets/auth-photo-640.webp 640w"
              sizes="100vw"
              type="image/webp"
            />
            <img
              src="/assets/auth-photo.jpg"
              alt="Arcade Fx Kayak on Turquoise Ocean"
              className="w-full h-full object-cover object-[center_32%]"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
            />
          </>
        )}
      </picture>

      {/* 2. Seamless Looping Video Layer (if motion is allowed) */}
      {!prefersReducedMotion && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/assets/anim/auth-scene-poster.jpg"
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            variant === 'full' ? 'object-[center_left]' : 'object-[center_32%]'
          } ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden="true"
        >
          {/* Desktop/Tablet Wide VP9 / H264 sources */}
          <source
            media="(min-width: 768px)"
            src="/assets/anim/auth-scene-desktop.webm"
            type="video/webm"
          />
          <source
            media="(min-width: 768px)"
            src="/assets/anim/auth-scene-desktop.mp4"
            type="video/mp4"
          />
          {/* Mobile Portrait sources */}
          <source
            src="/assets/anim/auth-scene-mobile.webm"
            type="video/webm"
          />
          <source
            src="/assets/anim/auth-scene-mobile.mp4"
            type="video/mp4"
          />
        </video>
      )}

      {/* 3. For variant="full" on Desktop: White panel wavy edge overlay so the left form stays pure white */}
      {variant === 'full' && (
        <div className="absolute inset-0 w-full h-full hidden lg:block pointer-events-none">
          <picture>
            <source srcSet="/assets/anim/white-wave-overlay.webp" type="image/webp" />
            <img
              src="/assets/anim/white-wave-overlay.png"
              alt=""
              className="w-full h-full object-cover object-[center_left]"
            />
          </picture>
        </div>
      )}
    </div>
  );
};

export default AnimatedOcean;
