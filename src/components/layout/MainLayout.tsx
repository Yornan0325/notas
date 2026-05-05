// src/components/layout/MainLayout.tsx
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
  mode?: 'dashboard' | 'editor' | string;
}

export const MainLayout = ({ children, mode = 'dashboard' }: MainLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950">
      <Sidebar mode={mode} /> 

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
