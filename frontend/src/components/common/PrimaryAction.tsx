import React from 'react';
import { Loader2 } from 'lucide-react';

export interface PrimaryActionProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  slot?: 'header' | 'dock' | 'inline';
  shortcut?: string;
  title?: string;
}

/**
 * PrimaryAction ensures exactly ONE visually dominant call-to-action exists per view.
 * - Styled strictly in Sky Blue (primary accent).
 * - Desktop: Rendered in page headers or bento heroes.
 * - Mobile: Adapts cleanly to thumb-reachable docking when specified.
 */
export const PrimaryAction: React.FC<PrimaryActionProps> = ({
  label,
  icon,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  slot = 'inline',
  shortcut,
  title
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-bold text-xs sm:text-sm
    bg-sky-600 hover:bg-sky-500 active:bg-sky-700 dark:bg-sky-400 dark:hover:bg-sky-300 dark:active:bg-sky-200
    text-white dark:text-slate-950
    px-4 py-2.5 rounded-xl shadow-md shadow-sky-500/25 dark:shadow-sky-400/20
    transition-all duration-150 active:scale-[0.98] select-none
    disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
    cursor-pointer
  `;

  const dockClasses = slot === 'dock'
    ? 'fixed bottom-20 left-4 right-4 z-30 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:z-auto sm:w-auto shadow-xl'
    : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title || label}
      className={`${baseClasses} ${dockClasses} ${className}`}
      data-primary-action="true"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{label}</span>
      {shortcut && (
        <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-black/20 dark:bg-black/30 rounded text-white dark:text-slate-900">
          {shortcut}
        </kbd>
      )}
    </button>
  );
};

export default PrimaryAction;
