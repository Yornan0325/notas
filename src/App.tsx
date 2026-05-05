// src/App.tsx
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardView } from './views/DashboardView';
import { SharesView } from './views/SharesView';
import { LoginView } from './views/LoginView';
import { useSync } from './hooks/useSync';
import { Toaster } from 'react-hot-toast';
import EditorPage from './components/EditorPage/EditorPage';
import { getFirebaseAuth, isFirebaseConfigured } from './api/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Auth no inicializado', e);
      setLoading(false);
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
  // Activamos el hook de sincronización global
  useSync();

  return (
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
  );
}

export default App;