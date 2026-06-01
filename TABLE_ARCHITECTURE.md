# Arquitectura de Tabla Dinámica Avanzada

## 📋 Descripción General

La tabla dinámica es un componente modular de **bloques independientes** dentro de la aplicación de notas. Implementa:

- ✅ Gestión normalizada de datos con tipos de columna
- ✅ Edición inline con componentes especializados por tipo
- ✅ Drag & Drop horizontal (columnas) y vertical (filas)
- ✅ Estado global con Zustand para rendimiento
- ✅ Componentes memorizados para eficiencia

---

## 📁 Estructura de Archivos

```
src/components/editor/
├── tableTypes.ts              # Tipos TypeScript optimizados
├── tableStore.ts              # Zustand store para estado global
├── TableBlock.tsx             # Componente principal (integrador)
├── TableBlockHeader.tsx       # Encabezado con acciones
├── TableColumnHeader.tsx      # Encabezado de columna con DnD
├── TableCell/
│   ├── index.tsx              # Router de tipos de celda
│   └── CellTypes.tsx          # Componentes de celda por tipo
├── TableRow.tsx               # Fila individual con DnD
├── TableRowList.tsx           # Lista de filas con DnD vertical
└── ViewBlock.tsx              # Wrapper que usa TableBlock para view_table
```

---

## 🗂️ Esquema de Datos

### Tipos Principales

```typescript
// Tipo de columna
type TableColumnType = 'text' | 'number' | 'checkbox' | 'select' | 'date';

// Definición de columna
interface TableColumn {
  id: string;              // UUID único
  title: string;           // Nombre de columna
  type: TableColumnType;   // Tipo de dato
  width?: number;          // Ancho en píxeles (default 280)
  options?: string[];      // Para select
  isRequired?: boolean;
  sortable?: boolean;
}

// Datos de una fila
type TableRowData = Record<string, string | number | boolean | null>;

// Definición de fila
interface TableRow {
  id: string;              // UUID único
  data: TableRowData;      // { [columnId]: value }
  createdAt?: string;
  updatedAt?: string;
}

// Contenido completo de tabla
interface TableBlockContent {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  meta?: {
    createdAt?: string;
    updatedAt?: string;
  };
}
```

### Ventajas del Esquema Normalizado

- **Filas como objetos**: Facilita insertar/eliminar columnas sin afectar estructura
- **IDs únicos**: Permite reordenamiento seguro
- **Tipos específicos**: Cada tipo de columna maneja su edición inline
- **Escalabilidad**: Fácil agregar tipos nuevos sin romper existentes

---

## 🎮 Zustand Store

### Funcionalidades

```typescript
interface TableStoreState {
  // Estado
  content: TableBlockContent;
  setContent: (next: TableBlockContent) => void;

  // Celdas
  updateCell: (rowId: string, columnId: string, value: any) => void;

  // Filas
  addRow: (afterRowId?: string) => void;
  removeRow: (rowId: string) => void;
  reorderRows: (newRowIds: string[]) => void;

  // Columnas
  addColumn: (afterColumnId?: string) => void;
  removeColumn: (columnId: string) => void;
  updateColumn: (columnId: string, updates: Partial<TableColumn>) => void;
  reorderColumns: (newColumnIds: string[]) => void;

  // Utilidades
  reset: (initialContent: TableBlockContent) => void;
}
```

### Ventajas

- ✅ Actualizaciones granulares: editar una celda solo afecta esa fila
- ✅ No re-renderiza toda la tabla: componentes memorizados
- ✅ Persistencia automática: cambios se sincronizan al padre
- ✅ Acceso global: evita prop drilling

---

## 🧩 Componentes Principales

### `TableBlock` (Principal)
- Renderiza la tabla completa
- Integra TableColumnHeader con DnD horizontal
- Integra TableRowList con DnD vertical
- Parsea y migra formato antiguo automáticamente
- **Soporte backward compatibility**: detecta y migra arrays de strings

### `TableBlockHeader`
- Mostrar/editar título de tabla
- Botones: "+ Columna", "+ Fila"
- Menú: Duplicar, Eliminar

### `TableColumnHeader`
- DnD horizontal (useSortable)
- Renombrar columna inline
- Cambiar tipo con dropdown
- Eliminar columna con confirmación

### `TableCell` (React.memo)
- Router que elige el componente correcto según `column.type`
- Tipos soportados:
  - **TextCell**: Input de texto
  - **NumberCell**: Input numérico
  - **CheckboxCell**: Toggle checkbox
  - **SelectCell**: Dropdown con opciones
  - **DateCell**: Input de fecha con datepicker

### `TableRow` (React.memo)
- DnD vertical (useSortable)
- Renderiza celdas memoizadas
- Botón de eliminar fila
- Manejo de drag state visual

