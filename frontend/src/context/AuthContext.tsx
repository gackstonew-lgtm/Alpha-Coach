import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { api } from '../services/api';
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
          setUser(buildUserFromSession(initialSession));
        }
      } catch (err) {
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // 2. Continuous Listener for Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      setSession(currentSession);
      setUser(buildUserFromSession(currentSession));
      setIsLoading(false);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Asynchronously synchronize session check with backend
        api.sessionCheck().catch(() => {});
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

    setSession(data.session);
    setUser(buildUserFromSession(data.session));
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
