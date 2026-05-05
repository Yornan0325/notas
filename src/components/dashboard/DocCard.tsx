import { Edit2, MoreVertical, Share2, Star, StarOff, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useCodaStore } from '../../store/useCodaStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';
import { Input } from '../ui/Input';
import { ShareDialog } from '../sharing/ShareDialog';
import { PageIconPicker } from '../EditorPage/PageIconPicker';
import type { Page } from '../type/typeScript';

export const DocCard = ({ doc }: { doc: Page }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const { removeDocument, updatePageIcon, updatePageTitle, togglePageFavorite } = useCodaStore();

  const handleToggleFavorite = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePageFavorite(doc.id);
    toast.success(doc.isFavorite ? 'Quitado de favoritos' : 'Añadido a favoritos');
    setShowMenu(false);
  };

  const handleDelete = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm('Seguro que quieres eliminar este documento y todo su contenido?')) {
      removeDocument(doc.docId);
      toast.success('Documento eliminado');
      setShowMenu(false);
    }
  };

  const handleRename = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTitle(doc.title);
    setIsEditing(true);
    setShowMenu(false);
  };

  const submitRename = (e: FocusEvent | KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter') return;

    setIsEditing(false);
    if (title.trim() && title !== doc.title) {
      updatePageTitle(doc.id, title.trim());
      toast.success('Titulo actualizado');
    } else {
      setTitle(doc.title);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <Card className="relative transition-colors hover:border-slate-300 hover:shadow-md">
      <Link to={`/doc/${doc.docId}`} className="flex items-center gap-4 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <PageIconPicker value={doc.icon} onSelect={(icon) => updatePageIcon(doc.id, icon)} />
        </div>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={submitRename}
              onKeyDown={submitRename}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-slate-950">{doc.title}</h3>
              {doc.isFavorite && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Editado recientemente</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setShowMenu(!showMenu);
          }}
          aria-label="Opciones"
        >
          <MoreVertical size={16} />
        </Button>
      </Link>

      {showMenu && (
        <div ref={menuRef} className="absolute right-3 top-12 z-30">
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleToggleFavorite}>
              {doc.isFavorite ? (
                <>
                  <StarOff size={14} />
                  Quitar favorito
                </>
              ) : (
                <>
                  <Star size={14} />
                  Añadir favorito
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRename}>
              <Edit2 size={14} />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsShareOpen(true);
                setShowMenu(false);
              }}
            >
              <Share2 size={14} />
              Compartir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 hover:bg-red-50">
              <Trash size={14} />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      )}

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        targetType="workspace"
        targetId={doc.docId}
        docId={doc.docId}
        title={doc.title}
      />
    </Card>
  );
};
