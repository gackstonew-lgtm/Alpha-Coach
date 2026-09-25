import React, { useState, useEffect } from 'react';
import { pwa } from '../../services/pwa';
import { AlphaCoachLogo } from '../common/AlphaCoachLogo';
import { Download, Share, X, PlusSquare } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    const updateStatus = () => {
      const standalone = pwa.isStandalone();
      const dismissed = pwa.isDismissedRecently();
      const ios = pwa.isIOS();
      const installable = pwa.canPromptInstall();

      setIsIOS(ios);
      setCanInstall(installable);

      if (!standalone && !dismissed && (installable || ios)) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    updateStatus();
    const unsubscribe = pwa.subscribe(updateStatus);
    return () => unsubscribe();
  }, []);

  const handleInstallClick = async () => {
    const result = await pwa.promptInstall();
    if (result === 'accepted' || result === 'dismissed') {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    pwa.setDismissed();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Install Alpha Coach application prompt"
      className="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 max-w-sm w-full framer-card p-4 rounded-2xl bg-surface border border-border-strong shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 text-xs"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Brand Icon */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-surface-secondary border border-border-subtle shrink-0">
            <AlphaCoachLogo size="sm" showWordmark={false} />
          </div>
          <div>
            <h3 className="font-bold text-content-primary text-xs">Install Alpha Coach</h3>
            <p className="text-[11px] text-content-muted">Fast standalone desktop & mobile app</p>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="mt-3 pt-3 border-t border-border-subtle">
        {isIOS && !canInstall ? (
          /* iOS / iPadOS Safari Specific Guidance */
          <div className="space-y-2.5">
            <p className="text-[11px] text-content-secondary leading-relaxed">
              To install on iPhone or iPad:
            </p>
            <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-subtle space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 font-medium text-content-primary">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-brand-500/10 text-brand-500 font-bold text-[10px]">1</span>
                <span>Tap the <Share className="w-3.5 h-3.5 inline text-brand-500 mx-0.5" /> <strong>Share</strong> button in Safari</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-content-primary">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-brand-500/10 text-brand-500 font-bold text-[10px]">2</span>
                <span>Select <PlusSquare className="w-3.5 h-3.5 inline text-brand-500 mx-0.5" /> <strong>Add to Home Screen</strong></span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-center text-xs font-semibold text-content-muted hover:text-content-primary transition"
            >
              Got it
            </button>
          </div>
        ) : (
          /* Android / Chromium / Desktop Native Install Action */
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-secondary transition font-semibold"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
