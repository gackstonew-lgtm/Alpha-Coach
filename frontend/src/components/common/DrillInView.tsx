import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export interface DrillInViewProps {
  isOpen: boolean;
  onBack: () => void;
  title: string;
  parentTitle?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

/**
 * Slide-to-Drill-In View Transition.
 * Deeper navigation pushes in from the right (250-300ms ease-out).
 * Back button reverses it.
 */
export const DrillInView: React.FC<DrillInViewProps> = ({
  isOpen,
  onBack,
  title,
  parentTitle = 'Back',
  subtitle,
  children,
  headerAction,
  className = ''
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || (e.altKey && e.key === 'ArrowLeft')) && isOpen) {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onBack]);

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-40 bg-canvas
        flex flex-col overflow-hidden
        animate-in slide-in-from-right duration-250 ease-out
        ${className}
      `}
      data-drill-in-view="true"
    >
      {/* Drill-in Header Bar */}
      <header className="h-16 px-4 sm:px-6 border-b border-border-subtle bg-surface/95 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-content-primary text-xs font-bold border border-border-subtle transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">{parentTitle}</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-extrabold text-base sm:text-lg text-content-primary truncate tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-content-muted truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {headerAction && (
          <div className="shrink-0">
            {headerAction}
          </div>
        )}
      </header>

      {/* Drill-in Body Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default DrillInView;
