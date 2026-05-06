import type { Page } from '../components/type/typeScript';

export const UNASSIGNED_PROJECT = 'Sin carpeta';

export const normalizeProjectName = (value: string) => value.trim();

export const getProjectNames = (docs: Page[], folderNames: string[] = []) =>
  Array.from(
    new Set(
      [
        ...folderNames,
        ...docs
        .map((doc) => normalizeProjectName(doc.projectName || ''))
      ]
        .map(normalizeProjectName)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

export const groupDocsByProject = (docs: Page[], folderNames: string[] = []) => {
  const groups = new Map<string, Page[]>();

  folderNames.forEach((folderName) => {
    const normalizedName = normalizeProjectName(folderName);
    if (normalizedName) groups.set(normalizedName, []);
  });

  docs.forEach((doc) => {
    const projectName = normalizeProjectName(doc.projectName || '') || UNASSIGNED_PROJECT;
    const items = groups.get(projectName) || [];
    items.push(doc);
    groups.set(projectName, items);
  });

  return Array.from(groups.entries())
    .map(([name, items]) => ({
      name,
      docs: items.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      }),
    }))
    .sort((a, b) => {
      if (a.name === UNASSIGNED_PROJECT) return 1;
      if (b.name === UNASSIGNED_PROJECT) return -1;
      return a.name.localeCompare(b.name);
    });
};
