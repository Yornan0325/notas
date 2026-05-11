import { useEffect, useRef, useState } from 'react';
import { LogOut, Mail, UserCircle, Home, UserPlus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { getFirebaseAuth, isFirebaseConfigured } from '../../api/firebase';
import { useSyncContext } from '../../context/SyncContext';
import { cn } from '../../lib/utils';
import { DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';
import { Separator } from '../ui/Separator';
import { WorkspaceNav } from './WorkspaceNav';

export const Sidebar = ({
  mode,
  isMobileOpen = false,
  onMobileClose,
}: {
  mode: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSyncContext();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountLabel = user?.email || 'Usuario local';

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/' },
    // { icon: Bell, label: 'Notificaciones', path: '/notifications' },
    { icon: UserPlus, label: 'Compartidos', path: '/shares' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountMenuOpen]);

  const handleLogout = async () => {
    try {
      if (isFirebaseConfigured) {
        await signOut(getFirebaseAuth());
      }

      setIsAccountMenuOpen(false);
      toast.success('Sesion cerrada');
      navigate('/login');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cerrar la sesion');
    }
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-slate-200 px-3">
        <WorkspaceNav />
      </div>

      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={onMobileClose}
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

      <div className="mt-auto p-3">
        <Separator className="mb-3" />
        <div ref={accountMenuRef} className="relative">
          {isAccountMenuOpen && (
            <div className="absolute bottom-11 left-0 right-0 z-50">
              <DropdownMenuContent className="w-full">
                <div className="border-b border-slate-100 px-2 py-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Mail size={13} />
                    Cuenta
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-slate-950">{accountLabel}</p>
                </div>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                  <LogOut size={15} />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((open) => !open)}
            className={cn(
              'flex h-10 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-950',
              isAccountMenuOpen ? 'bg-slate-100 text-slate-950' : 'text-slate-600'
            )}
          >
            <UserCircle size={17} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{accountLabel}</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
          aria-label="Cerrar menu"
          onClick={onMobileClose}
        />
      )}

      <aside
        data-mode={mode}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white text-slate-700 shadow-xl transition-transform duration-200 md:static md:z-auto md:w-64 md:translate-x-0 md:shadow-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
