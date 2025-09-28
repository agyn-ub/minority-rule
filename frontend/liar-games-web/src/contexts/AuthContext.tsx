'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import fcl, { initializeFCL } from '@/lib/flow/config';
import type { CurrentUser } from '@onflow/typedefs';
import * as types from '@onflow/types';

// Type for FCL args function
type ArgsFn = (arg: typeof fcl.arg, t: typeof types) => unknown[];

interface AuthContextType {
  user: CurrentUser | null;
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
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
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
        args: ((arg, t) => [arg(user.addr ?? '', t.Address)]) as ArgsFn,
      });

      // Format balance to 2 decimal places
      const formattedBalance = parseFloat(result).toFixed(2);
      setBalance(formattedBalance);
    } catch (error) {
      // Only log error in development to avoid console spam
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching balance:', error);
      }
      // Don't reset balance on error - keep the last known value
      // Only set to 0 if we don't have a balance yet
      if (balance === null) {
        setBalance('0.00');
      }
    }
  }, [user, balance]);

  useEffect(() => {
    initializeFCL();

    const unsubscribe = fcl.currentUser.subscribe((currentUser) => {
      setUser(currentUser);
      // Don't fetch balance here - let the other useEffect handle it
      if (!currentUser?.addr) {
        setBalance(null);
      }
    });
    setIsLoading(false);

    return () => unsubscribe();
  }, []);

  // Fetch balance when user changes
  useEffect(() => {
    if (user?.addr) {
      // Initial fetch
      fetchBalance();

      // Set up periodic balance refresh every 30 seconds (instead of 10)
      // to reduce API calls
      const interval = setInterval(() => {
        fetchBalance();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.addr, fetchBalance]);

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