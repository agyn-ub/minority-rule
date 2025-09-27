'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import fcl, { initializeFCL } from '@/lib/flow/config';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  logIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logIn: async () => {},
  logOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeFCL();

    const unsubscribe = fcl.currentUser.subscribe(setUser);
    setIsLoading(false);

    return () => unsubscribe();
  }, []);

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
    <AuthContext.Provider value={{ user, isLoading, logIn, logOut }}>
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