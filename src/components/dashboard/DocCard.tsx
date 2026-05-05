import { FileText, MoreVertical, Trash, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Page } from '../type/typeScript';
import { useState, useRef, useEffect } from 'react';
import { useCodaStore } from '../../store/useCodaStore';
import toast from 'react-hot-toast';

export const DocCard = ({ doc }: { doc: Page }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const { removeDocument, updatePageTitle } = useCodaStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar este documento y todo su contenido?')) {
      removeDocument(doc.docId);
      toast.success('Documento eliminado');
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
    if (title.trim() && title !== doc.title) {
      updatePageTitle(doc.id, title);
      toast.success('Título actualizado');
    } else {
      setTitle(doc.title);
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
    <div className="relative">
      <Link 
        to={`/doc/${doc.docId}`} 
        className="flex items-center gap-4 p-4 border border-gray-800 rounded-xl hover:border-blue-500/50 transition-all group bg-slate-900/90 hover:bg-slate-900"
      >
        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              className="bg-transparent text-slate-200 focus:outline-none border-b border-blue-500 w-full mb-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={submitRename}
              onKeyDown={submitRename}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />
          ) : (
            <h3 className="font-medium text-slate-200 truncate">{doc.title}</h3>
          )}
          <p className="text-xs text-slate-500">Editado recientemente</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 hover:bg-gray-800 rounded-lg transition-colors relative z-10"
        >
          <MoreVertical size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
        </button>
      </Link>

      {showMenu && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-30 py-2 backdrop-blur-xl bg-opacity-90 overflow-hidden"
        >
          <button
            onClick={handleRename}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-gray-800 transition-colors"
          >
            <Edit2 size={14} className="text-blue-400" />
            Renombrar
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash size={14} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};