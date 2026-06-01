import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Trash2, ChevronDown } from 'lucide-react';
import type { TableColumn, TableColumnType } from './tableTypes';
import { useTableStore } from './tableStore';

interface TableColumnHeaderProps {
  column: TableColumn;
  readOnly?: boolean;
  onRemoveColumn?: (columnId: string) => void;
}

const columnTypeLabels: Record<TableColumnType, string> = {
  text: 'Texto',
  number: 'Número',
  checkbox: 'Checkbox',
  select: 'Select',
  date: 'Fecha',
};

export const TableColumnHeader = React.memo(function TableColumnHeader({
  column,
  readOnly = false,
  onRemoveColumn,
}: TableColumnHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const updateColumn = useTableStore((state) => state.updateColumn);
  const removeColumn = useTableStore((state) => state.removeColumn);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = () => {
    if (newTitle.trim()) {
      updateColumn(column.id, { title: newTitle.trim() });
    } else {
      setNewTitle(column.title);
    }
    setIsRenaming(false);
  };

  const handleChangeType = (type: TableColumnType) => {
    updateColumn(column.id, { type });
    setShowTypeMenu(false);
  };

  const handleRemove = () => {
    if (onRemoveColumn) {
      onRemoveColumn(column.id);
    } else {
      removeColumn(column.id);
    }
  };

  return (
    <th
      ref={setNodeRef}
      style={{
        ...style,
        width: column.width || 280,
        minWidth: column.width || 280,
      }}
      className={`px-3 py-2 text-left font-semibold border-b border-r last:border-r-0 bg-gray-50 group hover:bg-gray-100 transition-colors ${
        isDragging ? 'bg-blue-100' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {!readOnly && (
          <button
            {...listeners}
            {...attributes}
            className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            title="Arrastra para reordenar columnas"
          >
            <GripHorizontal className="w-3 h-3 text-gray-400" />
          </button>
        )}

        {isRenaming ? (
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setNewTitle(column.title);
                setIsRenaming(false);
              }
            }}
            className="flex-1 px-1 py-0.5 text-sm font-semibold border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
        ) : (
          <span
            onClick={() => !readOnly && setIsRenaming(true)}
            className={`flex-1 text-sm font-semibold ${!readOnly ? 'cursor-text' : ''}`}
          >
            {column.title}
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => !readOnly && setShowTypeMenu(!showTypeMenu)}
            className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-xs text-gray-600 hover:text-gray-800"
            disabled={readOnly}
            title="Cambiar tipo de columna"
          >
            <span className="text-xs">{columnTypeLabels[column.type]}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showTypeMenu && !readOnly && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-32">
              {Object.entries(columnTypeLabels).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => handleChangeType(type as TableColumnType)}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                    column.type === type ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!readOnly && (
          <button
            onClick={handleRemove}
            className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 rounded"
            title="Eliminar columna"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </th>
  );
});

TableColumnHeader.displayName = 'TableColumnHeader';
