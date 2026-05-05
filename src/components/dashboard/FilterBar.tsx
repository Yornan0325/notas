import { Search, Clock, Star, Share2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const FilterBar = ({ onSearch }: { onSearch: (val: string) => void }) => {
  const filters = [
    { id: 'recientes', label: 'Recientes', icon: Clock },
    { id: 'favoritos', label: 'Favoritos', icon: Star },
    { id: 'compartidos', label: 'Compartidos', icon: Share2 },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <Input icon={<Search size={18} />} 
        placeholder="Buscar documentos..." 
        onChange={(e) => onSearch(e.target.value)} 
        className="w-full border border-gray-800 text-gray-500 rounded-xl py-2 pl-10 pr-4 focus:border-blue-500 outline-none transition-all"
        />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
        {filters.map(f => (
          <Button 
            key={f.id}
            variant="secondary"
            className="flex items-center gap-2 px-4 py-3 border border-gray-800 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-500 hover:border-gray-00 transition-all whitespace-nowrap"
          >
            <f.icon size={14} />
            {f.label}
          </Button>
        ))}
      </div>
    </div>
  );
};