import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { api, markSessionValid } from '../services/api';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<{ user: User; token: string | null; session: any; requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ref to track the current user ID so we can avoid emitting a new user
  // object reference (and re-triggering dependent useEffects) when the
  // underlying Supabase user identity hasn't actually changed.
  const userIdRef = useRef<string | null>(null);

  // Clean up legacy alpha_coach_token storage key
  useEffect(() => {
    try {
      localStorage.removeItem('alpha_coach_token');
    } catch {
      // ignore
    }
  }, []);

  const buildUserFromSession = (currentSession: Session | null): User | null => {
    if (!currentSession || !currentSession.user) return null;
    const meta = currentSession.user.user_metadata || {};
    return {
      id: currentSession.user.id,
      email: currentSession.user.email || '',
      first_name: meta.first_name || 'Trader',
      last_name: meta.last_name || 'Alpha',
      role: meta.role || 'trader',
      timezone: meta.timezone || 'UTC',
      currency: meta.currency || 'USD',
      subscription_tier: meta.subscription_tier || 'PRO',
      is_active: 1
    };
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to fetch /me profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check directly from Supabase
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          const builtUser = buildUserFromSession(initialSession);
          setUser(builtUser);
          userIdRef.current = builtUser?.id ?? null;
          if (initialSession?.access_token) {
            markSessionValid();
          }
        }
      } catch (err) {
        if (mounted) {
          setSession(null);
          setUser(null);
          userIdRef.current = null;
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // 2. Continuous Listener for Supabase Auth state changes.
    //    KEY FIX: On TOKEN_REFRESHED, avoid creating a new user object reference
    //    if the user ID hasn't changed. This prevents AccountContext's
    //    useEffect([user, authLoading]) from re-firing and spawning a new
    //    /accounts request on every token refresh cycle.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      if (event === 'TOKEN_REFRESHED') {
        // Session is alive again — mark valid, update session token, but do NOT
        // rebuild the user object if the identity hasn't changed.
        markSessionValid();
        setSession(currentSession);
        // Only update user if the identity actually changed (e.g. different account).
        const newId = currentSession?.user?.id ?? null;
        if (newId !== userIdRef.current) {
          const builtUser = buildUserFromSession(currentSession);
          setUser(builtUser);
          userIdRef.current = newId;
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        markSessionValid();
      }

      setSession(currentSession);
      const builtUser = buildUserFromSession(currentSession);
      setUser(builtUser);
      userIdRef.current = builtUser?.id ?? null;
      setIsLoading(false);
    });

    // 3. Handle session-dead events from ApiClient (refresh storm prevention).
    //    Performs client-side state cleanup only when Supabase session is confirmed absent.
    //    Never triggers a full browser reload (window.location.replace).
    const handleAuthInvalid = async () => {
      if (!mounted) return;
      try {
        const { data: { session: currentSupabaseSession } } = await supabase.auth.getSession();
        if (!currentSupabaseSession) {
          setSession(null);
          setUser(null);
          userIdRef.current = null;
        }
      } catch {
        setSession(null);
        setUser(null);
        userIdRef.current = null;
      }
    };
    window.addEventListener('alpha:auth-invalid', handleAuthInvalid);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('alpha:auth-invalid', handleAuthInvalid);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        throw new Error('Invalid email or password. Please verify your credentials and try again.');
      } else if (msg.includes('api key')) {
        throw new Error('Authentication Service Error: Invalid API key configuration.');
      } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
        throw new Error('Too many sign-in attempts. Please wait a few minutes before trying again.');
      }
      throw new Error(error.message || 'Authentication failed. Please try again.');
    }

    if (!data.user || !data.session) {
      throw new Error('Authentication failed: no active session established.');
    }

    markSessionValid();
    setSession(data.session);
    const builtUser = buildUserFromSession(data.session);
    setUser(builtUser);
    userIdRef.current = builtUser?.id ?? null;
  };

  const register = async (data: any) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          timezone: data.timezone || 'UTC',
          currency: data.currency || 'USD',
          subscription_tier: 'PRO',
          role: 'trader'
        }
      }
    });

    if (error) {
      throw new Error(error.message || 'Registration failed.');
    }

    if (!authData.user) {
      throw new Error('Registration failed: no user record returned from authentication service.');
    }

    const currentSession = authData.session;
    setSession(currentSession);
    const userObj = buildUserFromSession(currentSession) || {
      id: authData.user.id,
      email: authData.user.email || data.email.trim(),
      first_name: data.firstName,
      last_name: data.lastName,
      role: 'trader',
      timezone: data.timezone || 'UTC',
      currency: data.currency || 'USD',
      subscription_tier: 'PRO',
      is_active: 1
    };
    setUser(userObj);
    userIdRef.current = userObj.id;
    if (currentSession) {
      markSessionValid();
    }

    return {
      user: userObj,
      token: currentSession?.access_token || null,
      session: currentSession,
      requiresEmailConfirmation: !currentSession
    };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      setSession(null);
      setUser(null);
      userIdRef.current = null;
      try {
        localStorage.removeItem('alpha_coach_token');
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token: session?.access_token || null,
        isLoading,
        isAuthenticated: Boolean(user && session),
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