### `TableRowList`
- Contenedor de DnD vertical (DndContext + SortableContext)
- Soporta inserción de filas entre existentes
- Manejo de reorden con feedback visual

---

## 🚀 Drag & Drop

### Horizontal (Columnas)
```typescript
// En TableBlock.tsx
<DndContext onDragEnd={handleColumnDragEnd}>
  <SortableContext 
    items={columnIds} 
    strategy={horizontalListSortingStrategy}
  >
    {/* TableColumnHeader con useSortable */}
  </SortableContext>
</DndContext>
```

### Vertical (Filas)
```typescript
// En TableRowList.tsx
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext 
    items={rowIds} 
    strategy={verticalListSortingStrategy}
  >
    {/* TableRow con useSortable */}
  </SortableContext>
</DndContext>
```

---

## 📊 Rendimiento

### Optimizaciones Implementadas

1. **React.memo en componentes de celda**
   ```typescript
   const TableCell = React.memo(function TableCell(...) { ... });
   ```

2. **Zustand: actualizaciones granulares**
   ```typescript
   updateCell: (rowId, columnId, value) => 
     // Solo actualiza la fila específica
   ```

3. **useCallback estable para handlers**
   ```typescript
   const handleDragEnd = useCallback((event) => { ... }, [rowIds]);
   ```

4. **Key estable basada en IDs**
   ```typescript
   {rows.map((row) => (
     <TableRowComponent key={row.id} ... />
   ))}
   ```

### Resultado
- Editar una celda: solo re-renderiza esa celda
- Agregar fila: no re-renderiza las existentes
- Reordenar columnas: actualización eficiente

---

## 🔄 Backward Compatibility

### Migración Automática

Si una tabla antigua (formato array de strings) es cargada:

```typescript
// Formato antiguo
{ 
  columns: ["Nombre", "Email", "Teléfono"],
  rows: [["Juan", "juan@x.com", "123"], ["María", "maria@x.com", "456"]]
}

// Se convierte automáticamente a:
{
  columns: [
    { id: "col_1", title: "Nombre", type: "text", width: 280 },
    { id: "col_2", title: "Email", type: "text", width: 280 },
    { id: "col_3", title: "Teléfono", type: "text", width: 280 }
  ],
  rows: [
    { id: "row_1", data: { col_1: "Juan", col_2: "juan@x.com", col_3: "123" } },
    { id: "row_2", data: { col_1: "María", col_2: "maria@x.com", col_3: "456" } }
  ]
}
```

---

## 📝 Ejemplo de Uso

### En ViewBlock.tsx

```typescript
<TableBlock
  type="view_table"
  content={content}
  onUpdate={onUpdate}
  onDuplicate={copyView}
  onRemove={onRemove}
  readOnly={false}
/>
```

### Dentro de un componente

```typescript
import { useTableStore } from './tableStore';

function MiComponente() {
  const { updateCell, addRow, removeColumn } = useTableStore();

  return (
    <button onClick={() => {
      updateCell('row_1', 'col_1', 'nuevo valor');
      addRow();
      removeColumn('col_2');
    }}>
      Realizar acciones
    </button>
  );
}
```

---

## 🎯 Características Implementadas

- ✅ Arquitectura de bloque independiente
- ✅ Gestión de columnas: crear, renombrar, eliminar, reordenar (DnD)
- ✅ Gestión de filas: crear, eliminar, reordenar (DnD)
- ✅ Edición inline con tipos especializados
- ✅ 5 tipos de columna: texto, número, checkbox, select, fecha
- ✅ Rendimiento optimizado con memoización
- ✅ Estado global con Zustand
- ✅ DnD con @dnd-kit (horizontal + vertical)
- ✅ Migración automática de formato antiguo
- ✅ ReadOnly mode
- ✅ Persistencia sincronizada al padre

---

## 🔮 Próximas Mejoras Posibles

1. **Sorting**: Ordenar por columna (numérico, alfabético, fecha)
2. **Filtering**: Filtrar por valores o rangos
3. **Búsqueda**: Find & Replace dentro de la tabla
4. **Más tipos**: Multiselect, color picker, usuario, relacionales
5. **Agrupación**: Agrupar filas por columna
6. **Paginación**: Para tablas grandes
7. **Exportación**: CSV, JSON, Excel
8. **Validación**: Reglas custom por tipo
9. **Fórmulas**: Columnas calculadas
10. **Historial**: Undo/Redo

---

## 📚 Dependencias Utilizadas

- **React**: Componentes y hooks
- **TypeScript**: Tipado fuerte
- **Zustand**: Gestión de estado (5.0.12)
- **@dnd-kit/core**: Drag & Drop base
- **@dnd-kit/sortable**: Ordenamiento
- **@dnd-kit/utilities**: Utilidades DnD
- **@dnd-kit/modifiers**: Modificadores de DnD
- **Tailwind CSS**: Estilos
- **Lucide React**: Iconos
