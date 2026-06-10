import { memo, useCallback } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import type { DynamicTableColumn } from './types';
import type { DynamicTableStore } from './useDynamicTable';
import { DynamicTableCell } from './DynamicTableCell';
import { useDynamicTableSelector } from './useDynamicTable';

interface DynamicTableRowProps {
  store: DynamicTableStore;
  rowId: string;
  rowIndex: number;
  columns: DynamicTableColumn[];
  readOnly: boolean;
  onCommitCell: (rowId: string, columnId: string, value: string) => void;
  onDragStartRow: (rowIndex: number) => void;
  onDragEndRow: () => void;
  onDropRow: (toRowIndex: number) => void;
  onRemoveRow: (rowIndex: number) => void;
}

export const DynamicTableRow = memo(function DynamicTableRow({
  store,
  rowId,
  rowIndex,
  columns,
  readOnly,
  onCommitCell,
  onDragStartRow,
  onDragEndRow,
  onDropRow,
  onRemoveRow,
}: DynamicTableRowProps) {
  const draggingRowIndex = useDynamicTableSelector(store, (state) => state.draggingRowIndex);
  const isDragged = draggingRowIndex === rowIndex;

  const handleDrop = useCallback(() => onDropRow(rowIndex), [onDropRow, rowIndex]);
  const handleDragStart = useCallback(() => onDragStartRow(rowIndex), [onDragStartRow, rowIndex]);
  const handleRemove = useCallback(() => onRemoveRow(rowIndex), [onRemoveRow, rowIndex]);

  return (
    <tr
      className={`group/row transition-colors ${
        isDragged ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
      }`}
      onDragOver={(event) => {
        if (readOnly || draggingRowIndex === null) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (readOnly) return;
        event.preventDefault();
        handleDrop();
      }}
    >
      {columns.map((column) => (
        <td
          key={`${rowId}-${column.id}`}
          className="border border-slate-200 bg-transparent px-3 py-2.5 align-middle dark:border-slate-700/50"
        >
          <DynamicTableCell
            store={store}
            rowId={rowId}
            column={column}
            readOnly={readOnly}
            onCommit={onCommitCell}
          />
        </td>
      ))}
      {!readOnly && (
        <td className="border-0 bg-transparent px-1 py-1 align-middle">
          <div className="flex items-center justify-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                handleDragStart();
              }}
              onDragEnd={onDragEndRow}
              className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400"
              title="Mover fila"
              aria-label="Mover fila"
            >
              <GripVertical size={13} />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              title="Eliminar fila"
              aria-label="Eliminar fila"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
});
