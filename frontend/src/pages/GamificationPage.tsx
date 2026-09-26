import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Achievement, TraderProgression } from '../types';
import {
  Trophy,
  Zap,
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

export const GamificationPage: React.FC = () => {
  const [profile, setProfile] = useState<{
    progression: TraderProgression;
    achievements: Achievement[];
    xpToNextLevel: number;
    levelProgressPct: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.getGamificationProfile();
      setProfile(res);
    } catch (err) {
      console.error('Failed to load gamification profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            Gamification & Discipline Master
          </h1>
        </div>
        <p className="text-xs text-content-secondary mt-1">
          Rewarding journaling discipline, loss reviews, and risk compliance — never overtrading
        </p>
      </div>

      {/* Level & XP Overview Card */}
      {profile && (
        <div className="framer-card p-6 space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl font-extrabold text-slate-950 shadow-xl shadow-amber-500/10">
                Lv.{profile.progression.current_level}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-content-primary">Disciplined Operator</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                    Tier {profile.progression.current_level}
                  </span>
                </div>
                <p className="text-xs text-content-secondary mt-0.5 font-mono">
                  {profile.progression.current_xp} Total Experience Points (XP)
                </p>
              </div>
            </div>

            {/* Discipline Mastery Badge */}
            <div className="flex items-center space-x-3 bg-surface-secondary border border-border-subtle px-4 py-2.5 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-brand-500" />
              <div>
                <div className="text-sm font-extrabold text-content-primary">Discipline Level {profile.progression.current_level}</div>
                <div className="text-[10px] text-content-muted">Rule Compliance Active</div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-content-secondary">
              <span>Level Progress</span>
              <span className="font-mono text-content-primary">{profile.levelProgressPct}% ({profile.xpToNextLevel} XP to Level {profile.progression.current_level + 1})</span>
            </div>
            <div className="w-full bg-surface-secondary h-3 rounded-full overflow-hidden p-0.5 border border-border-subtle">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${profile.levelProgressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Discipline Achievements Grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-content-primary flex items-center space-x-2">
          <Award className="w-4 h-4 text-brand-primary" />
          <span>Discipline & Review Milestones</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile?.achievements?.map(ach => (
            <div
              key={ach.id}
              className={`p-5 rounded-3xl border transition-all ${
                ach.unlocked
                  ? 'framer-card border-emerald-500/30 bg-emerald-500/5'
                  : 'bg-surface-secondary/40 border-border-subtle opacity-60'
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-2xl ${ach.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-secondary text-content-muted'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">{ach.title}</h4>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">+{ach.xp_reward} XP</span>
                  </div>
                </div>

                {ach.unlocked ? (
                  <CheckCircle2 className="w-5 h-5 text-trade-profit shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-content-muted shrink-0" />
                )}
              </div>

              <p className="text-xs text-content-secondary font-sans">{ach.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
