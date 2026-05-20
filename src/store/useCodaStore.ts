import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Block,
  Page,
  ShareInvite,
  SharePermission,
  ShareTargetType,
} from '../components/type/typeScript';

interface CodaState {
  blocks: Block[];
  pages: Page[];
  shares: ShareInvite[];
  projectFolders: string[];
  addBlock: (type: Block['type'], pageId: string, afterBlockId?: string) => string;
  addBlockAtStart: (type: Block['type'], pageId: string) => string;
  updateBlock: (id: string, content: string) => void;
  updateBlockAttachment: (id: string, content: string, path: string, name: string) => void;
  updateImageLayout: (
    id: string,
    layout: Pick<Block, 'imageWidth' | 'imageAlign' | 'imageFlow'>
  ) => void;
  moveBlock: (
    id: string,
    targetId: string,
    placement: 'before' | 'after' | 'beside'
  ) => void;
  setBlocks: (blocks: Block[]) => void;
  setPages: (pages: Page[]) => void;
  updateBlockType: (id: string, type: Block['type']) => void;
  changeBlockType: (id: string, newType: Block['type']) => void;
  toggleBlockAccordion: (id: string) => void;
  toggleBlockCollapsed: (id: string) => void;
  toggleBlockFavorite: (id: string) => void;
  setBlockActivityStatus: (id: string, status?: Block['activityStatus']) => void;
  markAsSynced: (ids: string[]) => void;
  markPagesAsSynced: (ids: string[]) => void;
  removeBlock: (id: string) => void;
  addPage: (
    docId: string,
    parentId?: string | null,
    title?: string,
    options?: { isDocumentRoot?: boolean }
  ) => string;
  duplicatePage: (id: string) => string | null;
  updatePageTitle: (id: string, title: string) => void;
  updatePageIcon: (id: string, icon: string) => void;
  updatePageProject: (id: string, projectName?: string) => void;
  togglePageFavorite: (id: string) => void;
  removePage: (id: string) => void;
  removeDocument: (docId: string) => void;
  addShare: (share: {
    targetType: ShareTargetType;
    targetId: string;
    docId: string;
    title: string;
    email: string;
    permission: SharePermission;
  }) => ShareInvite;
  updateSharePermission: (id: string, permission: SharePermission) => void;
  removeShare: (id: string) => void;
  markSharesAsSynced: (ids: string[]) => void;
  setShares: (shares: ShareInvite[]) => void;
  addProjectFolder: (name: string) => void;
  renameProjectFolder: (currentName: string, nextName: string) => void;
  removeProjectFolder: (name: string) => void;
  clearWorkspace: () => void;
}

const now = () => new Date().toISOString();

const getOrderedPageBlocks = (blocks: Block[], pageId: string) =>
  blocks
    .map((block, index) => ({ block, index }))
    .filter((item) => item.block.pageId === pageId)
    .sort((a, b) => {
      const orderA = a.block.blockOrder ?? a.index;
      const orderB = b.block.blockOrder ?? b.index;
      return orderA === orderB ? a.index - b.index : orderA - orderB;
    })
    .map((item) => item.block);

const rebuildBlocksForPage = (
  blocks: Block[],
  pageId: string,
  orderedPageBlocks: Block[],
  markUnsynced = true
) => {
  const normalizedPageBlocks = orderedPageBlocks.map((block, index) => ({
    ...block,
    blockOrder: index,
    synced: markUnsynced ? false : block.synced,
  }));
  const firstPageBlockIndex = blocks.findIndex((block) => block.pageId === pageId);
  const blocksWithoutPage = blocks.filter((block) => block.pageId !== pageId);

  if (firstPageBlockIndex === -1) {
    return [...blocksWithoutPage, ...normalizedPageBlocks];
  }

  return [
    ...blocksWithoutPage.slice(0, firstPageBlockIndex),
    ...normalizedPageBlocks,
    ...blocksWithoutPage.slice(firstPageBlockIndex),
  ];
};

