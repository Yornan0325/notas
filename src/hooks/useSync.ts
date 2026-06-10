import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useCodaStore } from '../store/useCodaStore';
import { isFirebaseConfigured, getFirebaseAuth } from '../api/firebase';
import {
  deleteFirebaseBlock,
  deleteFirebasePage,
  deleteFirebaseShare,
  loadWorkspaceFromFirebase,
  syncSharesToFirebase,
  syncWorkspaceToFirebase,
  loadSharedWorkspaceData,
  loadMySharesFromFirebase,
  uploadBlockImage,
} from '../api/firebaseQueries';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { Block, Page } from '../components/type/typeScript';

type RemoteItemMeta = {
  ownerWorkspaceId?: string;
  sharePermission?: 'view' | 'edit';
};

const canSyncRemoteItem = (item: RemoteItemMeta) =>
  !item.ownerWorkspaceId || item.sharePermission === 'edit';

export const useSync = () => {
  const {
    blocks,
    pages,
    shares,
    markAsSynced,
    markPagesAsSynced,
    markSharesAsSynced,
    setBlocks,
    setPages,
    setShares,
    clearWorkspace,
  } = useCodaStore();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const knownBlockIds = useRef<Map<string, RemoteItemMeta>>(new Map());
  const knownPageIds = useRef<Map<string, RemoteItemMeta>>(new Map());
  const knownShareIds = useRef<Set<string>>(new Set());
  const clearWorkspaceRef = useRef(clearWorkspace);
  clearWorkspaceRef.current = clearWorkspace;

  // 1. Auth listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        const prevUid = user?.uid || user?.email;
        const nextUid = currentUser?.uid || currentUser?.email;
        if (nextUid && prevUid && nextUid !== prevUid) {
          clearWorkspaceRef.current();
          hasLoadedRef.current = false;
          setUser(currentUser);
        }
        if (!currentUser) {
          setLoading(false);
        }
        if (currentUser && !prevUid) {
          setUser(currentUser);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error('[Sync] Auth error:', e);
      setLoading(false);
    }
  }, [clearWorkspace]);

  // 2. Load from Firebase (once per user session)
  useEffect(() => {
    if (!isFirebaseConfigured || !user) return;
    if (hasLoadedRef.current) return;

    const loadRemoteWorkspace = async () => {
      hasLoadedRef.current = true;
      try {
        const wsId = user.email!;
        const remoteWorkspace = await loadWorkspaceFromFirebase(wsId);
        // console.log('[Sync] Remote data:', { pages: remoteWorkspace.pages.length, blocks: remoteWorkspace.blocks.length });

        const remotePages: Page[] = remoteWorkspace.pages.map(p => ({ ...p, synced: true }));
        const remoteBlocks: Block[] = remoteWorkspace.blocks.map(b => ({ ...b, synced: true }));

        const allPages: Page[] = [...remotePages];
        const allBlocks: Block[] = [...remoteBlocks];

        // Shared documents
        try {
          const sharedWorkspace = await loadSharedWorkspaceData(user.email!);
          const pageIds = new Set(allPages.map(p => p.id));
          sharedWorkspace.pages.forEach(p => {
            if (!pageIds.has(p.id)) allPages.push({ ...p, synced: true });
          });
          const blockIds = new Set(allBlocks.map(b => b.id));
          sharedWorkspace.blocks.forEach(b => {
            if (!blockIds.has(b.id)) allBlocks.push({ ...b, synced: true });
          });
        } catch (e) {
          console.warn('[Sync] Could not load shared data:', e);
        }

        // Preserve unsynced local changes (created while loading)
        const currentStore = useCodaStore.getState();
        const unsyncedPages = currentStore.pages.filter(p => !p.synced);
        const unsyncedBlocks = currentStore.blocks.filter(b => !b.synced);

        const finalPages: Page[] = [...allPages];
        unsyncedPages.forEach(pp => {
          const idx = finalPages.findIndex(p => p.id === pp.id);
          if (idx !== -1) finalPages[idx] = pp;
          else finalPages.push(pp);
        });

        const finalBlocks: Block[] = [...allBlocks];
        unsyncedBlocks.forEach(pb => {
          const idx = finalBlocks.findIndex(b => b.id === pb.id);
          if (idx !== -1) finalBlocks[idx] = pb;
          else finalBlocks.push(pb);
        });

        setPages(finalPages);
        setBlocks(finalBlocks);

        // Cargar invitaciones propias del usuario
        const myShares = await loadMySharesFromFirebase(wsId);
        const currentStorePostLoad = useCodaStore.getState();
        const unsyncedShares = currentStorePostLoad.shares.filter(s => !s.synced);
        const remoteShareIds = new Set(myShares.map(s => s.id));
        const mergedShares = [
          ...myShares,
          ...unsyncedShares.filter(s => !remoteShareIds.has(s.id)),
        ];
        setShares(mergedShares);
        knownShareIds.current = new Set(mergedShares.map(s => s.id));

        knownPageIds.current = new Map(finalPages.map(p => [p.id, {
          ownerWorkspaceId: p.ownerWorkspaceId,
          sharePermission: p.sharePermission,
        }]));
        knownBlockIds.current = new Map(finalBlocks.map(b => [b.id, {
          ownerWorkspaceId: b.ownerWorkspaceId,
          sharePermission: b.sharePermission,
        }]));
      } catch (error) {
        console.error('[Sync] Failed to load workspace:', error);
        toast.error('No se pudo cargar el workspace');
      } finally {
        setLoading(false);
      }
    };

    loadRemoteWorkspace();
  }, [user, setBlocks, setPages, setShares]);

  // 3. Sync local changes to Firebase with debounce
  useEffect(() => {
    if (!isFirebaseConfigured || !user || loading) return;

    const handleSyncError = (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Sync] Failed to sync. Full error:', error);
      toast.error(`Error al guardar: ${msg.slice(0, 80)}`, { duration: 6000 });
    };

    const performSync = async () => {
      let pendingBlocks = blocks.filter(b => !b.synced && canSyncRemoteItem(b));
      const pendingPages = pages.filter(p => !p.synced && canSyncRemoteItem(p));
      const pendingShares = shares.filter(s => !s.synced);

      const currentBlockIds = new Set(blocks.map(b => b.id));
      const currentPageIds = new Set(pages.map(p => p.id));
      const currentShareIds = new Set(shares.map(s => s.id));

      const deletedBlockIds = Array.from(knownBlockIds.current.entries())
        .filter(([, meta]) => canSyncRemoteItem(meta))
        .map(([id]) => id)
        .filter(id => !currentBlockIds.has(id));
      const deletedPageIds = Array.from(knownPageIds.current.entries())
        .filter(([, meta]) => canSyncRemoteItem(meta))
        .map(([id]) => id)
        .filter(id => !currentPageIds.has(id));
      const deletedShareIds = Array.from(knownShareIds.current).filter(id => !currentShareIds.has(id));

      const nothingToDo =
        pendingBlocks.length === 0 &&
        pendingPages.length === 0 &&
        pendingShares.length === 0 &&
        deletedBlockIds.length === 0 &&
        deletedPageIds.length === 0 &&
        deletedShareIds.length === 0;

      if (nothingToDo) return;
      if (!navigator.onLine) {
        console.warn('[Sync] Offline, skipping sync.');
        return;
      }

      const wsId = user.email!;

      try {
        const embeddedImageBlocks = pendingBlocks.filter(
          (block) => block.type === 'image' && /^data:image\//i.test(block.content)
        );

        if (embeddedImageBlocks.length > 0) {
          const migratedBlocks = await Promise.all(
            embeddedImageBlocks.map(async (block) => {
              const blob = await fetch(block.content).then((response) => response.blob());
              const extension = blob.type.split('/')[1] || 'png';
              const file = new File([blob], block.attachmentName || `imagen-${block.id}.${extension}`, {
                type: blob.type || 'image/png',
              });
              const page = pages.find((item) => item.id === block.pageId);
              const uploaded = await uploadBlockImage({
                wsId,
                docId: page?.docId || 'documento',
                pageId: block.pageId,
                blockId: block.id,
                file,
              });

              useCodaStore
                .getState()
                .updateBlockAttachment(block.id, uploaded.url, uploaded.path, uploaded.name);

              return {
                ...block,
                content: uploaded.url,
                attachmentPath: uploaded.path,
                attachmentName: uploaded.name,
              };
            })
          );

          pendingBlocks = pendingBlocks.map(
            (block) => migratedBlocks.find((migrated) => migrated.id === block.id) || block
          );
        }

        if (deletedBlockIds.length > 0 || deletedPageIds.length > 0 || deletedShareIds.length > 0) {
          await Promise.all([
            ...deletedBlockIds.map(id => deleteFirebaseBlock(wsId, id, knownBlockIds.current.get(id)?.ownerWorkspaceId)),
            ...deletedPageIds.map(id => deleteFirebasePage(wsId, id, knownPageIds.current.get(id)?.ownerWorkspaceId)),
            ...deletedShareIds.map(id => deleteFirebaseShare(id)),
          ]);
        }

        if (pendingPages.length > 0 || pendingBlocks.length > 0) {
          await syncWorkspaceToFirebase(wsId, pendingPages, pendingBlocks);
        }
        if (pendingShares.length > 0) {
          await syncSharesToFirebase(wsId, pendingShares);
        }

        markAsSynced(pendingBlocks.map(b => b.id));
        markPagesAsSynced(pendingPages.map(p => p.id));
        markSharesAsSynced(pendingShares.map(s => s.id));

        knownBlockIds.current = new Map(blocks.map(b => [b.id, {
          ownerWorkspaceId: b.ownerWorkspaceId,
          sharePermission: b.sharePermission,
        }]));
        knownPageIds.current = new Map(pages.map(p => [p.id, {
          ownerWorkspaceId: p.ownerWorkspaceId,
          sharePermission: p.sharePermission,
        }]));
        knownShareIds.current = currentShareIds;

        toast.success('Guardado', { id: 'sync-success', duration: 1500, position: 'bottom-right' });
      } catch (error) {
        handleSyncError(error);
      }
    };

    // Debounce: esperar 3s de inactividad antes de sincronizar
    const debounceMs = 3000;
    const debounceTimer = window.setTimeout(performSync, debounceMs);

    // Sincronizar inmediatamente cuando se recupera la conexión
    const handleOnline = () => {
      window.clearTimeout(debounceTimer);
      performSync().catch(handleSyncError);
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.clearTimeout(debounceTimer);
      window.removeEventListener('online', handleOnline);
    };
  }, [blocks, pages, shares, markAsSynced, markPagesAsSynced, markSharesAsSynced, user, loading]);

  return { loading, user };
};
