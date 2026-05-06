// src/App.tsx
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardView } from './views/DashboardView';
import { SharesView } from './views/SharesView';
import { LoginView } from './views/LoginView';
import { Toaster } from 'react-hot-toast';
import EditorPage from './components/EditorPage/EditorPage';
import { getFirebaseAuth, isFirebaseConfigured } from './api/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { SyncProvider } from './context/SyncContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Auth no inicializado', e);
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  // Si Firebase está configurado y no hay usuario, redirigir a login
  if (isFirebaseConfigured && !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <SyncProvider>
      <Router>
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <Routes>
        <Route path="/login" element={<LoginView />} />
        
        {/* Rutas Protegidas */}
        <Route path="/" element={<ProtectedRoute><DashboardView /></ProtectedRoute>} />
        <Route path="/shares" element={<ProtectedRoute><SharesView /></ProtectedRoute>} />
        <Route path="/doc/:docId" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </SyncProvider>
  );
}

export default App;
