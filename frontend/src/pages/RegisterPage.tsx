import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { MetaHead } from '../components/common/MetaHead';
import { Logo } from '../components/common/Logo';
import { trackEvent } from '../services/analytics';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('You must agree to all statements in terms of service.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await register({
        email,
        password,
        firstName: 'Trader',
        lastName: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        currency: 'USD'
      });

      trackEvent('register');

      if (res.requiresEmailConfirmation) {
        navigate('/welcome?emailPending=true');
      } else {
        navigate('/welcome');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'facebook' | 'twitter') => {
    alert(`Social sign-up with ${provider.charAt(0).toUpperCase() + provider.slice(1)} is configured via your connected Supabase OAuth project.`);
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row items-stretch justify-start bg-background text-foreground">
      <MetaHead
        title="Sign Up — Arcade Fx Trading OS"
        description="Create your Arcade Fx account to automate MetaTrader 5 trade journaling, evaluate setup expectancies, and maintain psychological discipline."
        canonicalPath="/register"
      />

      {/* ========================================================================= */}
      {/* 1. LIVE AUTH FORM COLUMN (Clean, Accessible & Trustworthy)                */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] bg-surface dark:bg-[#080D14] border-r border-border flex flex-col justify-center px-6 py-10 sm:px-10 md:px-14 lg:pl-16 xl:pl-20 shrink-0 min-h-[100dvh]">
        <div className="w-full max-w-[340px] sm:max-w-[380px] mx-auto lg:mx-0">
          {/* Brand Logo Header */}
          <Link to="/" className="inline-block mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-xl" aria-label="Go to Arcade Fx home">
            <Logo size="md" />
          </Link>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase mb-1 font-sans">
            SIGN UP
          </h1>
          <p className="text-xs text-muted-foreground mb-6 font-medium">
            Start automating your MetaTrader 5 performance journals
          </p>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium animate-in fade-in duration-200"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail Input */}
            <div className="relative flex items-center">
              <User className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e-mail"
                className="w-full h-12 bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground rounded-xl pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8] transition-all shadow-xs"
              />
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="relative flex items-center">
              <Lock className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="password"
                className="w-full h-12 bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground rounded-xl pl-11 pr-11 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8] transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-lg"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2 select-none cursor-pointer text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-[#38BDF8] bg-surface border border-border focus:ring-2 focus:ring-[#38BDF8] accent-[#38BDF8] cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs text-muted-foreground">
                  I agree all statements in{' '}
                  <Link to="/terms" className="text-[#38BDF8] underline font-semibold transition">
                    terms of service
                  </Link>
                </span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-[#38BDF8] hover:bg-[#0284c7] text-[#080D14] hover:text-white font-extrabold text-xs uppercase tracking-wider shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              </button>
            </div>
          </form>

          {/* Social OAuth Icons Row */}
          <div className="flex items-center gap-3 pt-6 sm:pt-8">
            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              className="w-10 h-10 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] flex items-center justify-center text-white text-base font-bold shadow-xs hover:scale-105 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              aria-label="Continue with Facebook"
            >
              f
            </button>
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="w-10 h-10 rounded-xl bg-surface border border-border shadow-xs hover:bg-surface-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              aria-label="Continue with Google"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </button>
            {/* Twitter / X */}
            <button
              type="button"
              onClick={() => handleOAuth('twitter')}
              className="w-10 h-10 rounded-xl bg-surface border border-border text-foreground shadow-xs hover:bg-surface-elevated hover:scale-105 active:scale-95 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              aria-label="Continue with Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>

          {/* Switch to Sign In */}
          <div className="pt-5 text-xs text-muted-foreground font-medium">
            Have an account?{' '}
            <Link to="/login" className="text-[#38BDF8] hover:underline font-bold transition">
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP THEMED SHOWCASE PANEL (Clean Plain Gradient — No JPG Assets)   */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 bg-gradient-to-br from-[#0B1B2B] via-[#0A1522] to-[#080D14] text-white relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <Logo size={120} className="w-auto h-24 object-contain drop-shadow-md" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight font-sans">
              Forex Intelligence & MT5 Journal
            </h2>
            <p className="text-xs sm:text-sm text-[#A9BBCB] leading-relaxed max-w-sm mx-auto">
              Empirical discipline metrics, automated trade logs, and quantitative execution review built for modern traders.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 select-none">
              ✓ Zero Passwords Stored
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 select-none">
              ✓ Sub-Millisecond MT5 Sync
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 select-none">
              ✓ Local Bridge Security
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
