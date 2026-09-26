import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<{ user: User; token: string | null; session: any; requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('alpha_coach_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      localStorage.removeItem('alpha_coach_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('alpha_coach_token', session.access_token);
          setToken(session.access_token);
          const meta = session.user.user_metadata || {};
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            first_name: meta.first_name || 'Trader',
            last_name: meta.last_name || 'Alpha',
            role: meta.role || 'trader',
            timezone: meta.timezone || 'UTC',
            currency: meta.currency || 'USD',
            subscription_tier: meta.subscription_tier || 'PRO',
            is_active: 1
          });
        } else {
          localStorage.removeItem('alpha_coach_token');
          setToken(null);
          setUser(null);
        }
      } catch {
        localStorage.removeItem('alpha_coach_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('alpha_coach_token', session.access_token);
        setToken(session.access_token);
        const meta = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          first_name: meta.first_name || 'Trader',
          last_name: meta.last_name || 'Alpha',
          role: meta.role || 'trader',
          timezone: meta.timezone || 'UTC',
          currency: meta.currency || 'USD',
          subscription_tier: meta.subscription_tier || 'PRO',
          is_active: 1
        });
      } else {
        localStorage.removeItem('alpha_coach_token');
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) {
      throw new Error(error.message || 'Invalid email or password.');
    }

    if (!data.user || !data.session) {
      throw new Error('Authentication failed: no active session established.');
    }

    const token = data.session.access_token;
    localStorage.setItem('alpha_coach_token', token);
    setToken(token);

    const meta = data.user.user_metadata || {};
    const userObj: User = {
      id: data.user.id,
      email: data.user.email || email.trim(),
      first_name: meta.first_name || 'Trader',
      last_name: meta.last_name || 'Alpha',
      role: meta.role || 'trader',
      timezone: meta.timezone || 'UTC',
      currency: meta.currency || 'USD',
      subscription_tier: meta.subscription_tier || 'PRO',
      is_active: 1
    };
    setUser(userObj);
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

    const meta = authData.user.user_metadata || {};
    const userObj: User = {
      id: authData.user.id,
      email: authData.user.email || data.email.trim(),
      first_name: meta.first_name || data.firstName,
      last_name: meta.last_name || data.lastName,
      role: meta.role || 'trader',
      timezone: meta.timezone || data.timezone || 'UTC',
      currency: meta.currency || data.currency || 'USD',
      subscription_tier: meta.subscription_tier || 'PRO',
      is_active: 1
    };

    const session = authData.session;
    const token = session?.access_token || null;
    if (token) {
      localStorage.setItem('alpha_coach_token', token);
      setToken(token);
      setUser(userObj);
    }

    return {
      user: userObj,
      token,
      session,
      requiresEmailConfirmation: !session
    };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('alpha_coach_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
