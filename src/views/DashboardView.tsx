import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { Edit3, FilePlus2, FileText, Folder, FolderOpen, Plus, Share2, Trash2, UserPlus } from 'lucide-react';
import { getFirestoreDB, isFirebaseConfigured } from '../api/firebase';
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
  const [sharedOwnerNames, setSharedOwnerNames] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const getUserDocId = (email?: string) => email?.trim().toLowerCase() || '';

  const allDocumentRoots = useMemo(() => getDocumentRoots(pages), [pages]);

  const docs = useMemo(
    () =>
      allDocumentRoots
        .filter((page) => !page.ownerWorkspaceId)
        .sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        }),
    [allDocumentRoots]
  );

  const sharedDocs = useMemo(
    () =>
      allDocumentRoots
        .filter((page) => page.ownerWorkspaceId)
        .filter((page) => page.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        }),
    [allDocumentRoots, searchQuery]
  );

  const filteredDocs = useMemo(() => {
    let nextDocs = docs
      .filter((page) =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (activeFilter === 'favoritos') {
      nextDocs = nextDocs.filter((page) => page.isFavorite);
    }

    return nextDocs;
  }, [activeFilter, docs, searchQuery]);

  useEffect(() => {
    if (!isFirebaseConfigured || sharedDocs.length === 0) return;

    const ownerIds = Array.from(
      new Set(sharedDocs.map((doc) => getUserDocId(doc.ownerWorkspaceId)).filter(Boolean))
    );
    const missingOwnerIds = ownerIds.filter((ownerId) => !sharedOwnerNames[ownerId]);

    if (missingOwnerIds.length === 0) return;

    let isMounted = true;
    const db = getFirestoreDB();

    Promise.all(
      missingOwnerIds.map(async (ownerId) => {
        try {
          const ownerSnapshot = await getDoc(firestoreDoc(db, 'usuarios', ownerId));
          const ownerData = ownerSnapshot.exists() ? ownerSnapshot.data() : null;
          return [ownerId, (ownerData?.name as string | undefined) || ownerId] as const;
        } catch (error) {
          console.warn('No se pudo cargar el usuario que comparte', ownerId, error);
          return [ownerId, ownerId] as const;
        }
      })
    ).then((entries) => {
      if (!isMounted) return;
      setSharedOwnerNames((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [sharedDocs, sharedOwnerNames]);

  const getSharedOwnerLabel = (ownerWorkspaceId?: string) => {
    const ownerId = getUserDocId(ownerWorkspaceId);
    if (!ownerId) return 'Compartido';
    return (sharedOwnerNames[ownerId] || ownerId).trim().split(/\s+/)[0];
  };

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
              Organiza paginas, texto e imagenes.
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

        <div className="mb-5 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#252525] sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Folder size={17} className="shrink-0 text-slate-500 dark:text-slate-400" />
            <Input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreateFolder();
              }}
              placeholder="Crear carpeta..."
              className="border-transparent shadow-none focus:ring-0 w-1/2"
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

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)] xl:items-start">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-[#252525]/90 dark:shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
                    <FileText size={16} />
                  </span>
                  <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Mis elementos</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Mi puesto de trabajo.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-[#343434] dark:text-slate-300">
                {filteredDocs.length} {filteredDocs.length === 1 ? 'documento' : 'documentos'}
              </span>
            </div>

        {folderGroups.length > 0 ? (
          <div className="space-y-8">
            {folderGroups.map((group) => (
              <section key={group.name}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-[#343434] dark:text-slate-300">
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
                      <h2 className="truncate text-base font-semibold text-slate-950 dark:text-slate-100">{group.name}</h2>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
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
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
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
                    <Card className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.docs.map((doc) => (
                        <div key={doc.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/doc/${doc.docId}`)}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-base dark:bg-[#343434]">
                              {doc.icon || '📄'}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">{doc.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Elige una carpeta para guardarlo</p>
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
                    <p className="text-sm font-medium text-slate-950 dark:text-slate-100">Carpeta vacia</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-[#343434] dark:text-slate-300">
              <FileText size={24} />
            </div>
            <p className="font-medium text-slate-950 dark:text-slate-100">No se encontraron documentos</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Crea uno nuevo para empezar a trabajar.</p>
            <Button className="mt-5" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
              Crear documento
            </Button>
          </Card>
        )}
          </section>

          <aside className="min-w-0 xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-slate-50 shadow-sm dark:border-slate-700 dark:bg-none dark:bg-[#252525] dark:shadow-black/25">
              <div className="border-b border-blue-100/80 p-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-200 dark:bg-blue-500 dark:shadow-black/20">
                        <Share2 size={16} />
                      </span>
                      <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Compartidos conmigo</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Te han compartido.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100 dark:bg-[#343434] dark:text-blue-300 dark:ring-slate-700">
                    {sharedDocs.length}
                  </span>
                </div>
              </div>

              {sharedDocs.length > 0 ? (
                <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-1">
                  {sharedDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => navigate(`/doc/${doc.docId}`)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/85 p-3 text-left shadow-sm transition-all hover:border-blue-200 hover:bg-white hover:shadow-md dark:bg-[#2b2b2b] dark:hover:border-blue-500/40 dark:hover:bg-[#303030] dark:hover:shadow-black/25"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-base text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        {doc.icon || '📄'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{doc.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                          {doc.sharePermission === 'edit' ? 'Puede editar' : 'Solo lectura'}
                        </span>
                      </span>
                      <span className="max-w-[8rem] shrink-0 truncate rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold tracking-wide text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 sm:max-w-[10rem]">
                        {getSharedOwnerLabel(doc.ownerWorkspaceId)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm ring-1 ring-blue-100 dark:bg-[#343434] dark:text-blue-300 dark:ring-slate-700">
                    <UserPlus size={24} />
                  </div>
                  <p className="font-medium text-slate-950 dark:text-slate-100">Sin compartidos visibles</p>
                  <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    Cuando alguien comparta un documento contigo, aparecerá aquí junto a tus elementos.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

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
