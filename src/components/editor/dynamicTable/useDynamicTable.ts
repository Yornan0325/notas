import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { ViewBlockContent } from '../viewBlocks';
import {
  deserializeDynamicTable,
  serializeDynamicTable,
  type DynamicTableCellType,
  type DynamicTableColumn,
  type DynamicTableData,
  type DynamicTableRow,
  type TableColumnDropPosition,
  type TableRowDropPosition,
} from './types';

export type DynamicTableStore = StoreApi<DynamicTableStoreState>;

interface DynamicTableStateSlice {
  title: string;
  columns: DynamicTableColumn[];
  rowOrder: string[];
  rowsById: Record<string, DynamicTableRow>;
  draggingColumnIndex: number | null;
  draggingRowIndex: number | null;
}

interface DynamicTableActions {
  replaceAll: (table: DynamicTableData) => void;
  setDraggingColumnIndex: (columnIndex: number | null) => void;
  setDraggingRowIndex: (rowIndex: number | null) => void;
  setTitle: (title: string) => void;
  updateCell: (rowId: string, columnId: string, value: string) => void;
  updateColumnTitle: (columnIndex: number, title: string) => void;
  updateColumnType: (columnIndex: number, type: DynamicTableCellType) => void;
  updateColumnOptions: (columnIndex: number, options: string[]) => void;
  resizeColumn: (columnIndex: number, width: number) => void;
  addColumn: (afterColumnIndex?: number) => void;
  removeColumn: (columnIndex: number) => void;
  moveColumn: (position: TableColumnDropPosition) => void;
  addRow: (afterRowIndex?: number) => void;
  removeRow: (rowIndex: number) => void;
  moveRow: (position: TableRowDropPosition) => void;
}

export interface DynamicTableStoreState extends DynamicTableStateSlice, DynamicTableActions {}

interface UseDynamicTableArgs {
  initialView: ViewBlockContent;
  onCommit: (nextContent: string) => void;
}

interface UseDynamicTableResult {
  store: DynamicTableStore;
  api: {
    addColumn: (afterColumnIndex?: number) => void;
    removeColumn: (columnIndex: number) => void;
    moveColumn: (position: TableColumnDropPosition) => void;
    resizeColumn: (columnIndex: number, width: number) => void;
    addRow: (afterRowIndex?: number) => void;
    removeRow: (rowIndex: number) => void;
    moveRow: (position: TableRowDropPosition) => void;
    setDraggingColumnIndex: (columnIndex: number | null) => void;
    setDraggingRowIndex: (rowIndex: number | null) => void;
    updateCell: (rowId: string, columnId: string, value: string) => void;
    updateColumnTitle: (columnIndex: number, title: string) => void;
    updateColumnType: (columnIndex: number, type: DynamicTableCellType) => void;
    updateColumnOptions: (columnIndex: number, options: string[]) => void;
    setTitle: (title: string) => void;
  };
}

const DEFAULT_COLUMN_WIDTH = 280;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const createRowId = () => `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createColumnId = () => `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getRowsInOrder = (state: DynamicTableStateSlice) =>
  state.rowOrder.map((rowId) => state.rowsById[rowId]).filter(Boolean);

const toDynamicTableData = (state: DynamicTableStateSlice): DynamicTableData => ({
  title: state.title,
  columns: state.columns,
  rows: getRowsInOrder(state),
});

