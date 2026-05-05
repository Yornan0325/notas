import { Bell, FileText, Folder, Home, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/Separator';
import { WorkspaceNav } from './WorkspaceNav';

export const Sidebar = ({ mode }: { mode: string }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: Bell, label: 'Notificaciones', path: '/notifications' },
  ];

  return (
    <aside
      data-mode={mode}
      className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-3 text-slate-700 md:flex"
    >
      <div className="mb-3 flex items-center gap-2 px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
          C
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Notas</p>
          <p className="text-xs text-slate-500">Coda workspace</p>
        </div>
      </div>

      <WorkspaceNav />
      <Separator className="my-3" />

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                'flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-950',
                isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        <p className="mb-2 px-2 text-xs font-medium text-slate-500">Biblioteca</p>
        <div className="space-y-1">
          <button className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950">
            <Folder size={16} />
            Proyectos
          </button>
          <button className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950">
            <FileText size={16} />
            Documentos
          </button>
        </div>
      </div>

      <div className="mt-auto">
        <Separator className="mb-3" />
        <button className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950">
          <Settings size={16} />
          Configuracion
        </button>
      </div>
    </aside>
  );
};
