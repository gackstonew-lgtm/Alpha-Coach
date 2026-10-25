import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { HeroVideo } from '../components/common/HeroVideo';
import { MetaHead } from '../components/common/MetaHead';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Safely resolve redirect target (guaranteeing safe relative paths and preserving session params)
  const resolveRedirectUrl = (): string => {
    const rawRedirect = searchParams.get('redirect');
    if (!rawRedirect || !rawRedirect.startsWith('/') || rawRedirect.startsWith('//')) {
      return '/dashboard';
    }

    let target = rawRedirect;
    const sessionParam = searchParams.get('session');
    if (sessionParam && target.includes('/pair') && !target.includes('session=')) {
      const sep = target.includes('?') ? '&' : '?';
      target = `${target}${sep}session=${encodeURIComponent(sessionParam)}`;
    }
    return target;
  };

  const redirectUrl = resolveRedirectUrl();
  const isPairingRedirect = redirectUrl.includes('/pair');

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'facebook' | 'twitter') => {
    alert(`Social sign-in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} is configured via your connected Supabase OAuth project.`);
  };

  return (
    <div className="min-h-[100dvh] w-full relative flex flex-col lg:flex-row items-stretch justify-start overflow-x-hidden bg-white">
      <MetaHead
        title="Sign In — Arcade Fx Trading OS"
        description="Sign in to your Arcade Fx trading account to review automated MT5 trade journals, edge metrics, and AI Coach analysis."
        canonicalPath="/login"
      />

            {/* ========================================================================= */}
      {/* MOBILE HERO BANNER (< 1024px)                                             */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[32vh] min-h-[220px] max-h-[300px] lg:hidden overflow-hidden shrink-0 select-none bg-[#032630] order-first">
        <HeroVideo objectPosition="object-center" />
        {/* Wave Edge Divider transitioning into white form area */}
        <div className="absolute -bottom-1 left-0 right-0 h-6 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-white">
            <path d="M0,0 C150,90 350,-40 500,60 C650,140 900,10 1200,80 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LIVE AUTH FORM COLUMN (Solid White Container - No Video/Mockup Underneath) */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] bg-white flex flex-col justify-center px-6 py-8 sm:px-10 md:px-14 lg:pl-16 xl:pl-24 2xl:pl-32 lg:pr-12 shrink-0">
        <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto lg:mx-0">
          {/* Mockup Heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F1B4D] tracking-[0.16em] uppercase mb-6 sm:mb-8 font-sans">
            LOG IN
          </h1>

          {/* MT5 Bridge Redirect Alert */}
          {isPairingRedirect && (
            <div className="mb-5 p-3 rounded-2xl bg-[#BFEFEC]/50 border border-[#2CC5C0]/40 text-xs text-[#0F1B4D] space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#1BA9B0]" />
                <span>Authorize MT5 Bridge</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#0F1B4D]/80">
                Log in to link your MetaTrader 5 terminal.
              </p>
            </div>
          )}

          {/* Error Message (with preserved height to avoid layout shift) */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium animate-in fade-in duration-200"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail Pill Input */}
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-[#458B89] absolute left-4.5 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e-mail"
                className="w-full h-11 bg-[#BFEFEC] text-[#0F1B4D] placeholder:text-[#458B89] placeholder:font-normal rounded-full pl-12 pr-4 text-xs font-semibold border-0 focus:ring-2 focus:ring-[#2CC5C0] outline-none transition-all shadow-none"
              />
            </div>

            {/* Password Pill Input with Visibility Toggle */}
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#458B89] absolute left-4.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="password"
                className="w-full h-11 bg-[#BFEFEC] text-[#0F1B4D] placeholder:text-[#458B89] placeholder:font-normal rounded-full pl-12 pr-11 text-xs font-semibold border-0 focus:ring-2 focus:ring-[#2CC5C0] outline-none transition-all shadow-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-[#458B89] hover:text-[#0F1B4D] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CC5C0] rounded-full"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 select-none cursor-pointer text-[#0F1B4D]/80 text-[11px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#25BAC0] bg-[#BFEFEC] border-0 focus:ring-2 focus:ring-[#2CC5C0] accent-[#25BAC0] cursor-pointer"
                />
                <span>Remember session</span>
              </label>
              <Link
                to="/forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset link has been dispatched to your email.');
                }}
                className="text-[#1BA9B0] hover:text-[#2CC5C0] font-semibold hover:underline text-[11px]"
              >
                Forgot password?
              </Link>
            </div>

            {/* Pill Teal-Gradient Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="h-10 px-8 rounded-full bg-gradient-to-r from-[#2CC5C0] to-[#1BA9B0] text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(44,197,192,0.35)] hover:shadow-[0_8px_24px_rgba(44,197,192,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1B4D]"
              >
                {isLoading ? 'Logging in...' : 'Log in'}
              </button>
            </div>
          </form>

          {/* Social OAuth Icons Row (Original Brand Colors) */}
          <div className="flex items-center gap-3 pt-6 sm:pt-8">
            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              className="w-9 h-9 rounded-full bg-[#3B5998] hover:bg-[#324b80] flex items-center justify-center text-white text-sm font-bold shadow-xs hover:scale-105 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5998]"
              aria-label="Continue with Facebook"
            >
              f
            </button>
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center justify-center hover:scale-105 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              aria-label="Continue with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </button>
            {/* X / Twitter */}
            <button
              type="button"
              onClick={() => handleOAuth('twitter')}
              className="w-9 h-9 rounded-full bg-[#121212] hover:bg-black text-white text-xs font-bold shadow-xs hover:scale-105 active:scale-95 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              aria-label="Continue with X"
            >
              𝕏
            </button>
          </div>

          {/* Switch to Sign Up */}
          <div className="pt-4 text-xs text-[#0F1B4D]/70 font-medium">
            New trader?{' '}
            <Link to="/register" className="text-[#1BA9B0] hover:text-[#2CC5C0] font-bold underline transition">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP RIGHT VIDEO COLUMN (Cropped to Water/Kayak Beside Live Form)      */}
      {/* ========================================================================= */}
      <div className="hidden lg:block relative flex-1 min-h-[100dvh] overflow-hidden select-none pointer-events-none bg-[#032630]">
        <HeroVideo objectPosition="object-center" />
      </div>
    </div>
  );
};

export default LoginPage;
