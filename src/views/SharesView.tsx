import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useCodaStore } from '../store/useCodaStore';
import { FilterBar } from '../components/dashboard/FilterBar';
import { ModuleGrid } from '../components/dashboard/ModuleGrid';
import { MainLayout } from '../components/layout/MainLayout';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { getFirebaseAuth, isFirebaseConfigured } from '../api/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { Page } from '../components/type/typeScript';

export const SharesView = () => {
  const { pages, shares } = useCodaStore();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    } catch (error) {
      console.warn('Error inicializando auth', error);
    }
  }, []);

  // Filter shares for this user (if user is null, we show all shares for demo purposes)
  const myShares = shares.filter((share) => 
    user?.email ? share.email === user.email : true
  );

  // Get the unique document roots for those shares
  const sharedDocs = myShares
    .map((share) => pages.find((p) => p.docId === share.docId && p.isDocumentRoot))
    .filter((doc): doc is Page => Boolean(doc))
    .filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Ensure uniqueness
  const uniqueSharedDocs = Array.from(new Map(sharedDocs.map(item => [item.id, item])).values());

  return (
    <MainLayout mode="dashboard">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">
              Compartido conmigo
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Invitaciones
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Documentos que otros usuarios han compartido contigo.
            </p>
          </div>
        </div>

        <FilterBar onSearch={(val) => setSearchQuery(val)} />

        {uniqueSharedDocs.length > 0 ? (
          <ModuleGrid docs={uniqueSharedDocs} />
        ) : (
          <Card className="flex flex-col items-center justify-center border-dashed px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <UserPlus size={24} />
            </div>
            <p className="font-medium text-slate-950">No hay documentos compartidos</p>
            <p className="mt-1 text-sm text-slate-500">Aún no tienes invitaciones a otros documentos.</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
