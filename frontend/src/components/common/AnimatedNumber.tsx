import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  isVisible?: boolean;
  className?: string;
  formatter?: (val: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  from = 0,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  isVisible = true,
  className = '',
  formatter
}) => {
  const [displayValue, setDisplayValue] = useState<number>(from);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !isVisible) {
      if (isVisible) {
        setDisplayValue(value);
      }
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = from + (value - from) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [value, from, duration, isVisible]);

  const formatText = (val: number) => {
    if (formatter) {
      return formatter(val);
    }
    const formattedNum = val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${prefix}${formattedNum}${suffix}`;
  };

  return <span className={className}>{formatText(displayValue)}</span>;
};
