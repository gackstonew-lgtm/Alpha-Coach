import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';

export type SnapPoint = 'peek' | 'half' | 'full';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  initialSnap?: SnapPoint;
  snapPoints?: SnapPoint[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'destructive';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  peek: '30vh',
  half: '55vh',
  full: '90vh'
};

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  initialSnap = 'half',
  snapPoints = ['peek', 'half', 'full'],
  primaryAction,
  secondaryAction,
  className = ''
}) => {
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(initialSnap);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  // Sync snap on open
  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(initialSnap);
      setDragOffset(0);
      setIsDragging(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialSnap]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Pointer drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only allow drag if starting on the grabber or if content is at scroll top
    if (contentRef.current && contentRef.current.scrollTop > 0) {
      return;
    }
    startYRef.current = e.clientY;
    currentYRef.current = e.clientY;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    // Allow dragging downwards (positive delta) or slightly upwards with resistance
    if (deltaY > 0) {
      setDragOffset(deltaY);
    } else {
      setDragOffset(deltaY * 0.25);
    }
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaY = e.clientY - startYRef.current;

    // Dismiss threshold: drag down > 120px
    if (deltaY > 120) {
      onClose();
      return;
    }

    // Snap to nearest snap point
    if (deltaY < -60) {
      // Swiped up: expand
      if (currentSnap === 'peek') setCurrentSnap('half');
      else if (currentSnap === 'half') setCurrentSnap('full');
    } else if (deltaY > 60) {
      // Swiped down: minimize
      if (currentSnap === 'full') setCurrentSnap('half');
      else if (currentSnap === 'half') setCurrentSnap('peek');
    }
    setDragOffset(0);
  }, [isDragging, currentSnap, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Task Details'}
    >
      {/* Backdrop Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      />

      {/* Sheet Modal Container */}
      <div
        ref={sheetRef}
        style={{
          height: SNAP_HEIGHTS[currentSnap],
          transform: `translateY(${Math.max(0, dragOffset)}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className={`
          relative w-full max-w-2xl bg-surface dark:bg-[#0e1015]
          border-t sm:border border-border-strong sm:rounded-3xl rounded-t-3xl
          shadow-2xl flex flex-col overflow-hidden z-10
          animate-in slide-in-from-bottom-4 duration-200
          ${className}
        `}
      >
        {/* Grabber Header */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="pt-3 pb-2 px-6 flex flex-col items-center justify-center shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          {/* Centered Grabber Pill (36x4px) */}
          <div
            className="w-9 h-1 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
            title="Drag to resize or dismiss"
          />

          <div className="w-full flex items-center justify-between pt-3 pb-1">
            <div className="min-w-0 pr-4">
              {title && (
                <h3 className="font-extrabold text-base text-content-primary truncate tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-content-muted truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors"
              aria-label="Close sheet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 py-3 space-y-4 text-xs"
        >
          {children}
        </div>

        {/* Action Footer (Strict Single Primary Action + Outlined Secondary) */}
        {(primaryAction || secondaryAction) && (
          <div className="p-4 px-6 border-t border-border-subtle bg-surface-secondary/50 dark:bg-[#090b0e] shrink-0 flex items-center justify-end gap-3">
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="btn-secondary py-2 text-xs"
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                className={`
                  py-2 text-xs
                  ${primaryAction.variant === 'destructive' ? 'btn-destructive' : 'btn-primary'}
                `}
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