const normalizeLoadedBlocks = (blocks: Block[]) => {
  const pageIds = Array.from(new Set(blocks.map((block) => block.pageId)));
  let nextBlocks = [...blocks];

  pageIds.forEach((pageId) => {
    const orderedPageBlocks = getOrderedPageBlocks(nextBlocks, pageId);
    const normalizedPageBlocks = orderedPageBlocks.map((block, index) => ({
      ...block,
      blockOrder: index,
      synced: block.blockOrder === index ? block.synced : false,
    }));

    nextBlocks = rebuildBlocksForPage(nextBlocks, pageId, normalizedPageBlocks, false);
  });

  return nextBlocks;
};

const collectPageTreeIds = (pages: Page[], rootId: string) => {
  const ids = new Set<string>([rootId]);
  let didAdd = true;

  while (didAdd) {
    didAdd = false;
    pages.forEach((page) => {
      if (page.parentId && ids.has(page.parentId) && !ids.has(page.id)) {
        ids.add(page.id);
        didAdd = true;
      }
    });
  }

  return ids;
};

export const useCodaStore = create<CodaState>()(
  persist(
    (set) => ({
      blocks: [],
      pages: [],
      shares: [],
      projectFolders: [],

      addPage: (docId, parentId = null, title = 'Nueva pagina', options) => {
        const id = crypto.randomUUID();
        const timestamp = now();

        set((state) => {
          const existingPage = state.pages.find(p => p.docId === docId);
          const ownerWorkspaceId = existingPage?.ownerWorkspaceId;
          
          return {
            pages: [
              ...state.pages,
              {
                id,
                title,
                parentId: parentId || null,
                docId,
                icon: options?.isDocumentRoot ? '📄' : '📝',
                isDocumentRoot: Boolean(options?.isDocumentRoot),
                createdAt: timestamp,
                updatedAt: timestamp,
                synced: false,
                ownerWorkspaceId,
              },
            ],
          };
        });

        return id;
      },

      duplicatePage: (id) => {
        let duplicatedRootId: string | null = null;

        set((state) => {
          const sourceRoot = state.pages.find((page) => page.id === id);
          if (!sourceRoot) return state;

          const sourceIds = collectPageTreeIds(state.pages, id);
          const sourcePages = state.pages.filter((page) => sourceIds.has(page.id));
          const idMap = new Map<string, string>();
          const timestamp = now();

          sourcePages.forEach((page) => idMap.set(page.id, crypto.randomUUID()));
          duplicatedRootId = idMap.get(id) || null;

          const duplicatedPages = sourcePages.map((page) => ({
            ...page,
            id: idMap.get(page.id) || crypto.randomUUID(),
            title: page.id === id ? `${page.title} copia` : page.title,
            parentId: page.parentId && sourceIds.has(page.parentId)
              ? idMap.get(page.parentId) || null
              : sourceRoot.parentId,
            createdAt: timestamp,
            updatedAt: timestamp,
            synced: false,
          }));

          const duplicatedBlocks = state.blocks
            .filter((block) => sourceIds.has(block.pageId))
            .map((block) => ({
              ...block,
              id: crypto.randomUUID(),
              pageId: idMap.get(block.pageId) || block.pageId,
              synced: false,
            }));

          return {
            pages: [...state.pages, ...duplicatedPages],
            blocks: [...state.blocks, ...duplicatedBlocks],
          };
        });

        return duplicatedRootId;
      },

      updatePageTitle: (id, title) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id ? { ...page, title, updatedAt: now(), synced: false } : page
          ),
        })),

      updatePageIcon: (id, icon) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id ? { ...page, icon, updatedAt: now(), synced: false } : page
          ),
        })),

      updatePageProject: (id, projectName) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id
              ? {
                  ...page,
                  projectName: projectName?.trim() || undefined,
                  updatedAt: now(),
                  synced: false,
                }
              : page
          ),
        })),

      togglePageFavorite: (id) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id ? { ...page, isFavorite: !page.isFavorite, updatedAt: now(), synced: false } : page
          ),
        })),

      removePage: (id) =>
        set((state) => {
          const pageIdsToDelete = collectPageTreeIds(state.pages, id);

          return {
            pages: state.pages.filter((page) => !pageIdsToDelete.has(page.id)),
            blocks: state.blocks.filter((block) => !pageIdsToDelete.has(block.pageId)),
            shares: state.shares.filter((share) => !pageIdsToDelete.has(share.targetId)),
          };
        }),

      removeDocument: (docId) =>
        set((state) => {
          const pageIdsToDelete = new Set(
            state.pages.filter((page) => page.docId === docId).map((page) => page.id)
          );

          return {
            pages: state.pages.filter((page) => page.docId !== docId),
            blocks: state.blocks.filter((block) => !pageIdsToDelete.has(block.pageId)),
            shares: state.shares.filter((share) => share.docId !== docId),
          };
        }),

      addBlock: (type, pageId, afterBlockId) => {
        const id = crypto.randomUUID();

        set((state) => {
          const page = state.pages.find(p => p.id === pageId);
          const timestamp = now();
          const newBlock: Block = { 
            id, 
            type, 
            content: '', 
            synced: false, 
            pageId,
            createdAt: timestamp,
            updatedAt: timestamp,
            ownerWorkspaceId: page?.ownerWorkspaceId
          };
          const pageBlocks = getOrderedPageBlocks(state.blocks, pageId);
          const insertAtPageIndex = afterBlockId
            ? pageBlocks.findIndex((block) => block.id === afterBlockId) + 1
            : pageBlocks.length;
          const nextPageBlocks = [...pageBlocks];
          nextPageBlocks.splice(Math.max(0, insertAtPageIndex), 0, newBlock);

          return {
            blocks: rebuildBlocksForPage(state.blocks, pageId, nextPageBlocks),
            pages: state.pages.map((page) =>
              page.id === pageId ? { ...page, updatedAt: now(), synced: false } : page
            ),
          };
        });

        return id;
      },

      addBlockAtStart: (type, pageId) => {
        const id = crypto.randomUUID();

        set((state) => {
          const page = state.pages.find((item) => item.id === pageId);
          const timestamp = now();
          const newBlock: Block = {
            id,
            type,
            content: '',
            synced: false,
            pageId,
            createdAt: timestamp,
            updatedAt: timestamp,
            ownerWorkspaceId: page?.ownerWorkspaceId,
          };
          const pageBlocks = getOrderedPageBlocks(state.blocks, pageId);

          return {
            blocks: rebuildBlocksForPage(state.blocks, pageId, [newBlock, ...pageBlocks]),
            pages: state.pages.map((item) =>
              item.id === pageId ? { ...item, updatedAt: now(), synced: false } : item
            ),
          };
        });

        return id;
      },

      updateBlock: (id, content) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, content, synced: false } : block
          ),
          pages: state.pages.map((page) =>
            state.blocks.some((block) => block.id === id && block.pageId === page.id)
              ? { ...page, updatedAt: now(), synced: false }
              : page
          ),
        })),

      updateBlockAttachment: (id, content, path, name) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  content,
                  attachmentPath: path,
                  attachmentName: name,
                  synced: false,
                }
              : block
          ),
          pages: state.pages.map((page) =>
            state.blocks.some((block) => block.id === id && block.pageId === page.id)
              ? { ...page, updatedAt: now(), synced: false }
              : page
          ),
        })),

      updateImageLayout: (id, layout) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  imageWidth: layout.imageWidth ?? block.imageWidth,
                  imageAlign: layout.imageAlign ?? block.imageAlign,
                  imageFlow: layout.imageFlow ?? block.imageFlow,
                  synced: false,
                }
              : block
          ),
          pages: state.pages.map((page) =>
            state.blocks.some((block) => block.id === id && block.pageId === page.id)
              ? { ...page, updatedAt: now(), synced: false }
              : page
          ),
        })),

      moveBlock: (id, targetId, placement) =>
        set((state) => {
          if (id === targetId) return state;

          const movingBlock = state.blocks.find((block) => block.id === id);
          const targetBlock = state.blocks.find((block) => block.id === targetId);
          if (!movingBlock || !targetBlock || movingBlock.pageId !== targetBlock.pageId) {
            return state;
          }

          const pageBlocksWithoutMoving = getOrderedPageBlocks(state.blocks, movingBlock.pageId).filter(
            (block) => block.id !== id
          );
          const targetIndex = pageBlocksWithoutMoving.findIndex((block) => block.id === targetId);
          const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
          const movedBlock: Block = {
            ...movingBlock,
            imageFlow: placement === 'beside' ? 'columns' : 'stack',
            imageWidth: placement === 'beside' ? Math.min(movingBlock.imageWidth || 50, 50) : movingBlock.imageWidth,
            synced: false,
          };
          const nextPageBlocks = [...pageBlocksWithoutMoving];

          nextPageBlocks.splice(insertIndex, 0, movedBlock);

          return {
            blocks: rebuildBlocksForPage(state.blocks, movingBlock.pageId, nextPageBlocks.map((block) =>
              placement === 'beside' && block.id === targetId && (block.type === 'image' || block.type === 'card_notice')
                ? {
                    ...block,
                    imageFlow: 'columns',
                    imageWidth: Math.min(block.imageWidth || 50, 50),
                    synced: false,
                  }
                : block
            )),
            pages: state.pages.map((page) =>
              page.id === movingBlock.pageId ? { ...page, updatedAt: now(), synced: false } : page
            ),
          };
        }),

      updateBlockType: (id, type) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, type, synced: false } : block
          ),
        })),

      changeBlockType: (id, newType) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, type: newType, synced: false } : block
          ),
        })),

      toggleBlockAccordion: (id) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? (() => {
                  const isAccordionActive = Boolean(block.isAccordion || block.isCollapsed);

                  return {
                    ...block,
                    isAccordion: !isAccordionActive,
                    isCollapsed: isAccordionActive ? false : true,
                    updatedAt: now(),
                    synced: false,
                  };
                })()
              : block
          ),
          pages: state.pages.map((page) =>
            state.blocks.some((block) => block.id === id && block.pageId === page.id)
              ? { ...page, updatedAt: now(), synced: false }
              : page
          ),
        })),

      toggleBlockCollapsed: (id) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  isAccordion: true,
                  isCollapsed: !block.isCollapsed,
                  updatedAt: now(),
                  synced: false,
                }
              : block
          ),
          pages: state.pages.map((page) =>
            state.blocks.some((block) => block.id === id && block.pageId === page.id)
              ? { ...page, updatedAt: now(), synced: false }
              : page
          ),
        })),

      toggleBlockFavorite: (id) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  isFavorite: !block.isFavorite,
                  updatedAt: now(),
                  synced: false,
                }
              : block
          ),
          pages: state.pages.map((page) =>
            state.blocks.some((block) => block.id === id && block.pageId === page.id)
              ? { ...page, updatedAt: now(), synced: false }
              : page
          ),
        })),

      setBlockActivityStatus: (id, status) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  activityStatus: status,
                  updatedAt: now(),
                  synced: false,
                }
              : block
          ),
          pages: state.pages.map((page) =>
            state.blocks.some((block) => block.id === id && block.pageId === page.id)
              ? { ...page, updatedAt: now(), synced: false }
              : page
          ),
        })),

      markAsSynced: (ids) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            ids.includes(block.id) ? { ...block, synced: true } : block
          ),
        })),

      markPagesAsSynced: (ids) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            ids.includes(page.id) ? { ...page, synced: true } : page
          ),
        })),

      removeBlock: (id) =>
        set((state) => {
          const blockToRemove = state.blocks.find((block) => block.id === id);
          const nextBlocks = state.blocks.filter((block) => block.id !== id);

          if (!blockToRemove) return { blocks: nextBlocks };

          return {
            blocks: rebuildBlocksForPage(nextBlocks, blockToRemove.pageId, getOrderedPageBlocks(nextBlocks, blockToRemove.pageId)),
            pages: state.pages.map((page) =>
              page.id === blockToRemove.pageId ? { ...page, updatedAt: now(), synced: false } : page
            ),
          };
        }),

      addShare: (share) => {
        const normalizedEmail = share.email.trim().toLowerCase();
        const invite: ShareInvite = {
          ...share,
          email: normalizedEmail,
          id: crypto.randomUUID(),
          token: crypto.randomUUID(),
          createdAt: now(),
          synced: false,
        };

        set((state) => {
          const existingShare = state.shares.find(
            (item) =>
              item.targetType === share.targetType &&
              item.targetId === share.targetId &&
              item.email.trim().toLowerCase() === normalizedEmail
          );

          if (existingShare) {
            return {
              shares: state.shares.map((item) =>
                item.id === existingShare.id
                  ? {
                      ...item,
                      title: share.title,
                      permission: share.permission,
                      synced: false,
                    }
                  : item
              ),
            };
          }

          return { shares: [...state.shares, invite] };
        });
        return invite;
      },

      removeShare: (id) =>
        set((state) => ({
          shares: state.shares.filter((share) => share.id !== id),
        })),

      updateSharePermission: (id, permission) =>
        set((state) => ({
          shares: state.shares.map((share) =>
            share.id === id ? { ...share, permission, synced: false } : share
          ),
        })),

      markSharesAsSynced: (ids) =>
        set((state) => ({
          shares: state.shares.map((share) =>
            ids.includes(share.id) ? { ...share, synced: true } : share
          ),
        })),

      setBlocks: (blocks) => set({ blocks: normalizeLoadedBlocks(blocks) }),
      setPages: (pages) => set({ pages }),
      setShares: (shares) => set({ shares: shares.map(s => ({ ...s, synced: true })) }),
      addProjectFolder: (name) =>
        set((state) => {
          const folderName = name.trim();
          if (!folderName) return state;

          const exists = state.projectFolders.some(
            (folder) => folder.toLowerCase() === folderName.toLowerCase()
          );
          if (exists) return state;

          return { projectFolders: [...state.projectFolders, folderName].sort((a, b) => a.localeCompare(b)) };
        }),
      renameProjectFolder: (currentName, nextName) =>
        set((state) => {
          const currentFolderName = currentName.trim();
          const nextFolderName = nextName.trim();
          if (!currentFolderName || !nextFolderName || currentFolderName === nextFolderName) return state;

          const projectFolders = state.projectFolders
            .map((folder) => (folder === currentFolderName ? nextFolderName : folder))
            .filter((folder, index, folders) =>
              folders.findIndex((item) => item.toLowerCase() === folder.toLowerCase()) === index
            )
            .sort((a, b) => a.localeCompare(b));

          return {
            projectFolders,
            pages: state.pages.map((page) =>
              page.projectName === currentFolderName
                ? { ...page, projectName: nextFolderName, updatedAt: now(), synced: false }
                : page
            ),
          };
        }),
      removeProjectFolder: (name) =>
        set((state) => {
          const folderName = name.trim();
          if (!folderName) return state;

          return {
            projectFolders: state.projectFolders.filter((folder) => folder !== folderName),
            pages: state.pages.map((page) =>
              page.projectName === folderName
                ? { ...page, projectName: undefined, updatedAt: now(), synced: false }
                : page
            ),
          };
        }),
      clearWorkspace: () => set({ blocks: [], pages: [], shares: [], projectFolders: [] }),
    }),
    { name: 'coda-storage' }
  )
);
