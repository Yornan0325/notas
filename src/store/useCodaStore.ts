import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Block, Page } from '../components/type/typeScript';

 

 

interface CodaState {
  blocks: Block[];
  pages: Page[];
  // Acciones de Bloques
  addBlock: (type: Block['type'], pageId: string) => string;
  updateBlock: (id: string, content: string) => void;
  setBlocks: (blocks: Block[]) => void;
  updateBlockType: (id: string, type: Block['type']) => void;
  changeBlockType: (id: string, newType: Block['type']) => void;
  markAsSynced: (ids: string[]) => void;
  removeBlock: (id: string) => void;
  // Acciones de Páginas (Añadida a la interfaz)
  addPage: (docId: string, parentId?: string | null, title?: string) => void;
  updatePageTitle: (id: string, title: string) => void; // Útil para el futuro
  removePage: (id: string) => void;
  removeDocument: (docId: string) => void;
}

export const useCodaStore = create<CodaState>()(
  persist(
    (set) => ({
      blocks: [],
      pages: [],

      // --- Gestión de Páginas ---
      addPage: (docId, parentId = null, title = 'Nueva página') =>
        set((state) => ({
          pages: [
            ...state.pages,
            {
              id: crypto.randomUUID(),
              title,
              parentId: parentId || null,
              docId,
            },
          ],
        })),

      updatePageTitle: (id, title) =>
        set((state) => ({
          pages: state.pages.map((p) => (p.id === id ? { ...p, title } : p)),
        })),

      removePage: (id) =>
        set((state) => ({
          pages: state.pages.filter((p) => p.id !== id),
          blocks: state.blocks.filter((b) => b.pageId !== id),
        })),

      removeDocument: (docId) =>
        set((state) => {
          const pagesToDelete = state.pages.filter((p) => p.docId === docId);
          const pageIdsToDelete = pagesToDelete.map((p) => p.id);
          return {
            pages: state.pages.filter((p) => p.docId !== docId),
            blocks: state.blocks.filter((b) => !pageIdsToDelete.includes(b.pageId)),
          };
        }),

      // --- Gestión de Bloques ---
      addBlock: (type, pageId) => {
        const id = crypto.randomUUID();
        set((state) => ({
          blocks: [
            ...state.blocks,
            { id, type, content: '', synced: false, pageId },
          ],
        }));
        return id;
      },

      updateBlock: (id, content) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id ? { ...b, content, synced: false } : b
          ),
        })),

      updateBlockType: (id, type) =>
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, type } : b)),
        })),

      changeBlockType: (id, newType) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id ? { ...b, type: newType } : b
          ),
        })),

      markAsSynced: (ids) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            ids.includes(b.id) ? { ...b, synced: true } : b
          ),
        })),

      removeBlock: (id) =>
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== id),
        })),

      setBlocks: (blocks) => set({ blocks }),
    }),
    { 
      name: 'coda-storage',
      // Opcional: puedes elegir qué guardar y qué no
    }
  )
);