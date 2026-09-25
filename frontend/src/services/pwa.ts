/**
 * Alpha Coach PWA Service
 * Handles Service Worker registration, installation prompts, and device detection
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PwaManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        this.notifyListeners();
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.notifyListeners();
      });
    }
  }

  public registerServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            // Check for updates periodically
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New update available
                    console.log('[PWA] New update available. Will apply seamlessly.');
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn('[PWA] ServiceWorker registration skipped/failed:', error);
          });
      });
    }
  }

  public isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    return Boolean(isStandaloneMode || isIOSStandalone);
  }

  public isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isIPadOS = /macintosh/.test(userAgent) && window.navigator.maxTouchPoints > 1;
    return isIOSDevice || isIPadOS;
  }

  public isAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return /android/i.test(window.navigator.userAgent);
  }

  public canPromptInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  public async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }
    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notifyListeners();
      return choiceResult.outcome;
    } catch {
      this.deferredPrompt = null;
      this.notifyListeners();
      return 'dismissed';
    }
  }

  public isDismissedRecently(): boolean {
    if (typeof window === 'undefined') return false;
    const dismissedAt = localStorage.getItem('alpha_coach_pwa_dismissed');
    if (!dismissedAt) return false;
    const timeDiff = Date.now() - parseInt(dismissedAt, 10);
    // 7 days cooldown
    return timeDiff < 7 * 24 * 60 * 60 * 1000;
  }

  public setDismissed(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('alpha_coach_pwa_dismissed', Date.now().toString());
      this.notifyListeners();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }
}

export const pwa = new PwaManager();
