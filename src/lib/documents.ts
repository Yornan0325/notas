import type { Page } from '../components/type/typeScript';

export const getDocumentRoots = (pages: Page[]) => {
  const groupedByDoc = new Map<string, Page[]>();

  pages.forEach((page) => {
    const docPages = groupedByDoc.get(page.docId) || [];
    docPages.push(page);
    groupedByDoc.set(page.docId, docPages);
  });

  return Array.from(groupedByDoc.values())
    .map((docPages) => {
      const explicitRoot = docPages.find((page) => page.isDocumentRoot);
      if (explicitRoot) return explicitRoot;

      return docPages
        .filter((page) => !page.parentId)
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))[0];
    })
    .filter((page): page is Page => Boolean(page));
};

export const getDocumentRoot = (pages: Page[], docId?: string) =>
  getDocumentRoots(pages).find((page) => page.docId === docId);

export const isInternalRootPage = (page: Page) => !page.parentId && !page.isDocumentRoot;
