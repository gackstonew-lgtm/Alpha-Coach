import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Achievement, TraderProgression } from '../types';
import {
  Trophy,
  Flame,
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
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <span>Gamification & Discipline Master</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Rewarding journaling discipline, loss reviews, and risk compliance — never overtrading
        </p>
      </div>

      {/* Level & XP Overview Card */}
      {profile && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-2xl font-extrabold text-white shadow-xl shadow-amber-500/20">
                Lv.{profile.progression.current_level}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-extrabold text-white">Disciplined Operator</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                    Tier {profile.progression.current_level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {profile.progression.current_xp} Total Experience Points (XP)
                </p>
              </div>
            </div>

            {/* Streak Counter */}
            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl">
              <Flame className="w-6 h-6 text-orange-400 fill-orange-400 animate-bounce" />
              <div>
                <div className="text-sm font-extrabold text-white">{profile.progression.current_streak_days} Day Streak</div>
                <div className="text-[10px] text-slate-500">Longest: {profile.progression.longest_streak_days} days</div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Level Progress</span>
              <span className="font-mono text-white">{profile.levelProgressPct}% ({profile.xpToNextLevel} XP to Level {profile.progression.current_level + 1})</span>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${profile.levelProgressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Discipline Achievements Grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <Award className="w-4 h-4 text-blue-400" />
          <span>Discipline & Review Milestones</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile?.achievements?.map(ach => (
            <div
              key={ach.id}
              className={`p-5 rounded-3xl border transition-all ${
                ach.unlocked
                  ? 'glass-panel border-emerald-500/30 bg-emerald-950/10'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-60'
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-2xl ${ach.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{ach.title}</h4>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">+{ach.xp_reward} XP</span>
                  </div>
                </div>

                {ach.unlocked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </div>

              <p className="text-xs text-slate-400 font-sans">{ach.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
