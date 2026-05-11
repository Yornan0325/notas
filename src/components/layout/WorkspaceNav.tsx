import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { getFirebaseAuth, getFirestoreDB, isFirebaseConfigured } from '../../api/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const WorkspaceNav = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dbName, setDbName] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDB();
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser?.email) {
          try {
            const userDoc = await getDoc(doc(db, 'usuarios', currentUser.email));
            if (userDoc.exists()) {
              setDbName(userDoc.data().name);
            }
          } catch (err) {
            console.error('Error obteniendo documento de usuario', err);
          }
        } else {
          setDbName(null);
        }
      });
      return () => unsubscribe();
    } catch (error) {
      console.warn('Error inicializando auth', error);
    }
  }, []);

  // Usa el nombre de la BD, el displayName, el correo, o 'Usuario' por defecto
  const displayName = dbName || user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  const firstName = displayName.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <Button
      variant="ghost"
      className="h-10 w-full justify-start gap-3 px-2 text-left"
      type="button"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-semibold text-white">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-950">{firstName}</p>
        <p className="truncate text-xs font-normal text-slate-500">Espacio de trabajo</p>
      </div>
      <ChevronDown size={16} className="text-slate-400" />
    </Button>
  );
};
