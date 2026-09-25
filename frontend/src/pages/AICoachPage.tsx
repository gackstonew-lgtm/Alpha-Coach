import React, { useState } from 'react';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  Info,
  Layers,
  ArrowRight,
  Brain
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  observedData?: Record<string, any>;
  calculatedStats?: Record<string, any>;
  patterns?: string[];
  recommendations?: string[];
  timestamp: string;
}

export const AICoachPage: React.FC = () => {
  const { selectedAccountId } = useAccounts();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'coach',
      text: "👋 Welcome to your **Alpha Coach AI Performance Advisor**.\n\nI analyze your synchronized MT5 journal data to extract objective performance patterns, losing trade friction points, session expectancy, and risk rule compliance.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const promptChips = [
    "How did I perform overall across my trading history?",
    "What were my most common losing-trade characteristics?",
    "Show me my performance during London vs New York session.",
    "Which trades should I manually review to improve discipline?"
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api.askAICoach(query, selectedAccountId);
      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: res.answer,
        observedData: res.observedData,
        calculatedStats: res.calculatedStats,
        patterns: res.patterns,
        recommendations: res.recommendations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, coachMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `coach-err-${Date.now()}`,
          sender: 'coach',
          text: `⚠️ Error fetching insights: ${err.message || 'Could not process query.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-400" />
          <span>AI Trading Performance Coach</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Grounded data-driven analysis of your trading journal — zero hallucinations, pure empirical statistics
        </p>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap gap-2">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition text-left flex items-center space-x-1.5"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Chat Conversation Box */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 p-6 space-y-6 min-h-[450px] max-h-[600px] overflow-y-auto shadow-2xl flex flex-col">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
          >
            <div className={`max-w-2xl p-5 rounded-3xl text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                : 'bg-slate-900/95 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Directly Observed Data Matrix */}
              {msg.observedData && (
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono space-y-1">
                  <div className="text-slate-400 font-bold font-sans text-[10px] uppercase">1. Directly Observed Historical Data:</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    {Object.entries(msg.observedData).map(([k, v]) => (
                      <div key={k} className="truncate">
                        <span className="text-slate-500">{k}:</span> <strong>{String(v)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Patterns & Observations */}
              {msg.patterns && msg.patterns.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-[11px] space-y-1 font-sans">
                  <div className="text-amber-400 font-bold text-[10px] uppercase">2. Observed Behavioral & Session Patterns:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {msg.patterns.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono px-2">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 p-4 bg-slate-900/50 rounded-2xl w-fit">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Alpha Coach is analyzing your trading records...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-xl">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask Alpha Coach anything about your trades, sessions, win rates, or risk habits..."
          className="bg-transparent text-xs text-white placeholder-slate-500 px-3 py-2 focus:outline-none flex-1"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputText.trim()}
          className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition shadow-lg shadow-blue-500/25"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
