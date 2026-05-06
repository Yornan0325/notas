import { Home, Settings, UserPlus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/Separator';
import { WorkspaceNav } from './WorkspaceNav';

export const Sidebar = ({ mode }: { mode: string }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/' },
    // { icon: Bell, label: 'Notificaciones', path: '/notifications' },
    { icon: UserPlus, label: 'Compartidos', path: '/shares' },
  ];

  return (
    <aside
      data-mode={mode}
      className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-3 text-slate-700 md:flex"
    >
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
