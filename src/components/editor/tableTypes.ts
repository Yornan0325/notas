export type TableColumnType = 'text' | 'number' | 'checkbox' | 'select' | 'date';

export interface TableColumn {
  id: string;
  title: string;
  type: TableColumnType;
  width?: number;
  options?: string[]; // para select/etiqueta
  isRequired?: boolean;
  sortable?: boolean;
}

export type TableRowData = Record<string, string | number | boolean | null>;

export interface TableRow {
  id: string;
  data: TableRowData;
  createdAt?: string;
  updatedAt?: string;
}

export interface TableBlockContent {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  meta?: {
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * Generador de IDs únicos para columnas y filas
 */
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Crea una nueva columna con valores por defecto
 */
export const createColumn = (
  title: string,
  type: TableColumnType = 'text',
  options?: string[]
): TableColumn => ({
  id: generateId(),
  title,
  type,
  width: 280,
  options,
  isRequired: false,
  sortable: true,
});

/**
 * Crea una nueva fila con todas las columnas inicializadas
 */
export const createRow = (columns: TableColumn[]): TableRow => ({
  id: generateId(),
  data: columns.reduce(
    (acc, col) => {
      acc[col.id] = null;
      return acc;
    },
    {} as TableRowData
  ),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Conversión de formato antiguo (array de strings) al nuevo (normalizado)
 */
export const migrateOldViewFormat = (
  columns: string[],
  rows: string[][],
  columnWidths?: number[]
): TableBlockContent => {
  const newColumns = columns.map((title, index) => ({
    id: generateId(),
    title,
    type: 'text' as TableColumnType,
    width: columnWidths?.[index] || 280,
    isRequired: false,
    sortable: true,
  }));

  const newRows = rows.map((rowData) => ({
    id: generateId(),
    data: newColumns.reduce(
      (acc, col, index) => {
        acc[col.id] = rowData[index] || null;
        return acc;
      },
      {} as TableRowData
    ),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    id: generateId(),
    title: 'Tabla',
    columns: newColumns,
    rows: newRows,
  };
};
