// src/components/layout/TopBar.tsx
import { Search, Plus, CloudCheck, CloudOff } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const TopBar = () => {
  const isOnline = navigator.onLine;
  const location = useLocation();
  const isDocView = location.pathname.includes('/doc/');

  return (
    <header className="h-16 border-b border-gray-100 flex items-center px-8 gap-6 bg-white shrink-0 sticky top-0 z-40">
      {/* Barra de búsqueda estilo Coda */}
      {!isDocView && (
        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="search" 
            placeholder="Search all docs..." 
            className="w-full bg-gray-100 border border-gray-100 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-200 transition-all"
          />
        </div>
      )}

      {/* Status y Acciones */}
      <div className="flex items-center gap-4 ml-auto">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          isOnline ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {isOnline ? (
            <><CloudCheck size={14} /> Synced</>
          ) : (
            <><CloudOff size={14} /> Offline</>
          )}
        </div>
        
        <button className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all active:scale-95">
            <Plus size={18} className="text-blue-600" />
            Create
        </button>
      </div>
    </header>
  );
};