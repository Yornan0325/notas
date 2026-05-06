import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, FilePlus2, FileText, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useCodaStore } from '../store/useCodaStore';
import { getDocumentRoots } from '../lib/documents';
import { groupDocsByProject, UNASSIGNED_PROJECT } from '../lib/projects';
import { FilterBar } from '../components/dashboard/FilterBar';
import { ModuleGrid } from '../components/dashboard/ModuleGrid';
import { ProjectSelect } from '../components/dashboard/ProjectSelect';
import { CreateDocModal } from '../components/dashboard/CreateDocModal';
import { MainLayout } from '../components/layout/MainLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const DashboardView = () => {
  const {
    pages,
    shares,
    addPage,
    addProjectFolder,
    projectFolders,
    removeProjectFolder,
    renameProjectFolder,
    updatePageProject,
  } = useCodaStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('recientes');
  const [newFolderName, setNewFolderName] = useState('');
  const [targetFolderName, setTargetFolderName] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string | null>(null);
  const [folderDraft, setFolderDraft] = useState('');
  const navigate = useNavigate();

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

  const filteredDocs = useMemo(() => {
    let nextDocs = docs
      .filter((page) =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (activeFilter === 'favoritos') {
      nextDocs = nextDocs.filter((page) => page.isFavorite);
    } else if (activeFilter === 'compartidos') {
      nextDocs = nextDocs.filter((page) => shares.some((share) => share.docId === page.docId));
    }

    return nextDocs;
  }, [activeFilter, docs, searchQuery, shares]);

  const folderGroups = useMemo(
    () => groupDocsByProject(filteredDocs, activeFilter === 'recientes' && !searchQuery ? projectFolders : []),
    [activeFilter, filteredDocs, projectFolders, searchQuery]
  );

  const handleCreateDoc = (title: string) => {
    const newDocId = crypto.randomUUID();
    const rootPageId = addPage(newDocId, null, title, { isDocumentRoot: true });
    addPage(newDocId, null, 'Inicio');
    if (targetFolderName) updatePageProject(rootPageId, targetFolderName);
    setTargetFolderName(null);
    navigate(`/doc/${newDocId}`);
  };

  const handleCreateFolder = () => {
    addProjectFolder(newFolderName);
    setNewFolderName('');
  };

  const openCreateDocInFolder = (folderName: string) => {
    setTargetFolderName(folderName);
    setIsModalOpen(true);
  };

  const startRenameFolder = (folderName: string) => {
    setEditingFolderName(folderName);
    setFolderDraft(folderName);
  };

  const submitRenameFolder = () => {
    if (!editingFolderName) return;
    renameProjectFolder(editingFolderName, folderDraft);
    setEditingFolderName(null);
    setFolderDraft('');
  };

  const deleteFolder = (folderName: string) => {
    if (!confirm(`Quitar la carpeta "${folderName}"? Los documentos quedaran en Sin carpeta.`)) return;
    removeProjectFolder(folderName);
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

          <Button
            size="lg"
            icon={<Plus size={18} />}
            onClick={() => {
              setTargetFolderName(null);
              setIsModalOpen(true);
            }}
          >
            Nuevo documento
          </Button>
        </div>

        <div className="mb-5 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Folder size={17} className="shrink-0 text-slate-500" />
            <Input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreateFolder();
              }}
              placeholder="Crear carpeta para guardar documentos..."
              className="border-transparent shadow-none focus:ring-0"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={15} />}
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
          >
            Nueva carpeta
          </Button>
        </div>

        <FilterBar
          onSearch={(val) => setSearchQuery(val)}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {folderGroups.length > 0 ? (
          <div className="space-y-8">
            {folderGroups.map((group) => (
              <section key={group.name}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    {group.name === UNASSIGNED_PROJECT ? <FolderOpen size={18} /> : <Folder size={18} />}
                  </div>
                  <div className="min-w-0">
                    {editingFolderName === group.name ? (
                      <Input
                        autoFocus
                        value={folderDraft}
                        onChange={(event) => setFolderDraft(event.target.value)}
                        onBlur={submitRenameFolder}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') submitRenameFolder();
                          if (event.key === 'Escape') {
                            setEditingFolderName(null);
                            setFolderDraft('');
                          }
                        }}
                        className="h-8 max-w-64"
                      />
                    ) : (
                      <h2 className="truncate text-base font-semibold text-slate-950">{group.name}</h2>
                    )}
                    <p className="text-xs text-slate-500">
                      {group.docs.length} {group.docs.length === 1 ? 'documento' : 'documentos'}
                    </p>
                  </div>
                  {group.name !== UNASSIGNED_PROJECT && (
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openCreateDocInFolder(group.name)}
                        aria-label="Crear documento en carpeta"
                        title="Crear documento en esta carpeta"
                      >
                        <FilePlus2 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startRenameFolder(group.name)}
                        aria-label="Renombrar carpeta"
                        title="Renombrar carpeta"
                      >
                        <Edit3 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => deleteFolder(group.name)}
                        aria-label="Quitar carpeta"
                        title="Quitar carpeta"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  )}
                </div>

                {group.docs.length > 0 ? (
                  group.name === UNASSIGNED_PROJECT ? (
                    <Card className="divide-y divide-slate-100">
                      {group.docs.map((doc) => (
                        <div key={doc.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/doc/${doc.docId}`)}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-base">
                              {doc.icon || '📄'}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-950">{doc.title}</p>
                              <p className="text-xs text-slate-500">Elige una carpeta para guardarlo</p>
                            </div>
                          </button>
                          <ProjectSelect doc={doc} docs={docs} />
                        </div>
                      ))}
                    </Card>
                  ) : (
                    <ModuleGrid docs={group.docs} />
                  )
                ) : (
                  <Card className="border-dashed px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-950">Carpeta vacia</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Crea un documento aqui o mueve documentos desde Sin carpeta.
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      icon={<FilePlus2 size={15} />}
                      onClick={() => openCreateDocInFolder(group.name)}
                    >
                      Nuevo documento
                    </Button>
                  </Card>
                )}
              </section>
            ))}
          </div>
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
          onClose={() => {
            setIsModalOpen(false);
            setTargetFolderName(null);
          }}
          onCreate={handleCreateDoc}
          title={targetFolderName ? `Nuevo documento en ${targetFolderName}` : undefined}
        />
      </div>
    </MainLayout>
  );
};
