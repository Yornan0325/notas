import { create } from 'zustand';
import type { TableBlockContent, TableColumn, TableRow, TableRowData } from './tableTypes';
import { generateId, createRow, createColumn } from './tableTypes';

interface TableStoreState {
  content: TableBlockContent;
  setContent: (next: TableBlockContent) => void;

  // Operaciones de celda
  updateCell: (rowId: string, columnId: string, value: any) => void;

  // Operaciones de fila
  addRow: (afterRowId?: string) => void;
  removeRow: (rowId: string) => void;
  reorderRows: (newRowIds: string[]) => void;

  // Operaciones de columna
  addColumn: (afterColumnId?: string) => void;
  removeColumn: (columnId: string) => void;
  updateColumn: (columnId: string, updates: Partial<TableColumn>) => void;
  reorderColumns: (newColumnIds: string[]) => void;

  // Utilidades
  reset: (initialContent: TableBlockContent) => void;
}

export const useTableStore = create<TableStoreState>((set) => ({
  content: {
    id: generateId(),
    title: 'Nueva Tabla',
    columns: [],
    rows: [],
  },

  setContent: (next) => set({ content: next }),

  updateCell: (rowId, columnId, value) =>
    set((state) => ({
      content: {
        ...state.content,
        rows: state.content.rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                data: { ...row.data, [columnId]: value },
                updatedAt: new Date().toISOString(),
              }
            : row
        ),
      },
    })),

  addRow: (afterRowId) =>
    set((state) => {
      const newRow = createRow(state.content.columns);
      const rows = [...state.content.rows];

      if (afterRowId && state.content.rows.some((r) => r.id === afterRowId)) {
        const insertIndex = state.content.rows.findIndex((r) => r.id === afterRowId) + 1;
        rows.splice(insertIndex, 0, newRow);
      } else {
        rows.push(newRow);
      }

      return {
        content: {
          ...state.content,
          rows,
        },
      };
    }),

  removeRow: (rowId) =>
    set((state) => ({
      content: {
        ...state.content,
        rows: state.content.rows.filter((r) => r.id !== rowId),
      },
    })),

  reorderRows: (newRowIds) =>
    set((state) => {
      const rowMap = new Map(state.content.rows.map((r) => [r.id, r]));
      const newRows = newRowIds
        .map((id) => rowMap.get(id))
        .filter((row) => row !== undefined) as TableRow[];

      return {
        content: {
          ...state.content,
          rows: newRows,
        },
      };
    }),

  addColumn: (afterColumnId) =>
    set((state) => {
      const newColumn = createColumn(`Columna ${state.content.columns.length + 1}`);
      const columns = [...state.content.columns];

      if (afterColumnId && state.content.columns.some((c) => c.id === afterColumnId)) {
        const insertIndex = state.content.columns.findIndex((c) => c.id === afterColumnId) + 1;
        columns.splice(insertIndex, 0, newColumn);
      } else {
        columns.push(newColumn);
      }

      // Agregar la nueva columna a todas las filas
      const rows = state.content.rows.map((row) => ({
        ...row,
        data: { ...row.data, [newColumn.id]: null },
      }));

      return {
        content: {
          ...state.content,
          columns,
          rows,
        },
      };
    }),

  removeColumn: (columnId) =>
    set((state) => ({
      content: {
        ...state.content,
        columns: state.content.columns.filter((c) => c.id !== columnId),
        rows: state.content.rows.map((row) => {
          const { [columnId]: _, ...newData } = row.data;
          return {
            ...row,
            data: newData,
          };
        }),
      },
    })),

  updateColumn: (columnId, updates) =>
    set((state) => ({
      content: {
        ...state.content,
        columns: state.content.columns.map((col) =>
          col.id === columnId ? { ...col, ...updates } : col
        ),
      },
    })),

  reorderColumns: (newColumnIds) =>
    set((state) => {
      const columnMap = new Map(state.content.columns.map((c) => [c.id, c]));
      const newColumns = newColumnIds
        .map((id) => columnMap.get(id))
        .filter((col) => col !== undefined) as TableColumn[];

      return {
        content: {
          ...state.content,
          columns: newColumns,
        },
      };
    }),

  reset: (initialContent) => set({ content: initialContent }),
}));
