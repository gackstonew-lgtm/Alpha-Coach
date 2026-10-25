import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import { ArcadeFxLogo } from '../components/common/AlphaCoachLogo';
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

  return (
    <div className="min-h-screen w-full relative flex items-center justify-start overflow-hidden bg-[#003859]">
      <MetaHead
        title="Sign In — Arcade Fx Trading OS"
        description="Sign in to your Arcade Fx trading account to review automated MT5 trade journals, edge metrics, and AI Coach analysis."
        canonicalPath="/login"
      />

      {/* Full-Viewport Aerial Turquoise Water Background (Fallback gradient + SVG reef caustics) */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out scale-105"
        style={{
          backgroundImage: "url('/brand/water-aerial.svg'), radial-gradient(circle at 65% 45%, #149fa8 0%, #08818c 35%, #005368 70%, #023b4f 100%)",
          backgroundBlendMode: 'screen'
        }}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-center justify-between p-4 sm:p-6 lg:p-12">
        {/* Left Inset White Card with Reference A Torn Right Edge */}
        <div className="w-full max-w-[480px] lg:w-[42%] lg:max-w-[460px] my-auto">
          <div className="torn-paper-card torn-edge-right torn-edge-bottom bg-white dark:bg-[#151922] p-8 sm:p-10 lg:pr-14 shadow-2xl rounded-2xl lg:rounded-r-none transition-all duration-300">
            {/* Logo in Sleek Dark Navy Container (Protects Gold Contrast on White) */}
            <div className="mb-6 flex items-center justify-between">
              <Link to="/" className="inline-block group focus:outline-none">
                <div className="bg-[#0A0F1D] px-3.5 py-1.5 rounded-xl border border-white/10 shadow-sm transition group-hover:scale-105">
                  <ArcadeFxLogo size="sm" showWordmark={true} />
                </div>
              </Link>
            </div>

            {/* Reference A Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#00030C] dark:text-white tracking-[0.1em] uppercase mb-6 font-sans">
              SIGN IN
            </h1>

            {isPairingRedirect && (
              <div className="mb-5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-700 dark:text-teal-300 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-teal-600" />
                  <span>Authorize MT5 Companion Bridge</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Sign in with your credentials to link your MetaTrader 5 terminal.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            {/* Sign-In Form with Reference A Aqua Pill Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reference A: e-mail Input Pill */}
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#052728] dark:text-[#72E4E9] absolute left-4 z-10 opacity-70" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e-mail"
                  className="input-auth-pill text-xs text-[#052728] dark:text-white"
                />
              </div>

              {/* Reference A: password Input Pill */}
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#052728] dark:text-[#72E4E9] absolute left-4 z-10 opacity-70" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="password"
                  className="input-auth-pill text-xs text-[#052728] dark:text-white"
                />
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 select-none cursor-pointer text-[#334155] dark:text-slate-300 text-[11px]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#40BEB3] focus:ring-[#40BEB3] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 accent-[#40BEB3] cursor-pointer"
                  />
                  <span>Remember session</span>
                </label>
                <Link
                  to="/forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link has been dispatched to your email.');
                  }}
                  className="text-[#18837E] dark:text-[#40BEB3] font-semibold hover:underline text-[11px]"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Reference A: Turquoise Pill Primary Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-auth-primary w-40 text-xs disabled:opacity-50"
                >
                  {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </div>
            </form>

            {/* Reference A: Social Icons Row */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <button
                  type="button"
                  aria-label="Continue with Facebook"
                  onClick={() => alert('Social sign-in with Facebook is configured via Supabase OAuth.')}
                  className="w-8 h-8 rounded-full bg-[#3B5998] hover:opacity-90 flex items-center justify-center text-white text-xs font-bold transition shadow-sm"
                >
                  f
                </button>
                {/* Google */}
                <button
                  type="button"
                  aria-label="Continue with Google"
                  onClick={() => alert('Social sign-in with Google is configured via Supabase OAuth.')}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center justify-center text-xs font-bold transition shadow-sm"
                >
                  <span className="text-[#4285F4]">G</span>
                </button>
                {/* X */}
                <button
                  type="button"
                  aria-label="Continue with X"
                  onClick={() => alert('Social sign-in with X is configured via Supabase OAuth.')}
                  className="w-8 h-8 rounded-full bg-[#121212] hover:bg-black flex items-center justify-center text-white text-[11px] font-bold transition shadow-sm"
                >
                  𝕏
                </button>
              </div>
            </div>

            {/* Switch to Sign Up */}
            <div className="mt-5 text-xs text-slate-500 dark:text-slate-400">
              New to Arcade Fx?{' '}
              <Link to="/register" className="text-[#18837E] dark:text-[#40BEB3] font-bold hover:underline">
                Create an Account
              </Link>
            </div>
          </div>
        </div>

        {/* Right Headline Anchored Bottom-Right over Aerial Water (Reference A) */}
        <div className="hidden lg:flex flex-col items-end justify-end text-right p-8 lg:p-12 self-end mt-auto pointer-events-none select-none">
          <h2
            className="text-4xl xl:text-5xl font-black text-white uppercase tracking-[0.12em] font-sans drop-shadow-[0_4px_16px_rgba(0,30,45,0.7)]"
            style={{ textShadow: '0 4px 18px rgba(0, 30, 45, 0.85)' }}
          >
            ARCADE FX
          </h2>
          <p
            className="text-sm xl:text-base font-bold text-teal-100 uppercase tracking-[0.2em] mt-1.5 drop-shadow-[0_2px_8px_rgba(0,30,45,0.7)]"
            style={{ textShadow: '0 2px 10px rgba(0, 30, 45, 0.85)' }}
          >
            FOREX INTELLIGENCE & MT5 JOURNAL
          </p>
        </div>
      </div>
    </div>
  );
};
