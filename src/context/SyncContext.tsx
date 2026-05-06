import React, { createContext, useContext } from 'react';
import { useSync } from '../hooks/useSync';
import type { User } from 'firebase/auth';

interface SyncContextType {
  loading: boolean;
  user: User | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const syncState = useSync();
  return (
    <SyncContext.Provider value={syncState}>
      {children}
    </SyncContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