const fromDynamicTableData = (table: DynamicTableData): DynamicTableStateSlice => ({
  title: table.title,
  columns: table.columns,
  rowOrder: table.rows.map((row) => row.id),
  rowsById: table.rows.reduce<Record<string, DynamicTableRow>>((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {}),
  draggingColumnIndex: null,
  draggingRowIndex: null,
});

const createInitialState = (table: DynamicTableData): DynamicTableStoreState => {
  const base = fromDynamicTableData(table);

  return {
    ...base,
    replaceAll: () => undefined,
    setDraggingColumnIndex: () => undefined,
    setDraggingRowIndex: () => undefined,
    setTitle: () => undefined,
    updateCell: () => undefined,
    updateColumnTitle: () => undefined,
    updateColumnType: () => undefined,
    updateColumnOptions: () => undefined,
    resizeColumn: () => undefined,
    addColumn: () => undefined,
    removeColumn: () => undefined,
    moveColumn: () => undefined,
    addRow: () => undefined,
    removeRow: () => undefined,
    moveRow: () => undefined,
  };
};

const createDynamicTableStore = (table: DynamicTableData): DynamicTableStore =>
  createStore<DynamicTableStoreState>()((set) => {
    const state = createInitialState(table);

    return {
      ...state,
      replaceAll: (nextTable) => {
        set(() => ({
          ...fromDynamicTableData(nextTable),
        }));
      },
      setDraggingColumnIndex: (columnIndex) => set(() => ({ draggingColumnIndex: columnIndex })),
      setDraggingRowIndex: (rowIndex) => set(() => ({ draggingRowIndex: rowIndex })),
      setTitle: (title) => set(() => ({ title })),
      updateCell: (rowId, columnId, value) =>
        set((current) => {
          const row = current.rowsById[rowId];
          if (!row) return current;
          if (row.cells[columnId] === value) return current;

          return {
            rowsById: {
              ...current.rowsById,
              [rowId]: {
                ...row,
                cells: {
                  ...row.cells,
                  [columnId]: value,
                },
              },
            },
          };
        }),
      updateColumnTitle: (columnIndex, title) =>
        set((current) => {
          if (!current.columns[columnIndex]) return current;
          if (current.columns[columnIndex].title === title) return current;

          const columns = [...current.columns];
          columns[columnIndex] = {
            ...columns[columnIndex],
            title,
          };

          return { columns };
        }),
      updateColumnType: (columnIndex, type) =>
        set((current) => {
          if (!current.columns[columnIndex]) return current;
          if (current.columns[columnIndex].type === type) return current;

          const columns = [...current.columns];
          columns[columnIndex] = {
            ...columns[columnIndex],
            type,
          };

          return { columns };
        }),
      updateColumnOptions: (columnIndex, options) =>
        set((current) => {
          if (!current.columns[columnIndex]) return current;

          const normalizedOptions = options.map((option) => option.trim()).filter(Boolean);
          const columns = [...current.columns];
          columns[columnIndex] = {
            ...columns[columnIndex],
            options: normalizedOptions,
          };

          return { columns };
        }),
      resizeColumn: (columnIndex, width) =>
        set((current) => {
          if (!current.columns[columnIndex]) return current;
          const clampedWidth = Math.max(80, width);
          if (current.columns[columnIndex].width === clampedWidth) return current;

          const columns = [...current.columns];
          columns[columnIndex] = {
            ...columns[columnIndex],
            width: clampedWidth,
          };

          return { columns };
        }),
      addColumn: (afterColumnIndex) =>
        set((current) => {
          const nextIndex = clamp(
            typeof afterColumnIndex === 'number' ? afterColumnIndex + 1 : current.columns.length,
            0,
            current.columns.length
          );
          const nextColumnIndex = current.columns.length + 1;
          const columnId = createColumnId();
          const newColumn: DynamicTableColumn = {
            id: columnId,
            title: `Columna ${nextColumnIndex}`,
            width: DEFAULT_COLUMN_WIDTH,
            type: 'text',
            options: [],
          };

          const columns = [...current.columns];
          columns.splice(nextIndex, 0, newColumn);

          const rowsById = Object.fromEntries(
            Object.entries(current.rowsById).map(([rowId, row]) => [
              rowId,
              {
                ...row,
                cells: {
                  ...row.cells,
                  [columnId]: '',
                },
              } satisfies DynamicTableRow,
            ])
          ) as Record<string, DynamicTableRow>;

          return { columns, rowsById };
        }),
      removeColumn: (columnIndex) =>
        set((current) => {
          if (current.columns.length <= 1) return current;
          if (!current.columns[columnIndex]) return current;

          const columnId = current.columns[columnIndex].id;
          const columns = current.columns.filter((_, index) => index !== columnIndex);
          const rowsById = Object.fromEntries(
            Object.entries(current.rowsById).map(([rowId, row]) => {
              const nextCells = { ...row.cells };
              delete nextCells[columnId];

              return [
                rowId,
                {
                  ...row,
                  cells: nextCells,
                } satisfies DynamicTableRow,
              ];
            })
          ) as Record<string, DynamicTableRow>;

          return { columns, rowsById };
        }),
      moveColumn: ({ fromIndex, toIndex }) =>
        set((current) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= current.columns.length ||
            toIndex >= current.columns.length
          ) {
            return current;
          }

          const columns = [...current.columns];
          const [moved] = columns.splice(fromIndex, 1);
          columns.splice(toIndex, 0, moved);
          return { columns };
        }),
      addRow: (afterRowIndex) =>
        set((current) => {
          const rowId = createRowId();
          const rowCells = current.columns.reduce<Record<string, string>>((acc, column) => {
            acc[column.id] = '';
            return acc;
          }, {});

          const nextRow: DynamicTableRow = {
            id: rowId,
            cells: rowCells,
          };

          const rowOrder = [...current.rowOrder];
          const insertionIndex = clamp(
            typeof afterRowIndex === 'number' ? afterRowIndex + 1 : rowOrder.length,
            0,
            rowOrder.length
          );
          rowOrder.splice(insertionIndex, 0, rowId);

          return {
            rowOrder,
            rowsById: {
              ...current.rowsById,
              [rowId]: nextRow,
            },
          };
        }),
      removeRow: (rowIndex) =>
        set((current) => {
          if (!current.rowOrder[rowIndex]) return current;

          const rowId = current.rowOrder[rowIndex];
          const rowOrder = current.rowOrder.filter((_, index) => index !== rowIndex);
          const rowsById = { ...current.rowsById };
          delete rowsById[rowId];

          return { rowOrder, rowsById };
        }),
      moveRow: ({ fromIndex, toIndex }) =>
        set((current) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= current.rowOrder.length ||
            toIndex >= current.rowOrder.length
          ) {
            return current;
          }

          const rowOrder = [...current.rowOrder];
          const [moved] = rowOrder.splice(fromIndex, 1);
          rowOrder.splice(toIndex, 0, moved);
          return { rowOrder };
        }),
    };
  });

