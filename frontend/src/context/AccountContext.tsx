import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
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
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);

  const refreshAccounts = async () => {
    if (!user) {
      setAccounts([]);
      return;
    }
    try {
      setIsLoadingAccounts(true);
      const res = await api.getAccounts();
      setAccounts(res.accounts || []);
    } catch (err) {
      console.error('Failed to load trading accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    refreshAccounts();
  }, [user]);

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
