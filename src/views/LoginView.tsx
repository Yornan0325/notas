import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFirebaseAuth, isFirebaseConfigured } from '../api/firebase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    if (!isFirebaseConfigured) {
      toast.error('Firebase no esta configurado.');
      return;
    }

    if (!email || !password) {
      toast.error('Por favor, ingresa tu correo y contrasena.');
      return;
    }

    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      toast.success('Sesion iniciada correctamente');
      navigate('/');
    } catch (error: unknown) {
      console.error(error);
      const firebaseError = error as { code?: string; message?: string };
      const errorCode = firebaseError.code;

      if (
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password'
      ) {
        toast.error('Usuario no encontrado o contrasena incorrecta.');
      } else if (errorCode === 'auth/invalid-email') {
        toast.error('El formato del correo es invalido.');
      } else if (errorCode === 'auth/configuration-not-found') {
        toast.error('Firebase Auth no esta habilitado. Activa Authentication y Email/Password en Firebase Console.');
      } else {
        toast.error('Error al iniciar sesion: ' + (firebaseError.message || 'Revisa tu conexion'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950">
            <span className="text-xl font-bold text-white">N</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Bienvenido de nuevo</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa a tu cuenta para acceder a Notas
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Correo electronico
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              icon={<Mail size={16} />}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Contrasena
            </label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="........"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              required
            />
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-slate-950 hover:underline">
            Crear cuenta
          </Link>
        </p>
      </Card>
    </div>
  );
};
