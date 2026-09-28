import React, { useState, useEffect } from 'react';
import { pwa } from '../../services/pwa';
import { RefreshCw, X } from 'lucide-react';

export const PwaUpdateBanner: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState<boolean>(false);

  useEffect(() => {
    const checkUpdate = () => {
      setShowUpdate(pwa.isUpdateReady());
    };

    checkUpdate();
    const unsubscribe = pwa.subscribe(checkUpdate);
    return () => unsubscribe();
  }, []);

  if (!showUpdate) return null;

  return (
    <aside
      aria-label="Application update available"
      className="fixed z-50 top-4 left-1/2 -translate-x-1/2 max-w-md w-[calc(100%-2rem)] p-3.5 rounded-2xl bg-surface border border-brand-500/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 text-xs flex items-center justify-between gap-3 text-content-primary"
    >
      <div className="flex items-center gap-2.5">
        <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 shrink-0">
          <RefreshCw className="w-4 h-4 animate-spin" />
        </span>
        <div>
          <p className="font-bold text-xs">Update Available</p>
          <p className="text-[11px] text-content-muted">A newer version of Meta Coach is ready.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => pwa.activateUpdate()}
          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl font-bold transition shadow-sm"
        >
          Update Now
        </button>
        <button
          onClick={() => setShowUpdate(false)}
          aria-label="Dismiss update notification"
          className="p-1 rounded-lg text-content-muted hover:text-content-primary transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
