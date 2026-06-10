import type { DynamicTableCellType, DynamicTableColumn } from './types';
import type { ReactElement } from 'react';
import {
  DynamicCheckboxCellRenderer,
  DynamicSelectCellRenderer,
  DynamicTextCellRenderer,
} from './CellRenderers';

export type DynamicCellRendererProps = {
  value: string;
  column: DynamicTableColumn;
  readOnly: boolean;
  onCommit: (nextValue: string) => void;
};

const CELL_RENDERER_FACTORY: Record<
  DynamicTableCellType,
  (props: DynamicCellRendererProps) => ReactElement
> = {
  text: (props) => <DynamicTextCellRenderer {...props} />,
  select: (props) => <DynamicSelectCellRenderer {...props} />,
  checkbox: (props) => <DynamicCheckboxCellRenderer {...props} />,
};

export const renderDynamicTableCell = (
  type: DynamicTableCellType,
  props: DynamicCellRendererProps
) => {
  const renderer = CELL_RENDERER_FACTORY[type] ?? CELL_RENDERER_FACTORY.text;
  return renderer(props);
};
