import { Folder } from 'lucide-react';
import { getProjectNames } from '../../lib/projects';
import { useCodaStore } from '../../store/useCodaStore';
import type { Page } from '../type/typeScript';

export const ProjectSelect = ({ doc, docs }: { doc: Page; docs: Page[] }) => {
  const { addProjectFolder, projectFolders, updatePageProject } = useCodaStore();
  const projectNames = getProjectNames(docs, projectFolders);
  const value = doc.projectName || '';

  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <Folder size={14} className="shrink-0" />
      <select
        value={value}
        onChange={(event) => {
          const selected = event.target.value;
          if (selected === '__new__') {
            const nextName = window.prompt('Nombre de la carpeta');
            if (nextName) addProjectFolder(nextName);
            updatePageProject(doc.id, nextName || undefined);
            return;
          }

          updatePageProject(doc.id, selected || undefined);
        }}
        className="h-8 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
      >
        <option value="">Sin carpeta</option>
        {projectNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value="__new__">Nueva carpeta...</option>
      </select>
    </label>
  );
};
