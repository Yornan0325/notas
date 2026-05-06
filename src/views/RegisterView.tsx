import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFirebaseAuth, getFirestoreDB, isFirebaseConfigured } from '../api/firebase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const RegisterView = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured) {
      toast.error('Firebase no esta configurado.');
      return;
    }

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      toast.error('Completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      toast.error('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contrasenas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const db = getFirestoreDB();
      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      await updateProfile(credential.user, { displayName: trimmedName });
      await setDoc(
        doc(db, 'usuarios', trimmedEmail),
        {
          name: trimmedName,
          email: trimmedEmail,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      toast.success('Cuenta creada correctamente');
      navigate('/');
    } catch (error: unknown) {
      console.error(error);
      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === 'auth/email-already-in-use') {
        toast.error('Ese correo ya esta registrado.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        toast.error('El formato del correo es invalido.');
      } else if (firebaseError.code === 'auth/weak-password') {
        toast.error('La contrasena es muy debil.');
      } else {
        toast.error('No se pudo crear la cuenta: ' + (firebaseError.message || 'Revisa tu conexion'));
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Crear cuenta</h1>
          <p className="mt-2 text-sm text-slate-500">
            Registra tu espacio para sincronizar documentos.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Nombre
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              icon={<User size={16} />}
              required
            />
          </div>

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
              type="password"
              placeholder="........"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={<Lock size={16} />}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="confirm-password">
              Confirmar contrasena
            </label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="........"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              icon={<Lock size={16} />}
              required
            />
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-slate-950 hover:underline">
            Iniciar sesion
          </Link>
        </p>
      </Card>
    </div>
  );
};
