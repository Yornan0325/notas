import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Moon, PanelLeftClose, PanelLeftOpen, Share2, Sun } from 'lucide-react';
import { useCodaStore } from '../../store/useCodaStore';
import { getDocumentRoot } from '../../lib/documents';
import { Button } from '../ui/Button';
import { Separator } from '../ui/Separator';
import { ShareDialog } from '../sharing/ShareDialog';
import { Canvas } from '../editor/Canvas';
import { PageSidebar } from './PageSidebar';
import { useSyncContext } from '../../context/SyncContext';
import { useTheme } from '../../hooks/useTheme';

const EditorPage = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const { pages, addPage } = useCodaStore();
  const { loading, user } = useSyncContext();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<'workspace' | 'page' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );
  const initializedDocIdRef = useRef<string | null>(null);
  const requestedPageId = searchParams.get('page');

  const docPages = useMemo(
    () => pages.filter((page) => page.docId === docId),
    [docId, pages]
  );

  const rootPage = useMemo(
    () => getDocumentRoot(pages, docId),
    [docId, pages]
  );

  const internalPages = useMemo(
    () => docPages.filter((page) => page.id !== rootPage?.id),
    [docPages, rootPage]
  );

  const visibleActivePageId = useMemo(() => {
    const activePageBelongsToDoc = internalPages.some((page) => page.id === activePageId);
    if (activePageBelongsToDoc) return activePageId;

    const requestedPage = internalPages.find((page) => page.id === requestedPageId);
    return requestedPage?.id || internalPages[0]?.id || null;
  }, [activePageId, internalPages, requestedPageId]);

  const currentPage = pages.find((page) => page.id === visibleActivePageId);
  const currentSubpages = useMemo(
    () =>
      pages
        .filter((page) => page.parentId === visibleActivePageId)
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')),
    [pages, visibleActivePageId]
  );
  const displayedRootPage = rootPage || currentPage;
  const isSharedFromAnotherWorkspace = Boolean(
    currentPage?.ownerWorkspaceId && currentPage.ownerWorkspaceId !== user?.email
  );
  const isSharedReadOnly = isSharedFromAnotherWorkspace && currentPage?.sharePermission !== 'edit';

  useEffect(() => {
    if (!docId || initializedDocIdRef.current === docId) return;
    if (internalPages.length > 0) {
      initializedDocIdRef.current = docId;
      return;
    }
    if (loading) return;

    initializedDocIdRef.current = docId;

    if (docPages.length === 0) {
      // Documento completamente nuevo
      addPage(docId, null, 'Documento nuevo', { isDocumentRoot: true });
      addPage(docId, null, 'Documento nuevo');
    } else if (rootPage && internalPages.length === 0) {
      // Solo existe la raíz, crear primera página de contenido
      addPage(docId, null, 'Documento nuevo');
    }
  }, [loading, docId, docPages.length, internalPages.length, rootPage, addPage]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950">
      <PageSidebar
        docId={docId || ''}
        activePageId={visibleActivePageId}
        onSelectPage={(id) => setActivePageId(id)}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarCollapsed(true)}
        readOnly={isSharedReadOnly}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
          {isSidebarCollapsed ? (
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
              aria-label="Volver al workspace"
            >
              <ArrowLeft size={16} className="shrink-0" />
              <span className="leading-none">Puesto de trabajo</span>
            </Link>
          ) : (
            <Separator className="h-6 w-px" />
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </Button>

          <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {!isSharedReadOnly && (
            <Button
              variant="outline"
              size="sm"
              icon={<Share2 size={15} />}
              onClick={() => setShareTarget('page')}
              disabled={!currentPage}
            >
              Pagina
            </Button>
          )}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-white">
          {visibleActivePageId ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Canvas
                docId={docId || ''}
                pageId={visibleActivePageId}
                pageTitle={currentPage?.title || ''}
                subpages={currentSubpages}
                onSelectPage={setActivePageId}
                readOnly={isSharedReadOnly}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={28} className="animate-spin text-slate-400" />
            </div>
          )}
        </main>
      </section>

      {displayedRootPage && (
        <ShareDialog
          open={shareTarget === 'workspace'}
          onOpenChange={(open) => setShareTarget(open ? 'workspace' : null)}
          targetType="workspace"
          targetId={docId || displayedRootPage.docId}
          docId={docId || displayedRootPage.docId}
          title={displayedRootPage.title}
        />
      )}

      {currentPage && (
        <ShareDialog
          open={shareTarget === 'page'}
          onOpenChange={(open) => setShareTarget(open ? 'page' : null)}
          targetType="page"
          targetId={currentPage.id}
          docId={currentPage.docId}
          title={currentPage.title}
        />
      )}
    </div>
  );
};

export default EditorPage;