export const useDynamicTableSelector = <T>(
  store: DynamicTableStore,
  selector: (state: DynamicTableStoreState) => T
) => useStore(store, selector);

export const useDynamicTable = ({ initialView, onCommit }: UseDynamicTableArgs): UseDynamicTableResult => {
  const initialTable = useMemo(() => deserializeDynamicTable(initialView), [initialView]);
  const serializedInput = useMemo(() => JSON.stringify(initialView), [initialView]);
  const [store] = useState<DynamicTableStore>(() => createDynamicTableStore(initialTable));
  const suppressNextCommitRef = useRef(false);
  const lastCommittedRef = useRef<string>(JSON.stringify(initialView));

  useEffect(() => {
    if (serializedInput === lastCommittedRef.current) return;

    suppressNextCommitRef.current = true;
    store.getState().replaceAll(initialTable);
    lastCommittedRef.current = serializedInput;
  }, [initialTable, serializedInput, store]);

  useEffect(() => {
    return store.subscribe((state) => {
      if (suppressNextCommitRef.current) {
        suppressNextCommitRef.current = false;
        return;
      }

      const nextView = serializeDynamicTable(toDynamicTableData(state));
      const serialized = JSON.stringify(nextView);
      if (serialized === lastCommittedRef.current) return;

      lastCommittedRef.current = serialized;
      onCommit(serialized);
    });
  }, [onCommit, store]);

  const api = useMemo(
    () => ({
      addColumn: (afterColumnIndex?: number) => store.getState().addColumn(afterColumnIndex),
      removeColumn: (columnIndex: number) => store.getState().removeColumn(columnIndex),
      moveColumn: (position: TableColumnDropPosition) => store.getState().moveColumn(position),
      resizeColumn: (columnIndex: number, width: number) =>
        store.getState().resizeColumn(columnIndex, width),
      addRow: (afterRowIndex?: number) => store.getState().addRow(afterRowIndex),
      removeRow: (rowIndex: number) => store.getState().removeRow(rowIndex),
      moveRow: (position: TableRowDropPosition) => store.getState().moveRow(position),
      setDraggingColumnIndex: (columnIndex: number | null) =>
        store.getState().setDraggingColumnIndex(columnIndex),
      setDraggingRowIndex: (rowIndex: number | null) =>
        store.getState().setDraggingRowIndex(rowIndex),
      updateCell: (rowId: string, columnId: string, value: string) =>
        store.getState().updateCell(rowId, columnId, value),
      updateColumnTitle: (columnIndex: number, title: string) =>
        store.getState().updateColumnTitle(columnIndex, title),
      updateColumnType: (columnIndex: number, type: DynamicTableCellType) =>
        store.getState().updateColumnType(columnIndex, type),
      updateColumnOptions: (columnIndex: number, options: string[]) =>
        store.getState().updateColumnOptions(columnIndex, options),
      setTitle: (title: string) => store.getState().setTitle(title),
    }),
    [store]
  );

  return {
    store,
    api,
  };
};
