// src/components/layout/MainLayout.tsx
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const MainLayout = ({ children, mode = 'dashboard' }) => {
  return (
    <div className="flex h-screen bg-[#1f1f1f] overflow-hidden">
      {/* Sidebar general de Coda */}
      <Sidebar mode={mode} /> 
      
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto bg-[#f9f9f9]">
          {children}
        </div>
      </div>
    </div>
  );
};