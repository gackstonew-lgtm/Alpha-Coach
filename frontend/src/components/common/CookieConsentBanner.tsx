import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCookieConsent, setCookieConsent } from '../../services/analytics';
import { Cookie, Shield, Check, X } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent === null) {
      // Show banner after brief delay
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent('accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    setCookieConsent('declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-surface/95 backdrop-blur-md border-t border-border-strong shadow-2xl animate-in slide-in-from-bottom duration-300"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-content-secondary text-center sm:text-left">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 flex-shrink-0 hidden sm:flex">
            <Cookie className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="leading-relaxed">
            We use strictly essential cookies and anonymous analytics to improve platform performance. We never track your trades or store broker credentials. Read our{' '}
            <Link to="/cookies" className="text-brand-500 hover:underline font-semibold">
              Cookie Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl border border-border-subtle bg-surface-secondary hover:bg-surface-elevated text-content-muted hover:text-content-primary font-semibold text-xs transition"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
