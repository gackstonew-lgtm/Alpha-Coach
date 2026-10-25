import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { MetaHead } from '../components/common/MetaHead';
import { trackEvent } from '../services/analytics';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
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
        firstName: firstName || 'Trader',
        lastName: lastName || '',
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
    <div className="min-h-[100dvh] w-full relative flex flex-col lg:flex-row items-stretch justify-start overflow-x-hidden bg-white">
      <MetaHead
        title="Sign Up — Arcade Fx Trading OS"
        description="Create your Arcade Fx account to automate MetaTrader 5 trade journaling, evaluate setup expectancies, and maintain psychological discipline."
        canonicalPath="/register"
      />

      {/* ========================================================================= */}
      {/* 1. DESKTOP & WIDE TABLET BACKGROUND (Full Artwork: White Panel + Wave + Ocean) */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full hidden lg:block overflow-hidden pointer-events-none select-none">
        <picture>
          <source
            srcSet="/assets/auth-bg-full-2400.webp 2400w, /assets/auth-bg-full-1600.webp 1600w, /assets/auth-bg-full-1024.webp 1024w"
            sizes="100vw"
            type="image/webp"
          />
          <img
            src="/assets/auth-bg-full.jpg"
            alt=""
            className="w-full h-full object-cover object-[center_left]"
            loading="eager"
            decoding="async"
          />
        </picture>
      </div>

      {/* ========================================================================= */}
      {/* 2. OVER-PHOTO GRAPHICS (DESKTOP: Top-Right Logo & Bottom-Right Lockup)    */}
      {/* ========================================================================= */}
      <div className="absolute top-8 right-8 lg:top-10 lg:right-14 z-20 hidden lg:block drop-shadow-[0_6px_20px_rgba(0,25,40,0.6)]">
        <Link to="/" className="inline-block transition-transform duration-300 hover:scale-105" aria-label="ArcadeFx Home">
          <Logo size="lg" />
        </Link>
      </div>

      <div className="absolute bottom-8 right-8 lg:bottom-10 lg:right-14 z-20 text-right hidden lg:block select-none pointer-events-none">
        <h2
          className="text-4xl xl:text-5xl font-black text-white uppercase tracking-[0.14em] font-sans"
          style={{ textShadow: '0 4px 18px rgba(0, 25, 40, 0.9), 0 1px 4px rgba(0, 25, 40, 0.9)' }}
        >
          ARCADE FX
        </h2>
        <p
          className="text-xs xl:text-sm font-extrabold text-teal-100 tracking-[0.24em] uppercase mt-1.5"
          style={{ textShadow: '0 2px 10px rgba(0, 25, 40, 0.9)' }}
        >
          Forex Intelligence & MT5 Journal
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE & TABLET PORTRAIT HERO BANNER (< 1024px)                        */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[32vh] min-h-[220px] max-h-[300px] lg:hidden overflow-hidden shrink-0 select-none bg-[#032630]">
        <picture>
          <source
            srcSet="/assets/auth-photo-1024.webp 1024w, /assets/auth-photo-640.webp 640w"
            sizes="100vw"
            type="image/webp"
          />
          <img
            src="/assets/auth-photo.jpg"
            alt="Arcade Fx Kayak on Turquoise Ocean"
            className="w-full h-full object-cover object-[center_32%]"
            loading="eager"
            decoding="async"
          />
        </picture>

        {/* Ambient Top & Bottom Scrim for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 pointer-events-none" />

        {/* Top-Right Logo */}
        <div className="absolute top-4 right-4 z-10 drop-shadow-[0_4px_12px_rgba(0,30,45,0.7)]">
          <Link to="/" aria-label="ArcadeFx Home">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Bottom-Right Tagline */}
        <div className="absolute bottom-6 right-4 z-10 text-right drop-shadow-[0_2px_8px_rgba(0,30,45,0.9)]">
          <span className="block text-sm font-black text-white uppercase tracking-[0.14em]">ARCADE FX</span>
          <span className="block text-[10px] font-bold text-teal-100 uppercase tracking-[0.2em]">Forex Intelligence & MT5 Journal</span>
        </div>

        {/* Wave Edge Divider transitioning photo banner into the white form panel */}
        <div className="absolute -bottom-1 left-0 right-0 h-6 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-white">
            <path d="M0,0 C150,90 350,-40 500,60 C650,140 900,10 1200,80 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LIVE AUTH FORM (Sits precisely over the white area of the artwork)    */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-center px-6 py-8 sm:px-10 md:px-14 lg:pl-16 xl:pl-24 2xl:pl-32 lg:max-w-[460px] xl:max-w-[500px]">
        <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto lg:mx-0">
          {/* Mockup Heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F1B4D] tracking-[0.16em] uppercase mb-6 sm:mb-8 font-sans">
            SIGN UP
          </h1>

          {/* Error Message */}
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
            {/* Optional First/Last Name Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#458B89] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="first name"
                  className="w-full h-11 bg-[#BFEFEC] text-[#0F1B4D] placeholder:text-[#458B89] placeholder:font-normal rounded-full pl-11 pr-3 text-xs font-semibold border-0 focus:ring-2 focus:ring-[#2CC5C0] outline-none transition-all shadow-none"
                />
              </div>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#458B89] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="last name"
                  className="w-full h-11 bg-[#BFEFEC] text-[#0F1B4D] placeholder:text-[#458B89] placeholder:font-normal rounded-full pl-11 pr-3 text-xs font-semibold border-0 focus:ring-2 focus:ring-[#2CC5C0] outline-none transition-all shadow-none"
                />
              </div>
            </div>

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
                autoComplete="new-password"
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

            {/* Terms of Service Checkbox (Exact Mockup Match) */}
            <div className="pt-1">
              <label className="flex items-center gap-2 select-none cursor-pointer text-xs text-[#0F1B4D]/80">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-[#25BAC0] bg-[#BFEFEC] border-0 focus:ring-2 focus:ring-[#2CC5C0] accent-[#25BAC0] cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs">
                  I agree all statements in{' '}
                  <Link to="/terms" className="text-[#1BA9B0] hover:text-[#2CC5C0] underline font-semibold transition">
                    terms of service
                  </Link>
                </span>
              </label>
            </div>

            {/* Pill Teal-Gradient Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="h-10 px-8 rounded-full bg-gradient-to-r from-[#2CC5C0] to-[#1BA9B0] text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(44,197,192,0.35)] hover:shadow-[0_8px_24px_rgba(44,197,192,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1B4D]"
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
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

          {/* Switch to Sign In */}
          <div className="pt-4 text-xs text-[#0F1B4D]/70 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1BA9B0] hover:text-[#2CC5C0] font-bold underline transition">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
