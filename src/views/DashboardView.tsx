import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { useCodaStore } from '../store/useCodaStore';
import { getDocumentRoots } from '../lib/documents';
import { FilterBar } from '../components/dashboard/FilterBar';
import { ModuleGrid } from '../components/dashboard/ModuleGrid';
import { CreateDocModal } from '../components/dashboard/CreateDocModal';
import { MainLayout } from '../components/layout/MainLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const DashboardView = () => {
  const { pages, shares, addPage } = useCodaStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('recientes');
  const navigate = useNavigate();

  const filteredDocs = useMemo(() => {
    let docs = getDocumentRoots(pages)
      .filter((page) => !page.ownerWorkspaceId) // Solo documentos propios, no compartidos
      .filter((page) =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (activeFilter === 'favoritos') {
      docs = docs.filter((page) => page.isFavorite);
    } else if (activeFilter === 'compartidos') {
      docs = docs.filter((page) => shares.some((share) => share.docId === page.docId));
    }

    // "recientes" es el sort por defecto
    docs.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

    return docs;
  }, [pages, shares, searchQuery, activeFilter]);

  const handleCreateDoc = (title: string) => {
    const newDocId = crypto.randomUUID();
    addPage(newDocId, null, title, { isDocumentRoot: true });
    addPage(newDocId, null, 'Inicio');
    navigate(`/doc/${newDocId}`);
  };

  return (
    <MainLayout mode="dashboard">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">
              Espacio de trabajo
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Mis documentos
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Organiza paginas, texto e imagenes en una estructura tipo Coda.
            </p>
          </div>

          <Button size="lg" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
            Nuevo documento
          </Button>
        </div>

        <FilterBar
          onSearch={(val) => setSearchQuery(val)}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {filteredDocs.length > 0 ? (
          <ModuleGrid docs={filteredDocs} />
        ) : (
          <Card className="flex flex-col items-center justify-center border-dashed px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <FileText size={24} />
            </div>
            <p className="font-medium text-slate-950">No se encontraron documentos</p>
            <p className="mt-1 text-sm text-slate-500">Crea uno nuevo para empezar a trabajar.</p>
            <Button className="mt-5" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
              Crear documento
            </Button>
          </Card>
        )}

        <CreateDocModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateDoc}
        />
      </div>
    </MainLayout>
  );
};
