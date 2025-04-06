// Protect screen and proper redirect

import React, { createContext, useContext, ReactNode } from 'react';
import { useAppwrite } from '@/lib/useAppwrite';
import { getCurrentUser } from './appwrite';
import { Redirect } from 'expo-router';

interface User {
  $id: string;
  name: string;
  email: string;
  avatar: string;
}

interface GlobalContextType {
  loading: boolean;
  isLoggedIn: boolean;
  user: User | null;
  refetch: (newParams: Record<string, string | number>) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const {
    data: user,
    loading,
    refetch,
  } = useAppwrite({
    fn: getCurrentUser,
  });

  const isLoggedIn = !!user; // 

  // console.log(JSON.stringify(user, null, 2));

  // Return the context provider with the value
  // This will allow any child components to access the context value
  return (
    <GlobalContext.Provider value={{ isLoggedIn, user: user || null, loading, refetch }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
}

export default GlobalContext;