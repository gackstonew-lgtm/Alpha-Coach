import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('trader@alphacoach.io');
  const [password, setPassword] = useState<string>('Password123!');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Auto-Login Button
  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      try {
        await login('trader@alphacoach.io', 'Password123!');
      } catch {
        // Register demo user if not created yet
        await register({
          email: 'trader@alphacoach.io',
          password: 'Password123!',
          firstName: 'Alex',
          lastName: 'Vance',
          timezone: 'UTC',
          currency: 'USD'
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800/80 shadow-2xl space-y-6 z-10 animate-in fade-in zoom-in-95">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/25 items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-blue-400 text-2xl">
              α
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Alpha Coach</h1>
          <p className="text-xs text-slate-400">Automated MT5 Trading Journal & Performance OS</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Email Address</label>
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <Mail className="w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-transparent text-white placeholder-slate-500 focus:outline-none w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Password</label>
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <Lock className="w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent text-white placeholder-slate-500 focus:outline-none w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 text-xs"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Performance OS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={handleDemoLogin}
            type="button"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30 rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow"
          >
            <Zap className="w-4 h-4" />
            <span>Instant Demo Access (With Mock MT5 Data)</span>
          </button>
        </div>

        {/* Register link */}
        <div className="text-center text-xs text-slate-400">
          New to Alpha Coach?{' '}
          <Link to="/register" className="text-blue-400 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
