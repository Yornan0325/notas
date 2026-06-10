import { memo, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { DynamicTableColumn } from './types';
import type { DynamicTableStore } from './useDynamicTable';
import { useDynamicTableSelector } from './useDynamicTable';

interface DynamicTableHeaderProps {
  store: DynamicTableStore;
  columns: DynamicTableColumn[];
  readOnly: boolean;
  onDragStartColumn: (columnIndex: number) => void;
  onDragEndColumn: () => void;
  onDropColumn: (toColumnIndex: number) => void;
  onAddColumn: (afterColumnIndex?: number) => void;
  onRemoveColumn: (columnIndex: number) => void;
  onUpdateColumnTitle: (columnIndex: number, title: string) => void;
  onUpdateColumnType: (columnIndex: number, type: DynamicTableColumn['type']) => void;
  onUpdateColumnOptions: (columnIndex: number, options: string[]) => void;
  onStartResize: (event: ReactMouseEvent<HTMLButtonElement>, columnIndex: number) => void;
}

export const DynamicTableHeader = memo(function DynamicTableHeader({
  store,
  columns,
  readOnly,
  onDragStartColumn,
  onDragEndColumn,
  onDropColumn,
  onAddColumn,
  onRemoveColumn,
  onUpdateColumnTitle,
  onUpdateColumnType,
  onUpdateColumnOptions,
  onStartResize,
}: DynamicTableHeaderProps) {
  const draggingColumnIndex = useDynamicTableSelector(store, (state) => state.draggingColumnIndex);

  const handleTypeChange = useCallback(
    (columnIndex: number, nextType: DynamicTableColumn['type']) => {
      onUpdateColumnType(columnIndex, nextType);

      if (nextType === 'select') {
        const response = window.prompt('Opciones separadas por coma', 'Pendiente,En proceso,Completado');
        if (response !== null) {
          const options = response
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
          onUpdateColumnOptions(columnIndex, options);
        }
      }
    },
    [onUpdateColumnOptions, onUpdateColumnType]
  );

  return (
    <thead>
      <tr>
        {columns.map((column, columnIndex) => (
          <th
            key={column.id}
            className={`group/column relative overflow-hidden border border-slate-200 bg-transparent dark:border-slate-700/50 ${
              draggingColumnIndex === columnIndex ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
            }`}
            style={{ width: `${column.width}px`, minWidth: `${column.width}px` }}
            onDragOver={(event) => {
              if (readOnly || draggingColumnIndex === null) return;
              event.preventDefault();
            }}
            onDrop={(event) => {
              if (readOnly) return;
              event.preventDefault();
              onDropColumn(columnIndex);
            }}
          >
            <div className="flex items-center gap-1 px-3 py-2.5">
              {!readOnly && (
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    onDragStartColumn(columnIndex);
                  }}
                  onDragEnd={onDragEndColumn}
                  className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded text-slate-300 opacity-0 transition-opacity group-hover/column:opacity-100 hover:bg-slate-200 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-400"
                  title="Mover columna"
                  aria-label="Mover columna"
                >
                  <GripVertical size={12} />
                </button>
              )}
              <input
                value={column.title}
                readOnly={readOnly}
                onChange={(event) => onUpdateColumnTitle(columnIndex, event.target.value)}
                className="view-cell-input min-w-0 flex-1 bg-transparent text-xs font-semibold uppercase tracking-wider text-slate-500 outline-none ring-0 focus:outline-none focus:ring-0 dark:text-slate-400"
              />
              {!readOnly && (
                <select
                  value={column.type}
                  onChange={(event) =>
                    handleTypeChange(columnIndex, event.target.value as DynamicTableColumn['type'])
                  }
                  className="view-cell-input w-[86px] shrink-0 bg-transparent text-[11px] text-slate-500 outline-none ring-0 focus:outline-none focus:ring-0 dark:text-slate-400"
                >
                  <option value="text">Texto</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Check</option>
                </select>
              )}
              {!readOnly && (
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/column:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => onAddColumn(columnIndex)}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    title="Agregar columna"
                    aria-label="Agregar columna"
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveColumn(columnIndex)}
                    disabled={columns.length <= 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:disabled:hover:text-slate-500"
                    title="Eliminar columna"
                    aria-label="Eliminar columna"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
            {!readOnly && columnIndex < columns.length - 1 && (
              <button
                type="button"
                onMouseDown={(event) => onStartResize(event, columnIndex)}
                className="absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize bg-transparent transition-colors hover:bg-blue-500/55"
                aria-label={`Redimensionar columna ${columnIndex + 1}`}
              />
            )}
          </th>
        ))}
        {!readOnly && <th className="border-0 bg-transparent" />}
      </tr>
    </thead>
  );
});
