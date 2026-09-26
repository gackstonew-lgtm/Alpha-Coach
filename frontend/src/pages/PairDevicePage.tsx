import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, Cpu, CheckCircle2, XCircle, ArrowRight, AlertTriangle, Laptop, Lock } from 'lucide-react';
import { AlphaCoachLogo } from '../components/common/AlphaCoachLogo';

export const PairDevicePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get('session');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState<{
    sessionCode: string;
    deviceName: string;
    ipAddress?: string;
    status: string;
    expiresAt: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [rejected, setRejected] = useState<boolean>(false);

  useEffect(() => {
    if (sessionCode) {
      loadSession();
    } else {
      setIsLoading(false);
      setError('No pairing session provided in URL. Please initiate pairing from the Alpha Coach MT5 Bridge application.');
    }
  }, [sessionCode]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const data = await api.getBridgePairingSession(sessionCode!);
      setSessionData(data);
      if (data.status === 'AUTHORIZED' || data.status === 'COMPLETED') {
        setSuccess(true);
      } else if (data.status === 'REJECTED') {
        setRejected(true);
      } else if (data.status === 'EXPIRED') {
        setError('This pairing session has expired. Please restart the Alpha Coach MT5 Bridge to generate a fresh pairing link.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve pairing session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!sessionCode) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await api.authorizeBridgePairingSession(sessionCode);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to authorize device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!sessionCode) return;
    try {
      setIsSubmitting(true);
      await api.rejectBridgePairingSession(sessionCode);
      setRejected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reject device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3 font-mono text-xs text-content-muted">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>VERIFYING BRIDGE PAIRING SESSION...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col justify-center items-center p-4 relative overflow-hidden ambient-glow-bg">
      <div className="max-w-md w-full framer-card p-8 rounded-3xl shadow-xl space-y-6 z-10 animate-in fade-in zoom-in-95 duration-300 border border-border-subtle">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Link to="/">
              <AlphaCoachLogo size="lg" showWordmark={true} />
            </Link>
          </div>
          <h1 className="text-xl font-extrabold text-content-primary tracking-tight">
            Authorize MT5 Desktop Bridge
          </h1>
          <p className="text-xs text-content-muted">
            Connect your local MetaTrader 5 terminal to your Alpha Coach account
          </p>
        </div>

        {/* Not Logged In Notice */}
        {!user && (
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-400 space-y-3">
            <div className="flex items-center space-x-2 font-bold">
              <Lock className="w-4 h-4" />
              <span>Authentication Required</span>
            </div>
            <p className="text-content-secondary">
              Please sign in to your Alpha Coach account to authorize this MT5 Bridge device.
            </p>
            <Link
              to={`/login?redirect=/pair?session=${encodeURIComponent(sessionCode || '')}`}
              className="inline-flex items-center justify-center w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition text-xs"
            >
              <span>Sign In to Continue</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Pairing Request Error</span>
            </div>
            <p className="text-content-secondary">{error}</p>
          </div>
        )}

        {/* Rejected State */}
        {rejected && (
          <div className="p-5 rounded-2xl bg-surface-secondary border border-border-subtle text-xs space-y-3 text-center">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-content-primary">Pairing Request Denied</h3>
            <p className="text-content-muted">
              This device authorization was declined. You can safely close this browser window.
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-4 py-2 bg-surface hover:bg-surface-secondary text-content-primary font-bold rounded-xl border border-border-subtle text-xs transition"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-4 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-emerald-400">Device Successfully Connected!</h3>
              <p className="text-content-secondary">
                Your Alpha Coach MT5 Bridge is now paired and authorized. You can switch back to the desktop application to begin synchronizing your trading activity.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/bridge"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>View Connected Accounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/dashboard"
                className="text-xs text-content-muted hover:text-content-primary transition"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Active Confirmation View */}
        {user && !success && !rejected && sessionData && (
          <div className="space-y-5">
            {/* Device Details Card */}
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-medium">Requesting Device</span>
                <span className="flex items-center space-x-1.5 font-bold text-content-primary">
                  <Laptop className="w-4 h-4 text-brand-400" />
                  <span>{sessionData.deviceName}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-medium">Authorizing User</span>
                <span className="font-bold text-brand-400">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-muted font-medium">Security Scope</span>
                <span className="text-emerald-400 font-bold">Read-Only Journal Sync</span>
              </div>
            </div>

            {/* Zero Password Security Guarantee */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero Broker Password Exposure</span>
              </div>
              <p className="text-[11px] text-content-secondary leading-relaxed">
                Authorizing gives the local MT5 Bridge permission to send your read-only orders and deal histories to your private Alpha Coach journal.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="w-1/3 py-3 bg-surface hover:bg-surface-secondary border border-border-subtle text-content-secondary hover:text-content-primary font-bold rounded-xl transition text-xs disabled:opacity-50"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={handleAuthorize}
                disabled={isSubmitting}
                className="w-2/3 py-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold rounded-xl transition shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 text-xs active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize Bridge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
