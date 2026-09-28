import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MetaHead } from '../components/common/MetaHead';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Breadcrumbs } from '../components/public/Breadcrumbs';
import { FAQ_ITEMS, getFAQSchema } from '../data/faqData';
import { ChevronDown, HelpCircle, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [openItem, setOpenItem] = useState<string | null>(FAQ_ITEMS[0].id);

  const toggleItem = (id: string) => {
    setOpenItem(prev => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg">
      <MetaHead
        title="Frequently Asked Questions (FAQ) | Meta Coach"
        description="Clear answers about MetaTrader 5 integration, Windows/Mac support, Zero-Password security architecture, pricing, and automated synchronization."
        canonicalPath="/faq"
        structuredData={getFAQSchema()}
      />
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
        <Breadcrumbs items={[{ name: 'FAQ', path: '/faq' }]} />

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Support & Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-content-primary">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            Everything you need to know about connecting MetaTrader 5, privacy guarantees, trade reconstruction, and our quantitative trading OS.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 pt-2">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openItem === item.id;
            return (
              <div
                key={item.id}
                className="framer-card rounded-2xl border border-border-subtle bg-surface overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-surface-secondary/50 transition cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-content-primary">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-content-muted flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-brand-500' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-content-muted leading-relaxed border-t border-border-subtle/50 pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support & Response Promise Card (Part A.11) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-secondary border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-content-primary">
              <Mail className="w-4 h-4 text-brand-500" aria-hidden="true" />
              <span>Have additional technical or architectural questions?</span>
            </div>
            <p className="text-xs text-content-muted">
              Contact our engineering and trader support team at{' '}
              <a href="mailto:support@metacoach.io" className="text-brand-500 hover:underline font-semibold font-mono">
                support@metacoach.io
              </a>
              . We reply within 24 hours.
            </p>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition whitespace-nowrap active:scale-95"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
