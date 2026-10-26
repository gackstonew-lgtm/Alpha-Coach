import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { HeroVideo } from '../components/common/HeroVideo';
import { MetaHead } from '../components/common/MetaHead';
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
    <div className="min-h-[100dvh] w-full relative flex flex-col lg:flex-row items-stretch justify-start overflow-x-hidden bg-background text-foreground">
      <MetaHead
        title="Sign Up — Arcade Fx Trading OS"
        description="Create your Arcade Fx account to automate MetaTrader 5 trade journaling, evaluate setup expectancies, and maintain psychological discipline."
        canonicalPath="/register"
      />

      {/* ========================================================================= */}
      {/* 1. DESKTOP FULL-SCREEN BACKGROUND VIDEO (White Panel + Wave + Ocean)     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full hidden lg:block overflow-hidden pointer-events-none select-none bg-background">
        <HeroVideo objectPosition="object-[left_center]" />
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE HERO BANNER (< 1024px)                                          */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[32vh] min-h-[220px] max-h-[300px] lg:hidden overflow-hidden shrink-0 select-none bg-background order-first">
        <HeroVideo objectPosition="object-[65%_center]" />
        {/* Wave Edge Divider transitioning into themed background area */}
        <div className="absolute -bottom-1 left-0 right-0 h-6 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-background">
            <path d="M0,0 C150,90 350,-40 500,60 C650,140 900,10 1200,80 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIVE AUTH FORM COLUMN (Themed Split-Panel over Video Area)             */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] bg-background/95 dark:bg-[#0e1217]/95 lg:bg-background/90 lg:dark:bg-[#0e1217]/90 backdrop-blur-md border-r border-border/40 flex flex-col justify-center px-6 py-8 sm:px-10 md:px-14 lg:pl-16 xl:pl-24 2xl:pl-28 lg:pr-8 shrink-0 min-h-[100dvh]">
        <div className="w-full max-w-[340px] sm:max-w-[380px] mx-auto lg:mx-0">
          {/* Reference Heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase mb-6 sm:mb-8 font-sans">
            SIGN UP
          </h1>

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
                className="w-full h-12 bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground rounded-xl pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-xs"
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
                className="w-full h-12 bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground rounded-xl pl-11 pr-11 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
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
                  className="w-4 h-4 rounded text-primary bg-surface border border-border focus:ring-2 focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs text-muted-foreground">
                  I agree all statements in{' '}
                  <Link to="/terms" className="text-primary hover:text-primary-hover underline font-semibold transition">
                    terms of service
                  </Link>
                </span>
              </label>
            </div>

            {/* Reference Primary Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-44 h-12 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-extrabold text-xs uppercase tracking-wider shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isLoading ? 'SIGNING UP...' : 'SIGN UP'}
              </button>
            </div>
          </form>

          {/* Social OAuth Icons Row */}
          <div className="flex items-center gap-3 pt-6 sm:pt-8">
            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              className="w-10 h-10 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] flex items-center justify-center text-white text-base font-bold shadow-xs hover:scale-105 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Continue with Facebook"
            >
              f
            </button>
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="w-10 h-10 rounded-xl bg-surface border border-border shadow-xs hover:bg-surface-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Continue with Google"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </button>
            {/* Twitter */}
            <button
              type="button"
              onClick={() => handleOAuth('twitter')}
              className="w-10 h-10 rounded-xl bg-surface border border-border text-foreground shadow-xs hover:bg-surface-elevated hover:scale-105 active:scale-95 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Continue with Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>

          {/* Switch to Sign In */}
          <div className="pt-4 text-xs text-muted-foreground font-medium">
            Have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-hover font-bold underline transition">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
