import { memo, useCallback, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import { Plus } from 'lucide-react';
import type { ViewBlockContent } from '../viewBlocks';
import { DynamicTableHeader } from './DynamicTableHeader';
import { DynamicTableRow } from './DynamicTableRow';
import { useDynamicTable, useDynamicTableSelector } from './useDynamicTable';

interface DynamicTableViewProps {
  initialView: ViewBlockContent;
  onCommit: (nextContent: string) => void;
  readOnly: boolean;
}

export const DynamicTableView = memo(function DynamicTableView({
  initialView,
  onCommit,
  readOnly,
}: DynamicTableViewProps) {
  const { store, api } = useDynamicTable({
    initialView,
    onCommit,
  });

  const columns = useDynamicTableSelector(store, (state) => state.columns);
  const rowOrder = useDynamicTableSelector(store, (state) => state.rowOrder);
  const totalColumnWidth = useMemo(
    () => columns.reduce((sum, column) => sum + Math.max(80, column.width), 0),
    [columns]
  );
  const actionColumnWidth = readOnly ? 0 : 64;
  const tableWidth = totalColumnWidth + actionColumnWidth;

  const startColumnResize = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, columnIndex: number) => {
      if (readOnly) return;
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = columns[columnIndex]?.width ?? 280;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const handleMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = Math.max(80, startWidth + delta);
        api.resizeColumn(columnIndex, nextWidth);
      };

      const handleStop = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleStop);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleStop);
    },
    [api, columns, readOnly]
  );

  const handleDropColumn = useCallback(
    (toIndex: number) => {
      const fromIndex = store.getState().draggingColumnIndex;
      if (fromIndex === null) return;
      api.moveColumn({ fromIndex, toIndex });
      api.setDraggingColumnIndex(null);
    },
    [api, store]
  );

  const handleDropRow = useCallback(
    (toIndex: number) => {
      const fromIndex = store.getState().draggingRowIndex;
      if (fromIndex === null) return;
      api.moveRow({ fromIndex, toIndex });
      api.setDraggingRowIndex(null);
    },
    [api, store]
  );

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-left table-auto" style={{ minWidth: `${tableWidth}px` }}>
        <DynamicTableHeader
          store={store}
          columns={columns}
          readOnly={readOnly}
          onDragStartColumn={api.setDraggingColumnIndex}
          onDragEndColumn={() => api.setDraggingColumnIndex(null)}
          onDropColumn={handleDropColumn}
          onAddColumn={api.addColumn}
          onRemoveColumn={api.removeColumn}
          onUpdateColumnTitle={api.updateColumnTitle}
          onUpdateColumnType={api.updateColumnType}
          onUpdateColumnOptions={api.updateColumnOptions}
          onStartResize={startColumnResize}
        />
        <tbody>
          {rowOrder.map((rowId, rowIndex) => (
            <DynamicTableRow
              key={rowId}
              store={store}
              rowId={rowId}
              rowIndex={rowIndex}
              columns={columns}
              readOnly={readOnly}
              onCommitCell={api.updateCell}
              onDragStartRow={api.setDraggingRowIndex}
              onDragEndRow={() => api.setDraggingRowIndex(null)}
              onDropRow={handleDropRow}
              onRemoveRow={api.removeRow}
            />
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <button
          type="button"
          onClick={() => api.addRow()}
          className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Agregar fila"
        >
          <Plus size={13} />
          <span>Agregar fila</span>
        </button>
      )}
    </div>
  );
});
