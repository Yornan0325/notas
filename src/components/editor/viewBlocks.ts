import type { Block } from '../type/typeScript';

export type ViewBlockType = Extract<
  Block['type'],
  | 'view_table'
  | 'view_cards'
  | 'view_detail'
  | 'view_calendar'
  | 'view_form'
  | 'view_timeline'
  | 'view_chart'
  | 'view_board'
>;

export interface ViewBlockContent {
  title: string;
  columns: string[];
  rows: string[][];
  columnWidths: number[];
}

export const viewBlockTypes: ViewBlockType[] = [
  'view_table',
  'view_cards',
  'view_detail',
  'view_calendar',
  'view_form',
  'view_timeline',
  'view_chart',
  'view_board',
];

export const isViewBlockType = (type: Block['type']): type is ViewBlockType =>
  viewBlockTypes.includes(type as ViewBlockType);

const labels: Record<ViewBlockType, string> = {
  view_table: 'Table',
  view_cards: 'Cards',
  view_detail: 'Detail',
  view_calendar: 'Calendar',
  view_form: 'Form',
  view_timeline: 'Timeline',
  view_chart: 'Chart',
  view_board: 'Board',
};

export const getViewLabel = (type: ViewBlockType) => labels[type];

export const getDefaultViewContent = (type: ViewBlockType): ViewBlockContent => ({
  title: getViewLabel(type),
  columns:
    type === 'view_calendar'
      ? ['Evento', 'Fecha', 'Estado']
      : type === 'view_board'
        ? ['Tarea', 'Estado', 'Responsable']
        : type === 'view_timeline'
          ? ['Actividad', 'Inicio', 'Fin']
          : type === 'view_chart'
            ? ['Metrica', 'Valor', 'Categoria']
            : ['Nombre', 'Estado', 'Notas'],
  rows:
    type === 'view_chart'
      ? [
          ['Elemento 1', '30', 'A'],
          ['Elemento 2', '60', 'B'],
        ]
      : [
          ['Nuevo registro', 'Pendiente', ''],
          ['', '', ''],
        ],
  columnWidths: (
    type === 'view_calendar'
      ? ['Evento', 'Fecha', 'Estado']
      : type === 'view_board'
        ? ['Tarea', 'Estado', 'Responsable']
        : type === 'view_timeline'
          ? ['Actividad', 'Inicio', 'Fin']
          : type === 'view_chart'
            ? ['Metrica', 'Valor', 'Categoria']
            : ['Nombre', 'Estado', 'Notas']
  ).map(() => 280),
});

export const parseViewContent = (type: ViewBlockType, content: string): ViewBlockContent => {
  try {
    const parsed = JSON.parse(content) as Partial<ViewBlockContent>;
    if (Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
      const columns = parsed.columns.length ? parsed.columns : getDefaultViewContent(type).columns;
      const parsedWidths = Array.isArray(parsed.columnWidths) ? parsed.columnWidths : [];
      const columnWidths = columns.map((_, index) => {
        const width = Number(parsedWidths[index]);
        return Number.isFinite(width) && width > 0 ? width : 280;
      });

      return {
        title: typeof parsed.title === 'string' ? parsed.title : getViewLabel(type),
        columns,
        rows: parsed.rows.length ? parsed.rows : getDefaultViewContent(type).rows,
        columnWidths,
      };
    }
  } catch {
    // Empty or older content is initialized lazily.
  }

  return getDefaultViewContent(type);
};

export const stringifyViewContent = (content: ViewBlockContent) => JSON.stringify(content);

const normalizeTableCell = (value: string) =>
  value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseDelimitedLine = (line: string, delimiter: string) => {
  if (delimiter !== ',') return line.split(delimiter).map((cell) => normalizeTableCell(cell));

  const cells: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(normalizeTableCell(value));
      value = '';
      continue;
    }

    value += char;
  }

  cells.push(normalizeTableCell(value));
  return cells;
};

const rowsToViewContent = (
  rows: string[][],
  type: ViewBlockType = 'view_table',
  title?: string
): ViewBlockContent | null => {
  const cleanedRows = rows
    .map((row) => row.map((cell) => normalizeTableCell(cell)))
    .filter((row) => row.some((cell) => cell.length > 0));
  const maxColumns = cleanedRows.reduce((max, row) => Math.max(max, row.length), 0);

  if (maxColumns <= 1 || cleanedRows.length === 0) return null;

  const fillRow = (row: string[]) =>
    Array.from({ length: maxColumns }, (_, index) => row[index] || '');

  if (cleanedRows.length === 1) {
    return {
      title: title?.trim() || getViewLabel(type),
      columns: Array.from({ length: maxColumns }, (_, index) => `Columna ${index + 1}`),
      rows: [fillRow(cleanedRows[0])],
      columnWidths: Array.from({ length: maxColumns }, () => 280),
    };
  }

  const [header, ...body] = cleanedRows;
  const normalizedHeader = fillRow(header).map((cell, index) => cell || `Columna ${index + 1}`);
  const normalizedBody = body.length ? body.map(fillRow) : [Array(maxColumns).fill('')];

  return {
    title: title?.trim() || getViewLabel(type),
    columns: normalizedHeader,
    rows: normalizedBody,
    columnWidths: Array.from({ length: maxColumns }, () => 280),
  };
};

const parseHtmlTableRows = (html: string) => {
  if (!html.trim()) return null;

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const table = parsed.querySelector('table');
  if (!table) return null;

  const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
    Array.from(row.querySelectorAll('th,td')).map((cell) =>
      normalizeTableCell(cell.textContent || '')
    )
  );

  return rows.length ? rows : null;
};

const parseTextTableRows = (text: string) => {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return null;

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const hasTabs = lines.some((line) => line.includes('\t'));
  if (hasTabs) return lines.map((line) => parseDelimitedLine(line, '\t'));

  const markdownPipeLines = lines.filter((line) => (line.match(/\|/g) || []).length >= 2);
  if (markdownPipeLines.length >= 2) {
    return markdownPipeLines
      .map((line) => line.replace(/^\|/, '').replace(/\|$/, ''))
      .map((line) => line.split('|').map((cell) => normalizeTableCell(cell)))
      .filter((row) => !row.every((cell) => /^-+$/.test(cell)));
  }

  const hasCommas = lines.some((line) => line.includes(','));
  if (hasCommas) return lines.map((line) => parseDelimitedLine(line, ','));

  return null;
};

export const parseClipboardTableToViewContent = ({
  type = 'view_table',
  html = '',
  text = '',
  title,
}: {
  type?: ViewBlockType;
  html?: string;
  text?: string;
  title?: string;
}): ViewBlockContent | null => {
  const fromHtml = parseHtmlTableRows(html);
  if (fromHtml) return rowsToViewContent(fromHtml, type, title);

  const fromText = parseTextTableRows(text);
  if (fromText) return rowsToViewContent(fromText, type, title);

  return null;
};
