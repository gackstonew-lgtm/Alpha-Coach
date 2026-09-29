import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAccounts } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ArrowUp,
  BarChart3,
  BookOpen,
  Brain,
  Clock,
  Globe,
  Lightbulb,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  observedData?: Record<string, any>;
  calculatedStats?: Record<string, any>;
  patterns?: string[];
  recommendations?: string[];
  followUps?: string[];
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/* Lightweight markdown renderer (headings, bold, italic, lists, tables) */
/* ------------------------------------------------------------------ */

const renderInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-content-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic text-content-secondary">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

const MarkdownBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Headings
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push(
        <h3 key={key++} className="text-sm font-bold text-content-primary tracking-tight pt-1">
          {renderInline(heading[2])}
        </h3>
      );
      i++;
      continue;
    }

    // Table
    if (line.trim().startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i]
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map(c => c.trim());
        if (!cells.every(c => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={key++} className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full text-xs">
            <thead className="bg-surface-secondary text-content-secondary">
              <tr>
                {head.map((c, ci) => (
                  <th key={ci} className="text-left font-semibold px-3 py-2">
                    {renderInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-border-subtle">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 text-content-primary">
                      {renderInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet list
    if (/^\s*[-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-•]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={key++} className="space-y-1.5">
          {items.map((it, ii) => (
            <li key={ii} className="flex gap-2.5">
              <span className="mt-[7px] w-1 h-1 rounded-full bg-brand-primary shrink-0" />
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={key++} className="space-y-1.5">
          {items.map((it, ii) => (
            <li key={ii} className="flex gap-2.5">
              <span className="text-brand-primary font-semibold w-4 shrink-0 text-right">{ii + 1}.</span>
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-3 text-[13px] leading-relaxed text-content-primary">{blocks}</div>;
};

/* ------------------------------------------------------------------ */
/* Static content                                                       */
/* ------------------------------------------------------------------ */

const SUGGESTION_CARDS = [
  {
    icon: BarChart3,
    title: 'Review my performance',
    prompt: 'How did I perform overall across my trading history?'
  },
  {
    icon: TrendingDown,
    title: 'Find my losing patterns',
    prompt: 'What were my most common losing-trade characteristics?'
  },
  {
    icon: Clock,
    title: 'Compare my sessions',
    prompt: 'Show me my performance during London vs New York session.'
  },
  {
    icon: ShieldCheck,
    title: 'Size a trade correctly',
    prompt: 'How do I calculate position size?'
  },
  {
    icon: Globe,
    title: 'Understand market news',
    prompt: 'How do NFP and CPI move the market?'
  },
  {
    icon: Brain,
    title: 'Fix revenge trading',
    prompt: 'How do I stop revenge trading?'
  }
];

const RAIL_SECTIONS: { label: string; icon: React.ElementType; prompts: string[] }[] = [
  {
    label: 'Your journal',
    icon: BookOpen,
    prompts: [
      'How did I perform overall across my trading history?',
      'What were my most common losing-trade characteristics?',
      'Which trades should I manually review to improve discipline?'
    ]
  },
  {
    label: 'Forex knowledge',
    icon: Globe,
    prompts: [
      'What are the trading sessions and best time to trade?',
      'How do central banks affect currencies?',
      'What is support and resistance?',
      'How do I backtest a strategy?'
    ]
  },
  {
    label: 'Risk & mindset',
    icon: ShieldCheck,
    prompts: [
      'What is a good risk-to-reward ratio?',
      'How does drawdown affect recovery?',
      'Tell me about trading psychology'
    ]
  }
];

const THINKING_STEPS = [
  'Reading your question…',
  'Checking your trading data…',
  'Putting the answer together…'
];

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const greetingForHour = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export const AICoachPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const { user } = useAuth();
  const firstName = user?.first_name || '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [thinkingStep, setThinkingStep] = useState<number>(0);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = messages.length === 0;
  const greeting = useMemo(() => greetingForHour(), []);

  // Auto-scroll to newest message
  useEffect(() => {
    if (!isEmpty) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, isEmpty]);

  // Rotate thinking status text while waiting
  useEffect(() => {
    if (!isLoading) {
      setThinkingStep(0);
      return;
    }
    const t = setInterval(() => setThinkingStep(s => (s + 1) % THINKING_STEPS.length), 1400);
    return () => clearInterval(t);
  }, [isLoading]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputText]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: nowLabel()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res: any = await api.askAICoach(query, selectedAccountId, user?.first_name);
      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: res.answer,
        observedData: res.observedData,
        calculatedStats: res.calculatedStats,
        patterns: res.patterns,
        recommendations: res.recommendations,
        followUps: res.followUps,
        timestamp: nowLabel()
      };
      setMessages(prev => [...prev, coachMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `coach-err-${Date.now()}`,
          sender: 'coach',
          text: `I couldn't process that just now: ${err?.message || 'unknown error'}. Please try again.`,
          timestamp: nowLabel()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const newChat = () => {
    if (isLoading) return;
    setMessages([]);
    setInputText('');
  };

  const hasEntries = (o?: Record<string, any>) => !!o && Object.keys(o).length > 0;

  /* ------------------------------ Composer ------------------------------ */
  const composer = (
    <div className="sticky bottom-2 z-10">
      <div className="flex items-end gap-2 bg-surface border border-border-subtle rounded-3xl p-2 pl-4 shadow-card focus-within:border-brand-primary/50 transition">
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your trades or anything in forex…"
          className="flex-1 bg-transparent resize-none text-sm text-content-primary placeholder-content-muted py-2.5 focus:outline-none max-h-40"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputText.trim()}
          aria-label="Send message"
          className="framer-btn-primary w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-content-muted text-center mt-2">
        Meta Coach analyzes your journal and explains forex concepts. It is educational, not financial advice.
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex gap-8 min-h-[calc(100vh-9rem)] animate-in fade-in duration-300">
      {/* ---------------- Desktop side rail ---------------- */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-6 pt-1">
        <button
          onClick={newChat}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-secondary text-sm font-medium text-content-primary transition"
        >
          <Plus className="w-4 h-4 text-brand-primary" />
          New chat
        </button>

        {RAIL_SECTIONS.map(section => (
          <div key={section.label} className="space-y-1.5">
            <div className="flex items-center gap-2 px-2 text-xs font-semibold text-content-muted">
              <section.icon className="w-3.5 h-3.5" />
              {section.label}
            </div>
            {section.prompts.map(p => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                disabled={isLoading}
                className="w-full text-left text-xs leading-snug text-content-secondary hover:text-content-primary hover:bg-surface-secondary rounded-xl px-3 py-2 transition disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* ---------------- Main column ---------------- */}
      <section className="flex-1 min-w-0 flex flex-col">
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center py-6">
            <div className="max-w-3xl w-full mx-auto space-y-8">
              {/* Greeting */}
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-content-primary">
                  {greeting}
                  {firstName ? `, ${firstName}` : ''}
                </h1>
                <p className="text-base sm:text-lg text-content-secondary">
                  What would you like to explore today?
                </p>
              </div>

              {/* Suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTION_CARDS.map(card => (
                  <button
                    key={card.title}
                    onClick={() => handleSend(card.prompt)}
                    className="group text-left p-4 rounded-2xl bg-surface border border-border-subtle hover:border-brand-primary/40 hover:bg-surface-secondary transition flex items-start gap-3"
                  >
                    <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
                      <card.icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-content-primary">{card.title}</span>
                      <span className="block text-xs text-content-secondary mt-0.5 leading-snug">{card.prompt}</span>
                    </span>
                  </button>
                ))}
              </div>

              {composer}
            </div>
          </div>
        ) : (
          <>
            {/* Conversation */}
            <div className="flex-1 max-w-3xl w-full mx-auto space-y-8 py-4">
              {messages.map(msg =>
                msg.sender === 'user' ? (
                  <div key={msg.id} className="flex flex-col items-end gap-1">
                    <div className="max-w-[85%] px-4 py-3 rounded-3xl rounded-tr-lg bg-brand-primary text-white text-[13px] leading-relaxed font-medium shadow-md shadow-brand-primary/20 whitespace-pre-wrap">
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-content-muted px-2">{msg.timestamp}</span>
                  </div>
                ) : (
                  <div key={msg.id} className="flex gap-3">
                    <span className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0 space-y-4">
                      <MarkdownBlock text={msg.text} />

                      {hasEntries(msg.observedData) && (
                        <div className="p-4 rounded-2xl bg-surface border border-border-subtle">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary mb-3">
                            <BarChart3 className="w-3.5 h-3.5 text-brand-primary" />
                            From your journal
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(msg.observedData!).map(([k, v]) => (
                              <div key={k} className="min-w-0">
                                <div className="text-[10px] text-content-muted truncate">{k}</div>
                                <div className="text-sm font-semibold text-content-primary truncate">{String(v)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.patterns && msg.patterns.length > 0 && (
                        <div className="p-4 rounded-2xl bg-surface border border-border-subtle space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                            Patterns I noticed
                          </div>
                          <ul className="space-y-1.5 text-xs text-content-secondary leading-relaxed">
                            {msg.patterns.map((p, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-[6px] w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary">
                            <Lightbulb className="w-3.5 h-3.5" />
                            Suggested next steps
                          </div>
                          <ul className="space-y-1.5 text-xs text-content-secondary leading-relaxed">
                            {msg.recommendations.map((r, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-[6px] w-1 h-1 rounded-full bg-brand-primary shrink-0" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {msg.followUps.map(f => (
                            <button
                              key={f}
                              onClick={() => handleSend(f)}
                              disabled={isLoading}
                              className="px-3 py-1.5 rounded-full bg-surface border border-border-subtle hover:border-brand-primary/40 hover:bg-surface-secondary text-xs text-content-secondary transition disabled:opacity-50"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="block text-[10px] text-content-muted">{msg.timestamp}</span>
                    </div>
                  </div>
                )
              )}

              {isLoading && (
                <div className="flex gap-3 items-center">
                  <span className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </span>
                  <div className="flex items-center gap-2 text-xs text-content-muted">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce" />
                    </span>
                    <span>{THINKING_STEPS[thinkingStep]}</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="max-w-3xl w-full mx-auto">{composer}</div>
          </>
        )}
      </section>
    </div>
  );
};
