import { DocCard } from './DocCard';
import type { Page } from '../type/typeScript';

export const ModuleGrid = ({ docs }: { docs: Page[] }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {docs.map(doc => (
        <DocCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
};
