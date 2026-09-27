import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, isSessionInvalid } from '../services/api';
import { TradingAccount } from '../types';
import { useAuth } from './AuthContext';

interface AccountContextType {
  accounts: TradingAccount[];
  selectedAccountId: string; // 'ALL' or specific account id
  selectedAccount: TradingAccount | null;
  isLoadingAccounts: boolean;
  setSelectedAccountId: (id: string) => void;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);

  const refreshAccounts = async () => {
    if (authLoading) return;
    if (!user) {
      setAccounts([]);
      return;
    }
    // If the session is known-dead, do not fire an authenticated request.
    // The session-recovery flow (login redirect) will reset the flag.
    if (isSessionInvalid()) {
      return;
    }
    try {
      setIsLoadingAccounts(true);
      const res = await api.getAccounts();
      if (res && Array.isArray(res.accounts)) {
        setAccounts(res.accounts);
      }
    } catch (err) {
      console.warn('Failed to load trading accounts (preserving previous state):', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      refreshAccounts();
    } else if (!authLoading && !user) {
      setAccounts([]);
    }
  }, [user, authLoading]);

  const selectedAccount = selectedAccountId === 'ALL'
    ? null
    : accounts.find(a => a.id === selectedAccountId) || null;

  return (
    <AccountContext.Provider
      value={{
        accounts,
        selectedAccountId,
        selectedAccount,
        isLoadingAccounts,
        setSelectedAccountId,
        refreshAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = () => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountProvider');
  return ctx;
};
