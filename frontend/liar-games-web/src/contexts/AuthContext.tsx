'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import fcl, { initializeFCL } from '@/lib/flow/config';

interface AuthContextType {
  user: any | null;
  balance: string | null;
  isLoading: boolean;
  logIn: () => Promise<void>;
  logOut: () => Promise<void>;
  fetchBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  balance: null,
  isLoading: true,
  logIn: async () => {},
  logOut: async () => {},
  fetchBalance: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = async () => {
    if (!user?.addr) {
      setBalance(null);
      return;
    }

    try {
      const result = await fcl.query({
        cadence: `
          import FungibleToken from 0xFungibleToken
          import FlowToken from 0xFlowToken

          access(all) fun main(address: Address): UFix64 {
              let account = getAccount(address)

              let vaultRef = account.capabilities.borrow<&{FungibleToken.Balance}>(
                  /public/flowTokenBalance
              ) ?? panic("Could not borrow Balance reference to the Vault")

              return vaultRef.balance
          }
        `,
        args: (arg: any, t: any) => [arg(user.addr, t.Address)],
      });

      // Format balance to 2 decimal places
      const formattedBalance = parseFloat(result).toFixed(2);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.00');
    }
  };

  useEffect(() => {
    initializeFCL();

    const unsubscribe = fcl.currentUser.subscribe((currentUser) => {
      setUser(currentUser);
      if (currentUser?.addr) {
        fetchBalance();
      } else {
        setBalance(null);
      }
    });
    setIsLoading(false);

    return () => unsubscribe();
  }, []);

  // Fetch balance when user changes
  useEffect(() => {
    if (user?.addr) {
      fetchBalance();

      // Set up periodic balance refresh every 10 seconds
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const logIn = async () => {
    try {
      setIsLoading(true);
      await fcl.authenticate();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async () => {
    try {
      setIsLoading(true);
      await fcl.unauthenticate();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, balance, isLoading, logIn, logOut, fetchBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};