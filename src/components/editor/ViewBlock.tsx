import { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Expand,
  FileInput,
  Link,
  MoreVertical,
  Plus,
  RotateCcw,
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
) => ({
  ...view,
  rows: view.rows.map((row, currentRowIndex) =>
    currentRowIndex === rowIndex
      ? view.columns.map((_, currentColumnIndex) =>
          currentColumnIndex === columnIndex ? value : row[currentColumnIndex] || ''
        )
      : row
  ),
});

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
  const view = useMemo(() => parseViewContent(type, content), [content, type]);

  const commit = (nextView: ViewBlockContent) => onUpdate(stringifyViewContent(nextView));
  const visibleRows = view.rows.length ? view.rows : [['', '', '']];

  const addRow = () => {
    commit({ ...view, rows: [...view.rows, view.columns.map(() => '')] });
  };

  const removeRow = (rowIndex: number) => {
    commit({ ...view, rows: view.rows.filter((_, index) => index !== rowIndex) });
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 text-sm font-medium text-slate-500">
            {view.columns.map((column, columnIndex) => (
              <th key={columnIndex} className="min-w-[180px] px-2 py-2">
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
                  className="w-full rounded bg-transparent px-1 py-1 font-medium outline-none hover:bg-slate-50 focus:bg-slate-50"
                />
              </th>
            ))}
            {!readOnly && <th className="w-10" />}
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
    <div className="relative w-full rounded-md bg-white" onFocus={onFocus}>
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
        <input
          value={view.title}
          readOnly={readOnly}
          onChange={(event) => commit({ ...view, title: event.target.value })}
          className="min-w-0 flex-1 bg-transparent text-3xl font-bold tracking-tight text-slate-950 outline-none"
          placeholder={getViewLabel(type)}
        />
      </div>

      {showMenu && !readOnly && (
        <div className="absolute left-0 top-10 z-[80] w-[312px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700">
            <span className="flex items-center gap-3">
              <Type size={19} className="text-slate-500" />
              Title
            </span>
            <span className="h-5 w-9 rounded-full bg-blue-600 p-0.5">
              <span className="block h-4 w-4 translate-x-4 rounded-full bg-white" />
            </span>
          </div>
          <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <Type size={19} className="text-slate-500" />
            Title style
          </button>
          <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <RotateCcw size={19} className="text-slate-500" />
            Collapse content
          </button>
          <div className="my-2 border-t border-dashed border-slate-200" />
          <button
            type="button"
            onClick={() => setShowNewView((value) => !value)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Table2 size={19} className="text-slate-500" />
            Add view
          </button>
          <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <Expand size={19} className="text-slate-500" />
            Enter full screen
          </button>
          <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <FileInput size={19} className="text-slate-500" />
            Import CSV
          </button>
          <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <Download size={19} className="text-slate-500" />
            Export CSV
          </button>
          <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <Copy size={19} className="text-slate-500" />
            Copy
          </button>
          <div className="my-2 border-t border-dashed border-slate-200" />
          <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <Link size={19} className="text-slate-500" />
            Copy link
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={19} />
            Delete
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

      {renderSpecialView()}
    </div>
  );
};
