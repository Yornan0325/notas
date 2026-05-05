import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Share2 } from 'lucide-react';
import { useCodaStore } from '../../store/useCodaStore';
import { getDocumentRoot } from '../../lib/documents';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Separator } from '../ui/Separator';
import { ShareDialog } from '../sharing/ShareDialog';
import { Canvas } from '../editor/Canvas';
import { PageSidebar } from './PageSidebar';

const EditorPage = () => {
  const { docId } = useParams();
  const { pages, addPage } = useCodaStore();
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<'workspace' | 'page' | null>(null);

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

  const createPage = () => {
    setActivePageId(addPage(docId || ''));
  };

  useEffect(() => {
    if (!docId || internalPages.length > 0 || docPages.length === 0) return;

    setActivePageId(addPage(docId, null, 'Nueva pagina'));
  }, [addPage, docId, docPages.length, internalPages.length]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950">
      <PageSidebar
        docId={docId || ''}
        activePageId={visibleActivePageId}
        onSelectPage={(id) => setActivePageId(id)}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            aria-label="Volver al workspace"
          >
            <ArrowLeft size={17} />
          </Link>

          <Separator className="h-6 w-px" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base">{displayedRootPage?.icon || '📄'}</span>
              <p className="truncate text-sm font-medium text-slate-950">
                {displayedRootPage?.title || 'Documento'}
              </p>
              <Badge variant="secondary" className="hidden md:inline-flex">
                Local
              </Badge>
            </div>
            <p className="truncate text-xs text-slate-500">
              {currentPage ? `${currentPage.icon || '📝'} ${currentPage.title}` : 'Sin pagina seleccionada'}
            </p>
          </div>

          <Button variant="outline" size="sm" icon={<Plus size={15} />} onClick={createPage}>
            Pagina
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Share2 size={15} />}
            onClick={() => setShareTarget('page')}
            disabled={!currentPage}
          >
            Pagina
          </Button>
          <Button
            size="sm"
            icon={<Share2 size={15} />}
            onClick={() => setShareTarget('workspace')}
            disabled={!displayedRootPage}
          >
            Puesto
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
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                <FileText size={24} />
              </div>
              <p className="font-medium text-slate-950">Selecciona o crea una pagina</p>
              <p className="mt-1 text-sm text-slate-500">Empieza con una pagina dentro del documento.</p>
              <Button className="mt-5" icon={<Plus size={16} />} onClick={createPage}>
                Crear primera pagina
              </Button>
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
