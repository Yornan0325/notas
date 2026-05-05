import { CloudCheck, CloudOff, Menu, Plus, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const TopBar = () => {
  const isOnline = navigator.onLine;
  const location = useLocation();
  const isDocView = location.pathname.includes('/doc/');

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
        <Menu size={18} />
      </Button>

      {!isDocView ? (
        <div className="w-full max-w-xl">
          <Input icon={<Search size={16} />} type="search" placeholder="Buscar en el workspace..." />
        </div>
      ) : (
        <div className="text-sm font-medium text-slate-500">Editor</div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Badge variant={isOnline ? 'success' : 'warning'} className="gap-1">
          {isOnline ? <CloudCheck size={13} /> : <CloudOff size={13} />}
          {isOnline ? 'Local listo' : 'Offline'}
        </Badge>
        <Button variant="outline" size="sm" icon={<Plus size={16} />}>
          Crear
        </Button>
      </div>
    </header>
  );
};
