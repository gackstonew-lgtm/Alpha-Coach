export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'mt5-support',
    question: 'How does Meta Coach integrate with MetaTrader 5?',
    answer:
      'Meta Coach connects directly to your MetaTrader 5 desktop terminal via the official MetaTrader5 Python API. The lightweight Meta Coach Companion daemon runs locally on your machine, reading your historical deal tickets and real-time executions, and automatically reconstructs complex multi-order lifecycles (scale-ins, scale-outs, and partial closes) with complete mathematical fidelity.'
  },
  {
    id: 'os-support',
    question: 'Which operating systems are supported (Windows vs. macOS)?',
    answer:
      'The Meta Coach web platform and PWA run seamlessly across all operating systems, including Windows, macOS, Linux, iOS, and Android. Because MetaTrader 5 native desktop terminals run on Windows, the background MT5 Companion daemon runs on Windows. Mac traders running MT5 via a Windows VPS, Parallels Desktop, or CrossOver can easily run the companion daemon within that Windows environment to synchronize trades effortlessly.'
  },
  {
    id: 'safety-security',
    question: 'Is Meta Coach safe, and what data is accessed from my broker?',
    answer:
      'Meta Coach is engineered on a strict Zero-Password security model. The software never asks for, receives, or stores your broker passwords or master trading credentials. The local companion uses read-only Python terminal hooks to extract closed deals, active order tickets, and symbol specifications. Meta Coach has zero execution privileges and cannot place, alter, or cancel trades.'
  },
  {
    id: 'pricing-demo',
    question: 'Is there a free trial or instant demo mode available?',
    answer:
      'Yes. Meta Coach features an Instant Demo Access mode loaded with a comprehensive simulated trading portfolio. You can inspect the quantitative performance analytics, Strategy Lab confluence matrix, Risk Guardian limit evaluator, and AI Coach immediately without creating a broker connection. We offer straightforward individual and multi-account tiers for live traders.'
  },
  {
    id: 'sync-mechanism',
    question: 'How does deal synchronization and trade reconstruction work?',
    answer:
      'When your MT5 terminal executes orders, the companion bridge queries the local terminal cache and transmits cryptographically signed deal payloads over TLS HTTPS. Our 7-stage reconstruction pipeline matches entry and exit deal tickets by position ID and magic number, calculating accurate volume-weighted entry prices, holding times, slippage, commissions, and R-multiples stored under strict Row-Level Security.'
  }
];

export function getFAQSchema(items: FAQItem[] = FAQ_ITEMS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}
