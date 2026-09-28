/**
 * Meta Coach — Privacy-Preserving Analytics Service
 * Only initializes Google Analytics (GA4) upon explicit user cookie consent.
 * Strictly avoids logging trade tickets, financial balances, passwords, or bridge tokens.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

const CONSENT_STORAGE_KEY = 'meta_coach_cookie_consent';

export function getCookieConsent(): 'accepted' | 'declined' | null {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) as 'accepted' | 'declined' | null;
  } catch {
    return null;
  }
}

export function setCookieConsent(status: 'accepted' | 'declined'): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
  } catch {
    // ignore
  }

  if (status === 'accepted') {
    initAnalytics();
  } else {
    // If declined, disable tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }
  }
}

let isInitialized = false;

export function initAnalytics(): void {
  if (isInitialized) return;
  const consent = getCookieConsent();
  if (consent !== 'accepted') return;

  const gaId = import.meta.env.VITE_GA_ID;
  if (!gaId || gaId.trim() === '' || gaId === 'G-XXXXXXXXXX') {
    return;
  }

  if (typeof window === 'undefined') return;

  // Setup dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', gaId, {
    send_page_view: false // Handled manually on route changes
  });

  // Inject gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  isInitialized = true;
}

export function trackPageView(path: string, title?: string): void {
  if (getCookieConsent() !== 'accepted' || !isInitialized) return;
  const gaId = import.meta.env.VITE_GA_ID;
  if (!gaId || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    send_to: gaId
  });
}

export type SafeAnalyticsEvent =
  | 'register'
  | 'demo_access'
  | 'bridge_connected'
  | 'pwa_install_prompt_shown'
  | 'pwa_installed';

export function trackEvent(
  eventName: SafeAnalyticsEvent,
  safeParams: Record<string, string | number | boolean> = {}
): void {
  if (getCookieConsent() !== 'accepted' || !isInitialized) return;
  if (typeof window === 'undefined' || !window.gtag) return;

  // Whitelist-sanitize params to guarantee no token or trade payload leaks
  const sanitizedParams: Record<string, any> = {};
  for (const [k, v] of Object.entries(safeParams)) {
    const keyLower = k.toLowerCase();
    if (
      keyLower.includes('token') ||
      keyLower.includes('password') ||
      keyLower.includes('secret') ||
      keyLower.includes('trade') ||
      keyLower.includes('pnl') ||
      keyLower.includes('balance')
    ) {
      continue;
    }
    sanitizedParams[k] = v;
  }

  window.gtag('event', eventName, sanitizedParams);
}
