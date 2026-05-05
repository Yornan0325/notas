// src/components/layout/WorkspaceNav.tsx
import { ChevronDown } from 'lucide-react';

export const WorkspaceNav = () => {
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 bg-gray-800/30 border border-gray-700/50 rounded-2xl cursor-pointer hover:bg-gray-800 transition-all active:scale-[0.98]">
      <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white italic shadow-lg shadow-blue-500/20">
        Y
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-200 truncate">Yornan's espacio de trabajo</p>
      </div>
      <ChevronDown size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
    </div>
  );
};