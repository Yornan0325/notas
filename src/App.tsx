// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardView } from './views/DashboardView';
import { useSync } from './hooks/useSync';
import { Toaster } from 'react-hot-toast'; // Opcional: para notificaciones de guardado
import EditorPage from './components/EditorPage/EditorPage';

function App() {
  // Activamos el hook de sincronización global con Google Sheets
  useSync();

  return (
    <Router>
      {/* Notificaciones flotantes para feedback visual de carga/error */}
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <Routes>
        {/* 1. Ruta del Dashboard: Lista de todos los módulos/docs */}
        <Route path="/" element={<DashboardView />} />

        {/* 2. Ruta del Editor: El lienzo con Sidebar de páginas interna */}
        <Route path="/doc/:docId" element={<EditorPage />} />

        {/* 3. Redirección por defecto si la ruta no existe */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;