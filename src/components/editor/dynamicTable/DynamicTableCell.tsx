import { memo, useCallback } from 'react';
import type { DynamicTableColumn } from './types';
import { renderDynamicTableCell } from './cellFactory';
import type { DynamicTableStore } from './useDynamicTable';
import { useDynamicTableSelector } from './useDynamicTable';

interface DynamicTableCellProps {
  store: DynamicTableStore;
  rowId: string;
  column: DynamicTableColumn;
  readOnly: boolean;
  onCommit: (rowId: string, columnId: string, value: string) => void;
}

export const DynamicTableCell = memo(function DynamicTableCell({
  store,
  rowId,
  column,
  readOnly,
  onCommit,
}: DynamicTableCellProps) {
  const value = useDynamicTableSelector(
    store,
    useCallback((state) => state.rowsById[rowId]?.cells[column.id] ?? '', [column.id, rowId])
  );

  const handleCommit = useCallback(
    (nextValue: string) => {
      onCommit(rowId, column.id, nextValue);
    },
    [column.id, onCommit, rowId]
  );

  return renderDynamicTableCell(column.type, {
    value,
    column,
    readOnly,
    onCommit: handleCommit,
  });
});
