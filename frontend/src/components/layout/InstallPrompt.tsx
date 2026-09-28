import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'alpha-coach-install-dismissed';
const SNOOZE_DAYS = 7;
const READY_EVENT = 'alpha-coach-install-ready';

// Chrome fires `beforeinstallprompt` once, often BEFORE React mounts.
// Capture it at module load (this file is imported early) and share it.
let capturedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    capturedPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(READY_EVENT));
  });
  window.addEventListener('appinstalled', () => {
    capturedPrompt = null;
  });
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS

const isSnoozed = () => {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - ts < SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

export const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isSnoozed()) return;

    // Android / Chrome / Edge: browser says the app is installable
    const syncFromCapture = () => {
      if (capturedPrompt) {
        setDeferred(capturedPrompt);
        setVisible(true);
      }
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    syncFromCapture(); // event may have already fired
    window.addEventListener(READY_EVENT, syncFromCapture);
    window.addEventListener('appinstalled', onInstalled);

    // iOS Safari never fires the event, so show manual steps
    let t: number | undefined;
    if (isIos()) {
      setShowIosHelp(true);
      t = window.setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener(READY_EVENT, syncFromCapture);
      window.removeEventListener('appinstalled', onInstalled);
      if (t) window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Alpha Coach"
      className="fixed z-40 inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96 rounded-2xl bg-surface border border-border-subtle shadow-2xl shadow-black/40 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <img
          src="/apple-touch-icon.png"
          alt=""
          className="w-12 h-12 rounded-xl flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-content-primary">Install Alpha Coach</p>
          <p className="text-xs text-content-secondary mt-0.5">
            Open your journal from your home screen, full screen, with faster loading.
          </p>
        </div>
      </div>

      {deferred ? (
        <button
          onClick={install}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold py-2.5 min-h-[44px] transition"
        >
          <Download className="w-4 h-4" />
          Install app
        </button>
      ) : showIosHelp ? (
        <ol className="mt-3 space-y-2 text-xs text-content-secondary">
          <li className="flex items-center gap-2">
            <Share className="w-4 h-4 text-brand-500 flex-shrink-0" />
            Tap the Share button in Safari
          </li>
          <li className="flex items-center gap-2">
            <PlusSquare className="w-4 h-4 text-brand-500 flex-shrink-0" />
            Choose "Add to Home Screen"
          </li>
        </ol>
      ) : null}
    </div>
  );
};
