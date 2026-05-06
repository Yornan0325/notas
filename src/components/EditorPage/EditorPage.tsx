import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, PanelLeftClose, PanelLeftOpen, Share2 } from 'lucide-react';
import { useCodaStore } from '../../store/useCodaStore';
import { getDocumentRoot } from '../../lib/documents';
import { Button } from '../ui/Button';
import { Separator } from '../ui/Separator';
import { ShareDialog } from '../sharing/ShareDialog';
import { Canvas } from '../editor/Canvas';
import { PageSidebar } from './PageSidebar';
import { useSyncContext } from '../../context/SyncContext';

const EditorPage = () => {
  const { docId } = useParams();
  const { pages, addPage } = useCodaStore();
  const { loading } = useSyncContext();
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<'workspace' | 'page' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [initialized, setInitialized] = useState(false);

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
    return activePageBelongsToDoc ? activePageId : internalPages[0]?.id || null;
  }, [activePageId, internalPages]);

  const currentPage = pages.find((page) => page.id === visibleActivePageId);
  const displayedRootPage = rootPage || currentPage;

  useEffect(() => {
    if (!docId || initialized) return;
    if (internalPages.length > 0) {
      setInitialized(true);
      return;
    }
    if (loading) return;

    setInitialized(true);

    if (docPages.length === 0) {
      // Documento completamente nuevo
      addPage(docId, null, 'Documento nuevo', { isDocumentRoot: true });
      const firstPageId = addPage(docId, null, 'Documento nuevo');
      setActivePageId(firstPageId);
    } else if (rootPage && internalPages.length === 0) {
      // Solo existe la raíz, crear primera página de contenido
      const firstPageId = addPage(docId, null, 'Documento nuevo');
      setActivePageId(firstPageId);
    }
  }, [loading, docId, initialized, docPages.length, internalPages.length, rootPage, addPage]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950">
      <PageSidebar
        docId={docId || ''}
        activePageId={visibleActivePageId}
        onSelectPage={(id) => setActivePageId(id)}
        isCollapsed={isSidebarCollapsed}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
          <Separator className="h-6 w-px" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </Button>

          <Button
            variant="outline"
            className='absolute right-4'
            size="sm"
            icon={<Share2 size={15} />}
            onClick={() => setShareTarget('page')}
            disabled={!currentPage}
          >
            Pagina
          </Button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-white">
          {visibleActivePageId ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Canvas
                docId={docId || ''}
                pageId={visibleActivePageId}
                pageTitle={currentPage?.title || ''}
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
