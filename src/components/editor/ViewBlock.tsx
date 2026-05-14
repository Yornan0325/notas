import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Expand,
  FileInput,
  Link,
  MoreVertical,
  Plus,
  Table2,
  Trash2,
  Type,
} from 'lucide-react';
import { NewViewPicker } from './NewViewPicker';
import {
  getViewLabel,
  parseViewContent,
  stringifyViewContent,
  type ViewBlockContent,
  type ViewBlockType,
} from './viewBlocks';

interface ViewBlockProps {
  type: ViewBlockType;
  content: string;
  onUpdate: (content: string) => void;
  onAddView: (type: ViewBlockType) => void;
  onRemove: () => void;
  onFocus: () => void;
  readOnly?: boolean;
}

const updateCellValue = (
  view: ViewBlockContent,
  rowIndex: number,
  columnIndex: number,
  value: string
) => {
  const rows = view.rows.length ? view.rows : [view.columns.map(() => '')];

  return {
    ...view,
    rows: rows.map((row, currentRowIndex) =>
      currentRowIndex === rowIndex
        ? view.columns.map((_, currentColumnIndex) =>
            currentColumnIndex === columnIndex ? value : row[currentColumnIndex] || ''
          )
        : row
    ),
  };
};

const escapeCsvCell = (value: string) => {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

const viewToCsv = (view: ViewBlockContent) => {
  const rows = view.rows.length ? view.rows : [view.columns.map(() => '')];
  return [view.columns, ...rows]
    .map((row) => view.columns.map((_, index) => escapeCsvCell(row[index] || '')).join(','))
    .join('\n');
};

const parseCsvRows = (csv: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
};

export const ViewBlock = ({
  type,
  content,
  onUpdate,
  onAddView,
  onRemove,
  onFocus,
  readOnly = false,
}: ViewBlockProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNewView, setShowNewView] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [titleStyle, setTitleStyle] = useState<'large' | 'compact'>('large');
  const [isCollapsible, setIsCollapsible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewBlockRef = useRef<HTMLDivElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const view = useMemo(() => parseViewContent(type, content), [content, type]);

  const commit = (nextView: ViewBlockContent) => onUpdate(stringifyViewContent(nextView));
  const visibleRows = view.rows.length ? view.rows : [view.columns.map(() => '')];
  const titleClass =
    titleStyle === 'large'
      ? 'text-3xl font-bold tracking-tight'
      : 'text-base font-semibold tracking-normal';

  useEffect(() => {
    if (!showMenu && !showNewView) return;

    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && viewBlockRef.current?.contains(target)) return;

      setShowMenu(false);
      setShowNewView(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowMenu(false);
      setShowNewView(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showMenu, showNewView]);

  const addRow = () => {
    commit({ ...view, rows: [...view.rows, view.columns.map(() => '')] });
  };

  const removeRow = (rowIndex: number) => {
    commit({ ...view, rows: view.rows.filter((_, index) => index !== rowIndex) });
  };

  const addColumn = (afterColumnIndex = view.columns.length - 1) => {
    const insertIndex = Math.max(0, afterColumnIndex + 1);
    const nextColumns = [...view.columns];
    nextColumns.splice(insertIndex, 0, `Columna ${view.columns.length + 1}`);

    commit({
      ...view,
      columns: nextColumns,
      rows: visibleRows.map((row) => {
        const nextRow = view.columns.map((_, index) => row[index] || '');
        nextRow.splice(insertIndex, 0, '');
        return nextRow;
      }),
    });
  };

  const removeColumn = (columnIndex: number) => {
    if (view.columns.length <= 1) return;

    commit({
      ...view,
      columns: view.columns.filter((_, index) => index !== columnIndex),
      rows: visibleRows.map((row) =>
        view.columns
          .map((_, index) => row[index] || '')
          .filter((_, index) => index !== columnIndex)
      ),
    });
  };

  const cycleTitleStyle = () => {
    setTitleStyle((current) => (current === 'large' ? 'compact' : 'large'));
    setShowMenu(false);
  };

  const copyView = async () => {
    await navigator.clipboard?.writeText(viewToCsv(view));
    setShowMenu(false);
  };

  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setShowMenu(false);
  };

  const exportCsv = () => {
    const blob = new Blob([viewToCsv(view)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${view.title || getViewLabel(type)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsvRows(String(reader.result || ''));
      if (!rows.length) return;

      const columns = rows[0].map((column, index) => column.trim() || `Columna ${index + 1}`);
      const dataRows = rows.slice(1).map((row) => columns.map((_, index) => row[index] || ''));
      commit({
        ...view,
        columns,
        rows: dataRows.length ? dataRows : [columns.map(() => '')],
      });
      setShowMenu(false);
    };
    reader.readAsText(file);
  };

  const toggleCollapseState = () => {
    setIsCollapsible(true);
    setIsCollapsed((value) => !value);
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 text-sm font-medium text-slate-500">
            {view.columns.map((column, columnIndex) => (
              <th key={columnIndex} className="group/column min-w-[180px] px-2 py-2">
                <div className="flex items-center gap-1">
                  <input
                    value={column}
                    readOnly={readOnly}
                    onChange={(event) =>
                      commit({
                        ...view,
                        columns: view.columns.map((item, index) =>
                          index === columnIndex ? event.target.value : item
                        ),
                      })
                    }
                    className="min-w-0 flex-1 rounded bg-transparent px-1 py-1 font-medium outline-none hover:bg-slate-50 focus:bg-slate-50"
                  />
                  {!readOnly && (
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/column:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => addColumn(columnIndex)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-950"
                        title="Agregar columna"
                        aria-label="Agregar columna"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeColumn(columnIndex)}
                        disabled={view.columns.length <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        title="Eliminar columna"
                        aria-label="Eliminar columna"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </th>
            ))}
            {!readOnly && (
              <th className="w-16 px-1 py-2">
                <button
                  type="button"
                  onClick={() => addColumn()}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-950"
                  title="Agregar columna"
                  aria-label="Agregar columna"
                >
                  <Plus size={15} />
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="group/row border-b border-slate-200">
              {view.columns.map((_, columnIndex) => (
                <td key={`${rowIndex}-${columnIndex}`} className="px-2 py-2 align-top">
                  <input
                    value={row[columnIndex] || ''}
                    readOnly={readOnly}
                    onChange={(event) =>
                      commit(updateCellValue(view, rowIndex, columnIndex, event.target.value))
                    }
                    className="w-full rounded bg-transparent px-1 py-1 text-sm font-medium text-slate-900 outline-none hover:bg-slate-50 focus:bg-slate-50"
                    placeholder="+"
                  />
                </td>
              ))}
              {!readOnly && (
                <td className="w-10 px-1 py-2 align-top">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover/row:opacity-100"
                    title="Eliminar fila"
                    aria-label="Eliminar fila"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <button
          type="button"
          onClick={addRow}
          className="mt-2 flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          title="Agregar fila"
        >
          <Plus size={18} />
        </button>
      )}
    </div>
  );

  const renderCards = () => (
    <div className="grid gap-3 md:grid-cols-2">
      {visibleRows.map((row, rowIndex) => (
        <div key={rowIndex} className="rounded-md border border-slate-200 bg-white p-3">
          {view.columns.map((column, columnIndex) => (
            <label key={columnIndex} className="mb-2 block text-xs font-medium uppercase text-slate-400">
              {column}
              <input
                value={row[columnIndex] || ''}
                readOnly={readOnly}
                onChange={(event) =>
                  commit(updateCellValue(view, rowIndex, columnIndex, event.target.value))
                }
                className="mt-1 w-full rounded bg-slate-50 px-2 py-1.5 text-sm normal-case text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-950"
              />
            </label>
          ))}
        </div>
      ))}
    </div>
  );

  const renderBoard = () => (
    <div className="grid gap-3 md:grid-cols-3">
      {['Pendiente', 'En proceso', 'Listo'].map((status) => (
        <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <p className="mb-2 text-sm font-semibold text-slate-600">{status}</p>
          {visibleRows.map((row, rowIndex) => (
            <div key={rowIndex} className="mb-2 rounded-md border border-slate-200 bg-white p-2 text-sm">
              <input
                value={row[0] || ''}
                readOnly={readOnly}
                onChange={(event) => commit(updateCellValue(view, rowIndex, 0, event.target.value))}
                className="w-full bg-transparent font-medium outline-none"
                placeholder="Nueva tarjeta"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderChart = () => (
    <div className="space-y-3">
      {visibleRows.map((row, rowIndex) => {
        const value = Math.min(100, Math.max(0, Number(row[1]) || 0));
        return (
          <div key={rowIndex} className="grid grid-cols-[120px_1fr_56px] items-center gap-3 text-sm">
            <input
              value={row[0] || ''}
              readOnly={readOnly}
              onChange={(event) => commit(updateCellValue(view, rowIndex, 0, event.target.value))}
              className="rounded bg-transparent px-1 py-1 font-medium outline-none hover:bg-slate-50"
            />
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900" style={{ width: `${value}%` }} />
            </div>
            <input
              value={row[1] || ''}
              readOnly={readOnly}
              onChange={(event) => commit(updateCellValue(view, rowIndex, 1, event.target.value))}
              className="rounded bg-transparent px-1 py-1 text-right outline-none hover:bg-slate-50"
            />
          </div>
        );
      })}
    </div>
  );

  const renderSpecialView = () => {
    if (type === 'view_table') return renderTable();
    if (type === 'view_cards' || type === 'view_detail' || type === 'view_form') return renderCards();
    if (type === 'view_board') return renderBoard();
    if (type === 'view_chart') return renderChart();
    return renderTable();
  };

  return (
    <div
      ref={viewBlockRef}
      className={`relative w-full rounded-md bg-white ${
        isFullscreen ? 'fixed inset-3 z-[150] overflow-auto p-6 shadow-2xl md:inset-8' : ''
      }`}
      onFocus={onFocus}
    >
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importCsv(file);
          event.target.value = '';
        }}
      />
      <div className="mb-2 flex items-center gap-2">
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowMenu((value) => !value)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-950"
            aria-label="Opciones de vista"
          >
            <MoreVertical size={18} />
          </button>
        )}
        {isCollapsible && (
          <button
            type="button"
            onClick={toggleCollapseState}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title={isCollapsed ? 'Expandir contenido' : 'Contraer contenido'}
            aria-label={isCollapsed ? 'Expandir contenido' : 'Contraer contenido'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
        {showTitle && (
          <input
            value={view.title}
            readOnly={readOnly}
            onChange={(event) => commit({ ...view, title: event.target.value })}
            className={`min-w-0 flex-1 bg-transparent text-slate-950 outline-none ${titleClass}`}
            placeholder={getViewLabel(type)}
          />
        )}
        {!showTitle && <div className="min-h-8 flex-1" />}
      </div>

      {showMenu && !readOnly && (
        <div className="absolute left-0 top-10 z-[80] w-[312px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <button
            type="button"
            onClick={() => setShowTitle((value) => !value)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <span className="flex items-center gap-3">
              <Type size={19} className="text-slate-500" />
              Título
            </span>
            <span className={`h-5 w-9 rounded-full p-0.5 ${showTitle ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${showTitle ? 'translate-x-4' : ''}`} />
            </span>
          </button>
          <button
            type="button"
            onClick={cycleTitleStyle}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Type size={19} className="text-slate-500" />
            Estilo de título
          </button>
          <button
            type="button"
            onClick={() => {
              toggleCollapseState();
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            {isCollapsed ? (
              <ChevronDown size={19} className="text-slate-500" />
            ) : (
              <ChevronRight size={19} className="text-slate-500" />
            )}
            {isCollapsed ? 'Desplegar contenido' : 'Colapsar contenido'}
          </button>
          <div className="my-2 border-t border-dashed border-slate-200" />
          <button
            type="button"
            onClick={() => setShowNewView((value) => !value)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Table2 size={19} className="text-slate-500" />
            Añadir vista
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFullscreen((value) => !value);
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Expand size={19} className="text-slate-500" />
            {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          </button>
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <FileInput size={19} className="text-slate-500" />
            Importar CSV
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Download size={19} className="text-slate-500" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={copyView}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Copy size={19} className="text-slate-500" />
            Copiar
          </button>
          <div className="my-2 border-t border-dashed border-slate-200" />
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Link size={19} className="text-slate-500" />
            Copiar link
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={19} />
            Eliminar
          </button>
        </div>
      )}

      {showNewView && !readOnly && (
        <div className="absolute left-[320px] top-24 z-[90]">
          <NewViewPicker
            onSelect={(selectedType) => {
              onAddView(selectedType);
              setShowNewView(false);
              setShowMenu(false);
            }}
          />
        </div>
      )}

      {!isCollapsed && renderSpecialView()}
    </div>
  );
};
