import { memo, useEffect, useMemo, useState } from 'react';
import type { DynamicCellRendererProps } from './cellFactory';

const isCheckedValue = (value: string) => value === 'true' || value === '1' || value === 'yes';

export const DynamicTextCellRenderer = memo(function DynamicTextCellRenderer({
  value,
  readOnly,
  onCommit,
}: DynamicCellRendererProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitIfChanged = () => {
    if (draft !== value) onCommit(draft);
  };

  return (
    <input
      value={draft}
      readOnly={readOnly}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commitIfChanged}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      className="view-cell-input w-full bg-transparent px-0 py-0 text-sm text-slate-800 outline-none ring-0 focus:outline-none focus:ring-0 dark:text-slate-200"
      placeholder="-"
    />
  );
});

export const DynamicSelectCellRenderer = memo(function DynamicSelectCellRenderer({
  value,
  readOnly,
  onCommit,
  column,
}: DynamicCellRendererProps) {
  const options = useMemo(() => column.options ?? [], [column.options]);
  const currentValue = options.includes(value) ? value : '';

  return (
    <select
      value={currentValue}
      disabled={readOnly}
      onChange={(event) => onCommit(event.target.value)}
      className="view-cell-input w-full bg-transparent px-0 py-0 text-sm text-slate-800 outline-none ring-0 focus:outline-none focus:ring-0 disabled:cursor-default dark:text-slate-200"
    >
      <option value="">Seleccionar...</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
});

export const DynamicCheckboxCellRenderer = memo(function DynamicCheckboxCellRenderer({
  value,
  readOnly,
  onCommit,
}: DynamicCellRendererProps) {
  return (
    <label className="flex w-full items-center justify-center py-0.5">
      <input
        type="checkbox"
        checked={isCheckedValue(value)}
        disabled={readOnly}
        onChange={(event) => onCommit(event.target.checked ? 'true' : '')}
        className="h-4 w-4 cursor-pointer rounded border-slate-300 bg-transparent"
      />
    </label>
  );
});

