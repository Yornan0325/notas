import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../api/firebase';
import { useSyncContext } from '../context/SyncContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const SettingsView = () => {
  const { user } = useSyncContext();
  const navigate = useNavigate();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  const email = user?.email || 'Modo local';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    if (!isFirebaseConfigured) {
      toast.success('Sesion local cerrada');
      navigate('/login');
      return;
    }

    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      toast.success('Sesion cerrada');
      navigate('/login');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cerrar la sesion');
    }
  };

  return (
    <MainLayout mode="dashboard">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3">
            Configuracion
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Perfil de usuario</h1>
          <p className="mt-2 text-sm text-slate-500">
            Revisa tu cuenta y administra la sesion activa.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-slate-950 text-lg font-semibold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-950">{displayName}</h2>
                <p className="mt-1 truncate text-sm text-slate-500">{email}</p>
                <Badge variant={isFirebaseConfigured ? 'success' : 'warning'} className="mt-3">
                  {isFirebaseConfigured ? 'Firebase activo' : 'Modo local'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-950">Sesion</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cierra la sesion para cambiar de usuario o proteger este workspace.
            </p>
            <Button
              className="mt-5 w-full"
              variant="destructive"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
            >
              Cerrar sesion
            </Button>
          </Card>
        </div>

        <Card className="mt-4 p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-950">Datos de cuenta</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
                <User size={14} />
                Nombre
              </div>
              <p className="truncate text-sm font-medium text-slate-950">{displayName}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
                <Mail size={14} />
                Correo
              </div>
              <p className="truncate text-sm font-medium text-slate-950">{email}</p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
