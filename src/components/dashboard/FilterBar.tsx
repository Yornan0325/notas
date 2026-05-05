import { Clock, Search, Share2, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const FilterBar = ({ onSearch }: { onSearch: (val: string) => void }) => {
  const filters = [
    { id: 'recientes', label: 'Recientes', icon: Clock },
    { id: 'favoritos', label: 'Favoritos', icon: Star },
    { id: 'compartidos', label: 'Compartidos', icon: Share2 },
  ];

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
      <div className="w-full md:max-w-md">
        <Input
          icon={<Search size={16} />}
          placeholder="Buscar documentos..."
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((filter) => (
          <Button key={filter.id} variant="outline" size="sm" icon={<filter.icon size={14} />}>
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
