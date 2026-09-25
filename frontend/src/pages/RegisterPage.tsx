import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AlphaCoachLogo } from '../components/common/AlphaCoachLogo';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await register({
        email,
        password,
        firstName,
        lastName,
        timezone: 'UTC',
        currency: 'USD'
      });

      if (res.requiresEmailConfirmation) {
        setSuccessMsg('Account created successfully! Please check your email for a confirmation link before logging in.');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col justify-center items-center p-4 relative overflow-hidden ambient-glow-bg">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full framer-card p-8 rounded-3xl shadow-xl space-y-6 z-10 animate-in fade-in zoom-in-95 duration-300 border border-border-subtle">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <AlphaCoachLogo size="lg" showWordmark={true} />
          </div>
          <h1 className="text-xl font-extrabold text-content-primary tracking-tight">Create Alpha Coach Account</h1>
          <p className="text-xs text-content-muted">Automate your MT5 trade journaling and trading psychology</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 text-center font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium space-y-2">
            <div className="flex items-center justify-center space-x-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Registration Successful</span>
            </div>
            <p>{successMsg}</p>
            <Link
              to="/login"
              className="inline-block mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {/* Form */}
        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-content-secondary font-medium">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full bg-surface-secondary border border-border-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-3.5 py-2.5 text-content-primary placeholder-content-subtle focus:outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-content-secondary font-medium">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Vance"
                  className="w-full bg-surface-secondary border border-border-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-3.5 py-2.5 text-content-primary placeholder-content-subtle focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-content-secondary font-medium">Email Address</label>
              <div className="flex items-center gap-2 bg-surface-secondary border border-border-subtle focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 rounded-xl px-3.5 py-2.5 transition">
                <Mail className="w-4 h-4 text-content-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent text-content-primary placeholder-content-subtle focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-content-secondary font-medium">Password</label>
              <div className="flex items-center gap-2 bg-surface-secondary border border-border-subtle focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 rounded-xl px-3.5 py-2.5 transition">
                <Lock className="w-4 h-4 text-content-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-content-primary placeholder-content-subtle focus:outline-none w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold rounded-xl transition shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 text-xs active:scale-95 disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Account...' : 'Get Started with Alpha Coach'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-xs text-content-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
