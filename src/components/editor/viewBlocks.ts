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
});

export const parseViewContent = (type: ViewBlockType, content: string): ViewBlockContent => {
  try {
    const parsed = JSON.parse(content) as Partial<ViewBlockContent>;
    if (Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
      return {
        title: parsed.title?.trim() || getViewLabel(type),
        columns: parsed.columns.length ? parsed.columns : getDefaultViewContent(type).columns,
        rows: parsed.rows.length ? parsed.rows : getDefaultViewContent(type).rows,
      };
    }
  } catch {
    // Empty or older content is initialized lazily.
  }

  return getDefaultViewContent(type);
};

export const stringifyViewContent = (content: ViewBlockContent) => JSON.stringify(content);
