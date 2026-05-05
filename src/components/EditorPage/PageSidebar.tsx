import { useState, useRef, useEffect } from 'react';
import { 
  Plus, ChevronRight, ChevronDown, FileText, MoreVertical, Trash2, 
  Edit3, PlusSquare, Copy, ExternalLink, History, EyeOff, Bookmark, 
  Link as LinkIcon, Layers
} from 'lucide-react';
import { useCodaStore } from '../../store/useCodaStore';
import type { Page } from '../type/typeScript';
import toast from 'react-hot-toast';

export const PageSidebar = ({ docId, activePageId, onSelectPage }: { 
  docId: string, 
  activePageId: string | null, 
  onSelectPage: (id: string) => void 
}) => {
  const { pages, addPage } = useCodaStore();
  const rootPages = pages.filter(p => p.docId === docId && !p.parentId);

  return (
    <div className="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col shrink-0 overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-gray-800/50">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Páginas</span>
        <button 
          onClick={() => addPage(docId)} 
          className="hover:bg-gray-800 p-1 rounded text-gray-400 hover:text-white transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {rootPages.map(page => (
          <PageItem 
            key={page.id} 
            page={page} 
            activePageId={activePageId} 
            onSelectPage={onSelectPage} 
          />
        ))}
      </div>
    </div>
  );
};

const PageItem = ({ page, activePageId, onSelectPage }: { 
  page: Page, 
  activePageId: string | null, 
  onSelectPage: (id: string) => void 
}) => {
  const { pages, addPage, removePage, updatePageTitle } = useCodaStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const children = pages.filter(p => p.parentId === page.id);
  const isActive = activePageId === page.id;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar esta página?')) {
      removePage(page.id);
      toast.success('Página eliminada');
      setShowMenu(false);
    }
  };

  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setShowMenu(false);
  };

  const submitRename = (e: React.FocusEvent | React.KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    setIsEditing(false);
    if (title.trim() && title !== page.title) {
      updatePageTitle(page.id, title);
      toast.success('Título actualizado');
    } else {
      setTitle(page.title);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div className="flex flex-col">
      <div 
        className={`group relative flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer text-sm transition-all ${
          isActive ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
        }`}
        onClick={() => onSelectPage(page.id)}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-gray-600 hover:text-gray-400 shrink-0"
        >
          {children.length > 0 ? (isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <div className="w-[14px]"/>}
        </button>
        
        <FileText size={14} className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              className="bg-transparent text-slate-200 focus:outline-none border-b border-blue-500 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={submitRename}
              onKeyDown={submitRename}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />
          ) : (
            <span className="block truncate font-medium">{page.title}</span>
          )}
        </div>
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button 
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            onClick={(e) => { 
                e.stopPropagation(); 
                setShowMenu(!showMenu); 
            }}
          >
            <MoreVertical size={12} />
          </button>
        </div>

        {showMenu && (
          <div 
            ref={menuRef}
            className="fixed w-60 bg-[#2c2c2c] border border-[#3c3c3c] rounded-2xl shadow-2xl z-[100] py-1.5 backdrop-blur-2xl bg-opacity-95 overflow-hidden translate-x-60 -translate-y-[-200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem 
                icon={<PlusSquare size={16} />} 
                label="Add subpage" 
                hasSubmenu 
                onClick={(e) => { e.stopPropagation(); addPage(page.docId, page.id); setShowMenu(false); }}
            />
            <MenuItem 
                icon={<Plus size={16} />} 
                label="Add page" 
                hasSubmenu 
                onClick={(e) => { e.stopPropagation(); addPage(page.docId); setShowMenu(false); }}
            />
            
            <div className="border-t border-[#3c3c3c] my-1 mx-2" />
            
            <MenuItem 
                icon={<Layers size={16} />} 
                label="Page options" 
            />
            <MenuItem 
                icon={<Edit3 size={16} />} 
                label="Rename page" 
                onClick={handleRename}
            />
            <MenuItem 
                icon={<History size={16} className="rotate-180" />} 
                label="Reorder page" 
                hasSubmenu 
            />
            <MenuItem 
                icon={<EyeOff size={16} />} 
                label="Hide page" 
                isPro 
            />
            <MenuItem 
                icon={<Bookmark size={16} />} 
                label="Bookmark for me" 
            />
            
            <div className="border-t border-[#3c3c3c] my-1 mx-2" />
            
            <MenuItem 
                icon={<LinkIcon size={16} />} 
                label="Copy link to page" 
                hasSubmenu 
            />
            <MenuItem 
                icon={<History size={16} />} 
                label="Open page history" 
            />
            <MenuItem 
                icon={<ExternalLink size={16} />} 
                label="Open in new tab" 
            />
            
            <div className="border-t border-[#3c3c3c] my-1 mx-2" />
            
            <MenuItem 
                icon={<Copy size={16} />} 
                label="Duplicate page" 
            />
            <MenuItem 
                icon={<PlusSquare size={16} />} 
                label="Add to doc" 
                hasSubmenu 
            />
            
            <div className="border-t border-[#3c3c3c] my-1 mx-2" />
            
            <MenuItem 
                icon={<Trash2 size={16} />} 
                label="Delete page" 
                onClick={handleDelete}
                danger
            />
          </div>
        )}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="ml-3 border-l border-gray-800">
          {children.map(child => (
            <PageItem 
              key={child.id} 
              page={child} 
              activePageId={activePageId} 
              onSelectPage={onSelectPage} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ 
    icon, 
    label, 
    hasSubmenu, 
    isPro, 
    onClick,
    danger
}: { 
    icon: React.ReactNode, 
    label: string, 
    hasSubmenu?: boolean, 
    isPro?: boolean,
    onClick?: (e: React.MouseEvent) => void,
    danger?: boolean
}) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-1.5 text-[13px] transition-colors leading-relaxed ${
            danger ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-[#3c3c3c] text-white/90'
        }`}
    >
        <span className={danger ? 'text-red-400' : 'text-gray-400'}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {isPro && (
            <span className="text-[10px] font-bold text-orange-400 border border-orange-400/30 px-1 rounded bg-orange-400/10 leading-none py-0.5 ml-2">PRO</span>
        )}
        {hasSubmenu && (
            <ChevronRight size={12} className="text-gray-500" />
        )}
    </button>
);