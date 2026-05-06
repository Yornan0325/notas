import { useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';

interface IconOption {
  icon: string;
  label: string;
  keywords: string;
}

const iconOptions: IconOption[] = [
  { icon: '📄', label: 'Documento', keywords: 'documento pagina archivo' },
  { icon: '📝', label: 'Notas', keywords: 'nota escribir pendientes' },
  { icon: '✅', label: 'Pendientes', keywords: 'pendientes tareas checklist' },
  { icon: '📘', label: 'Orden', keywords: 'orden libro guia manual' },
  { icon: '🧠', label: 'Ideas', keywords: 'ideas cerebro pensar' },
  { icon: '🧰', label: 'Herramientas', keywords: 'herramientas toolbox trabajo' },
  { icon: '⚙️', label: 'Sistema', keywords: 'sistema configuracion engranaje' },
  { icon: '🧪', label: 'Pruebas', keywords: 'pruebas laboratorio test' },
  { icon: '💧', label: 'Agua', keywords: 'agua nivel sensor liquido' },
  { icon: '🌡️', label: 'Temperatura', keywords: 'temperatura sensor clima' },
  { icon: '🔌', label: 'Electronica', keywords: 'electronica cable energia' },
  { icon: '📟', label: 'Modulo', keywords: 'modulo placa dispositivo' },
  { icon: '🍓', label: 'Raspberry', keywords: 'raspberry pi placa' },
  { icon: '🤖', label: 'Robotica', keywords: 'robot automatizacion' },
  { icon: '📡', label: 'Sensor', keywords: 'sensor senal medicion' },
  { icon: '📊', label: 'Datos', keywords: 'datos graficas tabla' },
  { icon: '📦', label: 'Inventario', keywords: 'inventario caja elementos' },
  { icon: '🏗️', label: 'Proyecto', keywords: 'proyecto construccion obra' },
  { icon: '🚀', label: 'Lanzamiento', keywords: 'lanzamiento avance inicio' },
  { icon: '🔒', label: 'Privado', keywords: 'privado seguridad candado' },
  { icon: '⭐', label: 'Favorito', keywords: 'favorito estrella importante' },
  { icon: '🚨', label: 'Alerta', keywords: 'alerta alarma emergencia' },
  { icon: '📍', label: 'Ubicacion', keywords: 'ubicacion pin lugar' },
  { icon: '🏠', label: 'Casa', keywords: 'casa hogar' },
  { icon: '🏭', label: 'Planta', keywords: 'planta fabrica industria' },
  { icon: '🧲', label: 'Magnetico', keywords: 'magnetico iman sensor' },
  { icon: '🪫', label: 'Bateria baja', keywords: 'bateria energia baja' },
  { icon: '🔋', label: 'Bateria', keywords: 'bateria energia carga' },
  { icon: '🖥️', label: 'Pantalla', keywords: 'pantalla lcd monitor' },
  { icon: '📷', label: 'Camara', keywords: 'camara foto imagen' },
  { icon: '🗂️', label: 'Coleccion', keywords: 'coleccion carpeta archivo' },
  { icon: '🔵', label: 'Azul', keywords: 'azul circulo color' },
  { icon: '🟢', label: 'Verde', keywords: 'verde circulo color' },
  { icon: '🟡', label: 'Amarillo', keywords: 'amarillo circulo color' },
  { icon: '🔴', label: 'Rojo', keywords: 'rojo circulo color' },
];

export const PageIconPicker = ({
  value,
  onSelect,
}: {
  value?: string;
  onSelect: (icon: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredIcons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return iconOptions;

    return iconOptions.filter((option) =>
      `${option.label} ${option.keywords}`.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);
  const displayedIcon = value && !/[ÃÂð�]/.test(value) ? value : '📄';

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-base transition-colors hover:bg-white hover:shadow-sm"
        title="Cambiar icono"
      >
        {displayedIcon}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-9 z-[80] w-72 rounded-md border border-slate-200 bg-white p-3 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <Input
            autoFocus
            icon={<Search size={15} />}
            placeholder="Buscar icono..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-8"
          />

          <div className="mt-3 grid max-h-64 grid-cols-7 gap-1 overflow-y-auto pr-1">
            {filteredIcons.map((option) => (
              <button
                key={`${option.icon}-${option.label}`}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelect(option.icon);
                  setIsOpen(false);
                  setQuery('');
                }}
                title={option.label}
                className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors hover:bg-slate-100 ${
                  value === option.icon ? 'bg-slate-100 ring-1 ring-slate-300' : ''
                }`}
              >
                {option.icon}
              </button>
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">No hay iconos para esa busqueda.</p>
          )}
        </div>
      )}
    </div>
  );
};
