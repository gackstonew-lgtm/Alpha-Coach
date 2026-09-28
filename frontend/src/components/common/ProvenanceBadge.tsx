import React from 'react';
import { Database, UserCheck, Sparkles, HelpCircle } from 'lucide-react';

export type ProvenanceType = 'MT5 Execution Fact' | 'Trader Input' | 'AI Inference';

interface Props {
  type: ProvenanceType;
  tooltip?: string;
  showIcon?: boolean;
  className?: string;
}

export const ProvenanceBadge: React.FC<Props> = ({
  type,
  tooltip,
  showIcon = true,
  className = ''
}) => {
  const config = {
    'MT5 Execution Fact': {
      label: 'MT5 Execution Fact',
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: Database,
      defaultTooltip: 'Direct broker-reconciled execution record. 100% mathematically deterministic.'
    },
    'Trader Input': {
      label: 'Trader Input',
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: UserCheck,
      defaultTooltip: 'Subjective input supplied by user (emotions, playbook, journal notes).'
    },
    'AI Inference': {
      label: 'AI Inference',
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: Sparkles,
      defaultTooltip: 'Derived pattern or statistical observation produced by AI / quantitative engine.'
    }
  }[type];

  const Icon = config.icon;
  const note = tooltip || config.defaultTooltip;

  return (
    <span
      title={note}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} cursor-help transition select-none ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
      <HelpCircle className="w-2.5 h-2.5 opacity-60 ml-0.5" />
    </span>
  );
};
