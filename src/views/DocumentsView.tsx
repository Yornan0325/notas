import { useMemo, useState } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FilterBar } from '../components/dashboard/FilterBar';
import { ProjectSelect } from '../components/dashboard/ProjectSelect';
import { MainLayout } from '../components/layout/MainLayout';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { getDocumentRoots } from '../lib/documents';
import { getProjectNames } from '../lib/projects';
import { useCodaStore } from '../store/useCodaStore';

export const DocumentsView = () => {
  const { pages, projectFolders } = useCodaStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const docs = useMemo(
    () =>
      getDocumentRoots(pages)
        .filter((page) => !page.ownerWorkspaceId)
        .sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        }),
    [pages]
  );
  const projectNames = useMemo(() => getProjectNames(docs, projectFolders), [docs, projectFolders]);
  const filteredDocs = useMemo(
    () =>
      docs.filter((doc) => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProject = !projectFilter || doc.projectName === projectFilter;
        return matchesSearch && matchesProject;
      }),
    [docs, projectFilter, searchQuery]
  );

  return (
    <MainLayout mode="dashboard">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3">
            Biblioteca
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Todos los documentos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Inventario plano para buscar, abrir y mover documentos entre carpetas.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <FilterBar onSearch={setSearchQuery} showFilters={false} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <FolderOpen size={16} />
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
            >
              <option value="">Todas las carpetas</option>
              {projectNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Card className="overflow-hidden">
          {filteredDocs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <Link to={`/doc/${doc.docId}`} className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-base">
                      {doc.icon || '📄'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-950">{doc.title}</p>
                      <p className="text-xs text-slate-500">
                        {doc.projectName || 'Sin carpeta'} · {doc.updatedAt ? 'Editado recientemente' : 'Sin fecha'}
                      </p>
                    </div>
                  </Link>
                  <ProjectSelect doc={doc} docs={docs} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <FileText size={24} className="mb-3 text-slate-400" />
              <p className="font-medium text-slate-950">No hay documentos para este filtro</p>
              <p className="mt-1 text-sm text-slate-500">Cambia la busqueda o la carpeta seleccionada.</p>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};
