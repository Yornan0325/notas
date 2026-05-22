import { useEffect, useRef, useState } from 'react';
import type {
  FocusEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  MoreHorizontal,
  Plus,
  PlusSquare,
  Share2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { getDocumentRoot } from '../../lib/documents';
import { useCodaStore } from '../../store/useCodaStore';
import { Button } from '../ui/Button';
import { DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';
import { Input } from '../ui/Input';
import { Separator } from '../ui/Separator';
import { ShareDialog } from '../sharing/ShareDialog';
import type { Page } from '../type/typeScript';
import { PageIconPicker } from './PageIconPicker';
import { Link } from 'react-router-dom';

const orderPages = (items: Page[], allPages: Page[]) =>
  items
    .map((page) => ({
      page,
      index: allPages.findIndex((item) => item.id === page.id),
    }))
    .sort((a, b) => {
      const orderA = a.page.pageOrder ?? a.index;
      const orderB = b.page.pageOrder ?? b.index;
      return orderA === orderB ? a.index - b.index : orderA - orderB;
    })
    .map((item) => item.page);

export const PageSidebar = ({
  docId,
  activePageId,
  onSelectPage,
  isCollapsed = false,
  onClose,
  readOnly = false,
}: {
  docId: string;
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  isCollapsed?: boolean;
  onClose?: () => void;
  readOnly?: boolean;
}) => {
  const { pages, blocks, addPage } = useCodaStore();
  const documentRoot = getDocumentRoot(pages, docId);
  const docPages = pages.filter((page) => page.docId === docId);
  const docPageIds = new Set(docPages.map((page) => page.id));
  const rootPages = orderPages(
    docPages.filter(
      (page) =>
        !page.isDocumentRoot &&
        page.id !== documentRoot?.id &&
        (!page.parentId || !docPageIds.has(page.parentId))
    ),
    pages
  );
  const favoriteCountByPage = blocks.reduce<Record<string, number>>((counts, block) => {
    if (block.isFavorite) counts[block.pageId] = (counts[block.pageId] || 0) + 1;
    return counts;
  }, {});

  const createPage = () => {
    if (readOnly) return;
    handleSelectPage(addPage(docId));
  };

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      onClose?.();
    }
  };

  const handleSelectPage = (id: string) => {
    onSelectPage(id);
    closeOnMobile();
  };

  if (isCollapsed) return null;

  return (
    <>
    <button
      type="button"
      className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
      aria-label="Cerrar paginas"
      onClick={onClose}
    />
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-[min(20rem,88vw)] shrink-0 flex-col border-r border-slate-200 bg-white shadow-xl md:static md:z-auto md:w-72 md:shadow-none">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <Link
          to="/"
          className="inline-flex h-9 min-w-0 items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          aria-label="Volver al workspace"
          onClick={closeOnMobile}
        >
          <ArrowLeft size={16} className="shrink-0" />
          <span className="truncate leading-none">Puesto de trabajo</span>
        </Link>

        {!readOnly && (
          <Button type="button" variant="outline" size="icon" onClick={createPage} aria-label="Nueva pagina">
            <Plus size={16} />
          </Button>
        )}
      </div>

      <div className="px-4 py-3">
        <div>
          <h2 className="max-w-56 truncate text-sm font-semibold text-slate-950">
            {documentRoot?.title || 'Documento'}
          </h2>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto p-2">
        {rootPages.length > 0 ? (
          <div className="space-y-1">
            {rootPages.map((page) => (
              <PageItem
                key={page.id}
                page={page}
                activePageId={activePageId}
                onSelectPage={handleSelectPage}
                favoriteCountByPage={favoriteCountByPage}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-slate-200 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-950">Sin páginas</p>
            <p className="mt-1 text-xs text-slate-500">
              Crea una página para empezar a organizar este puesto.
            </p>
            {!readOnly && (
              <Button className="mt-4" size="sm" icon={<Plus size={15} />} onClick={createPage}>
                Nueva página
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
    </>
  );
};

const PageItem = ({
  page,
  activePageId,
  onSelectPage,
  favoriteCountByPage,
  readOnly = false,
}: {
  page: Page;
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  favoriteCountByPage: Record<string, number>;
  readOnly?: boolean;
}) => {
  const {
    pages,
    addPage,
    duplicatePage,
    movePage,
    removePage,
    updatePageIcon,
    updatePageTitle,
  } = useCodaStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  const menuRef = useRef<HTMLDivElement>(null);

  const children = orderPages(pages.filter((item) => item.parentId === page.id), pages);
  const isActive = activePageId === page.id;
  const favoriteCount = favoriteCountByPage[page.id] || 0;

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const createSibling = (e: ReactMouseEvent) => {
    e.stopPropagation();
    onSelectPage(addPage(page.docId));
    setShowMenu(false);
  };

  const createChild = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    onSelectPage(addPage(page.docId, page.id));
    setShowMenu(false);
  };

  const handleDelete = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm('Seguro que quieres eliminar esta pagina y sus subpaginas?')) {
      removePage(page.id);
      toast.success('Pagina eliminada');
      setShowMenu(false);
    }
  };

  const handleDuplicate = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const duplicatedId = duplicatePage(page.id);

    if (duplicatedId) {
      onSelectPage(duplicatedId);
      toast.success('Pagina duplicada');
    }

    setShowMenu(false);
  };

  const handleRename = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTitle(page.title);
    setIsEditing(true);
    setShowMenu(false);
  };

  const moveCurrentPage = (direction: 'up' | 'down') => (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    movePage(page.id, direction);
    setShowMenu(false);
  };

  const submitRename = (e: FocusEvent | KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter') return;

    setIsEditing(false);

    if (title.trim() && title !== page.title) {
      updatePageTitle(page.id, title.trim());
      toast.success('Titulo actualizado');
    } else {
      setTitle(page.title);
    }
  };

  return (
    <div className="relative flex flex-col">
      <div
        className={cn(
          'group flex min-h-9 cursor-pointer items-center gap-1 rounded-md px-1.5 text-sm transition-colors',
          isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
        )}
        onClick={() => onSelectPage(page.id)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-slate-700"
          title={isExpanded ? 'Contraer' : 'Expandir'}
        >
          {children.length > 0 ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>

        {readOnly ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center text-base">
            {page.icon || '📄'}
          </span>
        ) : (
          <PageIconPicker value={page.icon} onSelect={(icon) => updatePageIcon(page.id, icon)} />
        )}

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <Input
              autoFocus
              className="h-7 border-slate-300 bg-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={submitRename}
              onKeyDown={submitRename}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          ) : (
            <span className="flex min-w-0 items-center gap-2">
              <span className="block min-w-0 truncate font-medium">{page.title}</span>
              {favoriteCount > 0 && (
                <span
                  className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-bold leading-none text-amber-700 ring-1 ring-amber-200"
                  title={`${favoriteCount} puntos favoritos`}
                >
                  {favoriteCount}
                </span>
              )}
            </span>
          )}
        </div>

        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            aria-label="Opciones de pagina"
          >
            <MoreHorizontal size={15} />
          </Button>
        )}

        {showMenu && !readOnly && (
          <div ref={menuRef} className="absolute right-1 top-9 z-50" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuContent className="w-56">
              <MenuItem icon={<PlusSquare size={15} />} label="Agregar subpagina" onClick={createChild} />
              <MenuItem icon={<Plus size={15} />} label="Agregar pagina" onClick={createSibling} />
              <Separator className="my-1" />
              <MenuItem icon={<ArrowUp size={15} />} label="Subir elemento" onClick={moveCurrentPage('up')} />
              <MenuItem icon={<ArrowDown size={15} />} label="Bajar elemento" onClick={moveCurrentPage('down')} />
              <Separator className="my-1" />
              <MenuItem icon={<Edit3 size={15} />} label="Renombrar pagina" onClick={handleRename} />
              <MenuItem
                icon={<Share2 size={15} />}
                label="Compartir pagina"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsShareOpen(true);
                  setShowMenu(false);
                }}
              />
              <MenuItem icon={<Copy size={15} />} label="Duplicar pagina" onClick={handleDuplicate} />
              <Separator className="my-1" />
              <MenuItem icon={<Trash2 size={15} />} label="Eliminar pagina" onClick={handleDelete} danger />
            </DropdownMenuContent>
          </div>
        )}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="ml-4 border-l border-slate-200 pl-2">
          {children.map((child) => (
            <PageItem
              key={child.id}
              page={child}
              activePageId={activePageId}
              onSelectPage={onSelectPage}
              favoriteCountByPage={favoriteCountByPage}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        targetType="page"
        targetId={page.id}
        docId={page.docId}
        title={page.title}
      />
    </div>
  );
};

const MenuItem = ({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick?: (e: ReactMouseEvent) => void;
  danger?: boolean;
}) => (
  <DropdownMenuItem onClick={onClick} className={danger ? 'text-red-600 hover:bg-red-50' : undefined}>
    {icon}
    {label}
  </DropdownMenuItem>
);
