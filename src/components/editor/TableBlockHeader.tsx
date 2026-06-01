import React, { useState } from 'react';
import { Plus, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { useTableStore } from './tableStore';

interface TableBlockHeaderProps {
  title: string;
  onAddColumn?: () => void;
  onAddRow?: () => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  readOnly?: boolean;
}

export const TableBlockHeader = React.memo(function TableBlockHeader({
  title,
  onAddColumn,
  onAddRow,
  onDuplicate,
  onRemove,
  readOnly = false,
}: TableBlockHeaderProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [showMenu, setShowMenu] = useState(false);

  const addColumn = useTableStore((state) => state.addColumn);
  const addRow = useTableStore((state) => state.addRow);

  const handleRenameTitle = () => {
    if (newTitle.trim()) {
      // La actualización del título se debe hacer en el componente padre
      // Por ahora solo cerramos el modo edición
    } else {
      setNewTitle(title);
    }
    setIsRenaming(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-4 p-4 bg-white border-b">
      <div className="flex-1">
        {isRenaming ? (
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleRenameTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameTitle();
              if (e.key === 'Escape') {
                setNewTitle(title);
                setIsRenaming(false);
              }
            }}
            className="text-2xl font-bold px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
          />
        ) : (
          <h2
            onClick={() => !readOnly && setIsRenaming(true)}
            className={`text-2xl font-bold ${!readOnly ? 'cursor-text hover:text-blue-600 transition-colors' : ''}`}
          >
            {title}
          </h2>
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => (onAddColumn ? onAddColumn() : addColumn())}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
            title="Agregar columna"
          >
            <Plus className="w-4 h-4" />
            Columna
          </button>

          <button
            onClick={() => (onAddRow ? onAddRow() : addRow())}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors text-sm font-medium"
            title="Agregar fila"
          >
            <Plus className="w-4 h-4" />
            Fila
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Más opciones"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-40">
                {onDuplicate && (
                  <button
                    onClick={() => {
                      onDuplicate();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 text-gray-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicar
                  </button>
                )}

                {onRemove && (
                  <button
                    onClick={() => {
                      onRemove();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-50 text-red-700 transition-colors border-t"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

TableBlockHeader.displayName = 'TableBlockHeader';
