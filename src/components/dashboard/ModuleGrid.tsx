import { DocCard } from './DocCard';
import type { Page } from '../type/typeScript';

export const ModuleGrid = ({ docs }: { docs: Page[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map(doc => (
        <DocCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
};