import { useState } from 'react';
import { useCodaStore } from '../store/useCodaStore';
import { FilterBar } from '../components/dashboard/FilterBar';
import { ModuleGrid } from '../components/dashboard/ModuleGrid';
import { CreateDocModal } from '../components/dashboard/CreateDocModal';
import { MainLayout } from '../components/layout/MainLayout';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DashboardView = () => {
  const { pages, addPage } = useCodaStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtramos solo las páginas que son "Documentos Raíz" (docId === id de la página o similar)
  // En tu lógica actual, mostramos las páginas principales del workspace
  const rootDocuments = pages.filter(p => 
    p.parentId === null && 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDoc = (title: string) => {
    // Creamos un nuevo docId único para este documento
    const newDocId = crypto.randomUUID();
    addPage(newDocId, null, title); // Añadimos la página principal del nuevo doc
    // Aquí podrías añadir una lógica para navegar directamente al doc si quisieras
  };

  return (
    <MainLayout mode="dashboard">
      <div className="max-w-7xl mx-auto px-8 py-12">
        
        {/* Encabezado del Dashboard */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">
              ESPACIO DE TRABAJO
            </p>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Mis Documentos
            </h1>
          </div>
          
          <Button 
            variant="outline" 
            size="lg" 
            icon={<Plus size={20} />}
            onClick={() => setIsModalOpen(true)}
          >
            Nuevo Documento
          </Button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <FilterBar onSearch={(val) => setSearchQuery(val)} />

        {/* Rejilla de Módulos (Docs) */}
        {rootDocuments.length > 0 ? (
          <ModuleGrid docs={rootDocuments} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 mb-4">
              <Plus size={32} />
            </div>
            <p className="text-gray-500 font-medium">No se encontraron documentos</p>
            <p className="text-gray-400 text-sm">Crea uno nuevo para empezar a trabajar</p>
          </div>
        )}

        {/* Modal de Creación */}
        <CreateDocModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onCreate={handleCreateDoc} 
        />
      </div>
    </MainLayout>
  );
};