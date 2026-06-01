import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, MoreVertical } from 'lucide-react';
import type { TableRow, TableColumn } from './tableTypes';
import { TableCell } from './TableCell';
import { useTableStore } from './tableStore';

interface TableRowProps {
  row: TableRow;
  columns: TableColumn[];
  readOnly?: boolean;
  onRemoveRow?: (rowId: string) => void;
}

export const TableRowComponent = React.memo(function TableRowComponent({
  row,
  columns,
  readOnly = false,
  onRemoveRow,
}: TableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const updateCell = useTableStore((state) => state.updateCell);
  const removeRow = useTableStore((state) => state.removeRow);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRemove = () => {
    if (onRemoveRow) {
      onRemoveRow(row.id);
    } else {
      removeRow(row.id);
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-gray-50 transition-colors ${isDragging ? 'bg-gray-100' : ''}`}
    >
      {!readOnly && (
        <td className="w-12 px-2 py-2 sticky left-0 bg-white group">
          <button
            {...listeners}
            {...attributes}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            title="Arrastra para reordenar"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
        </td>
      )}

      {columns.map((column) => (
        <td
          key={column.id}
          className="px-3 py-2 border-r last:border-r-0"
          style={{ width: column.width || 280 }}
        >
          <TableCell
            rowId={row.id}
            column={column}
            value={row.data[column.id]}
            onChange={(value) => updateCell(row.id, column.id, value)}
          />
        </td>
      ))}

      {!readOnly && (
        <td className="w-12 px-2 py-2 sticky right-0 bg-white group">
          <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleRemove}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Eliminar fila"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
});

TableRowComponent.displayName = 'TableRow';
