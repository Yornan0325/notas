import type { ViewBlockContent } from '../viewBlocks';

export type DynamicTableCellType = 'text' | 'select' | 'checkbox';

export type DynamicTableCellValue = string;

export interface DynamicTableColumn {
  id: string;
  title: string;
  width: number;
  type: DynamicTableCellType;
  options: string[];
}

export interface DynamicTableRow {
  id: string;
  cells: Record<string, DynamicTableCellValue>;
}

export interface DynamicTableData {
  title: string;
  columns: DynamicTableColumn[];
  rows: DynamicTableRow[];
}

export type TableColumnDropPosition = {
  fromIndex: number;
  toIndex: number;
};

export type TableRowDropPosition = {
  fromIndex: number;
  toIndex: number;
};

const DEFAULT_COLUMN_WIDTH = 280;
const DEFAULT_COLUMN_TYPE: DynamicTableCellType = 'text';

const createId = (prefix: 'col' | 'row', index: number) =>
  `${prefix}_${index}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeWidth = (width: number | undefined) =>
  Number.isFinite(width) && Number(width) > 0 ? Number(width) : DEFAULT_COLUMN_WIDTH;

const ensureColumnType = (value: unknown): DynamicTableCellType =>
  value === 'select' || value === 'checkbox' || value === 'text' ? value : DEFAULT_COLUMN_TYPE;

export const deserializeDynamicTable = (view: ViewBlockContent): DynamicTableData => {
  const columnCount = view.columns.length;
  const columnIds = Array.isArray(view.columnIds) ? view.columnIds : [];
  const columnTypes = Array.isArray(view.columnTypes) ? view.columnTypes : [];
  const optionMap = view.columnOptions ?? {};

  const columns = view.columns.map((title, columnIndex) => {
    const id = columnIds[columnIndex] || createId('col', columnIndex);
    const options = Array.isArray(optionMap[id]) ? optionMap[id].map(String) : [];

    return {
      id,
      title,
      width: normalizeWidth(view.columnWidths[columnIndex]),
      type: ensureColumnType(columnTypes[columnIndex]),
      options,
    } satisfies DynamicTableColumn;
  });

  const fallbackRowValues = columnCount > 0 ? [Array.from({ length: columnCount }, () => '')] : [];
  const sourceRows = view.rows.length ? view.rows : fallbackRowValues;
  const rowIds = Array.isArray(view.rowIds) ? view.rowIds : [];

  const rows = sourceRows.map((rowValues, rowIndex) => {
    const id = rowIds[rowIndex] || createId('row', rowIndex);
    const cells = columns.reduce<Record<string, DynamicTableCellValue>>((acc, column, columnIndex) => {
      acc[column.id] = String(rowValues[columnIndex] ?? '');
      return acc;
    }, {});

    return { id, cells } satisfies DynamicTableRow;
  });

  return {
    title: view.title,
    columns,
    rows,
  };
};

export const serializeDynamicTable = (table: DynamicTableData): ViewBlockContent => {
  const columnIds = table.columns.map((column) => column.id);
  const rowIds = table.rows.map((row) => row.id);

  const columnOptions = table.columns.reduce<Record<string, string[]>>((acc, column) => {
    if (column.type === 'select' && column.options.length > 0) {
      acc[column.id] = [...column.options];
    }

    return acc;
  }, {});

  return {
    title: table.title,
    columns: table.columns.map((column) => column.title),
    rows: table.rows.map((row) => table.columns.map((column) => row.cells[column.id] ?? '')),
    columnWidths: table.columns.map((column) => normalizeWidth(column.width)),
    columnIds,
    rowIds,
    columnTypes: table.columns.map((column) => column.type),
    columnOptions,
  };
};

