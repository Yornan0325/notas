import { FileText, Star, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Page } from '../type/typeScript';

export const DocRow = ({ doc }: { doc: Page }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(`/doc/${doc.id}`)}
      className="group flex items-center gap-4 p-3 hover:bg-gray-800/40 border-b border-gray-800/50 cursor-pointer transition-all"
    >
      <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
        <FileText size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{doc.title}</span>
          <Star size={12} className="text-gray-600 hover:text-yellow-500 transition-colors" />
        </div>
        <p className="text-xs text-gray-500 truncate">Last viewed by you today</p>
      </div>
      <MoreHorizontal size={18} className="text-gray-600 opacity-0 group-hover:opacity-100" />
    </div>
  );
};