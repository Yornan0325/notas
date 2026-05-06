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
} from '../api/firebaseQueries';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { Block, Page } from '../components/type/typeScript';

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
    clearWorkspace,
  } = useCodaStore();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const knownBlockIds = useRef<Map<string, string | undefined>>(new Map());
  const knownPageIds = useRef<Map<string, string | undefined>>(new Map());
  const knownShareIds = useRef<Set<string>>(new Set());

  // 1. Auth listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('[Sync] Auth state changed:', currentUser?.email ?? 'no user');
        if (currentUser?.email !== user?.email) {
          clearWorkspace();
          hasLoadedRef.current = false;
          setUser(currentUser);
        }
        if (!currentUser) {
          setLoading(false);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error('[Sync] Auth error:', e);
      setLoading(false);
    }
  }, [user?.email, clearWorkspace]);

  // 2. Load from Firebase (once per user session)
  useEffect(() => {
    if (!isFirebaseConfigured || !user) return;
    if (hasLoadedRef.current) return;

    const loadRemoteWorkspace = async () => {
      hasLoadedRef.current = true;
      console.log('[Sync] Loading workspace for:', user.email);
      try {
        const wsId = user.email!;
        const remoteWorkspace = await loadWorkspaceFromFirebase(wsId);
        console.log('[Sync] Remote data:', { pages: remoteWorkspace.pages.length, blocks: remoteWorkspace.blocks.length });

        const remotePages: Page[] = remoteWorkspace.pages.map(p => ({ ...p, synced: true }));
        const remoteBlocks: Block[] = remoteWorkspace.blocks.map(b => ({ ...b, synced: true }));

        let allPages: Page[] = [...remotePages];
        let allBlocks: Block[] = [...remoteBlocks];

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
        console.log('[Sync] Preserving unsynced local items:', { pages: unsyncedPages.length, blocks: unsyncedBlocks.length });

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
        knownPageIds.current = new Map(finalPages.map(p => [p.id, p.ownerWorkspaceId]));
        knownBlockIds.current = new Map(finalBlocks.map(b => [b.id, b.ownerWorkspaceId]));
        console.log('[Sync] Workspace ready:', { pages: finalPages.length, blocks: finalBlocks.length });
      } catch (error) {
        console.error('[Sync] Failed to load workspace:', error);
        toast.error('No se pudo cargar el workspace');
      } finally {
        setLoading(false);
        console.log('[Sync] Loading complete, sync enabled.');
      }
    };

    loadRemoteWorkspace();
  }, [user, setBlocks, setPages]);

  // 3. Sync local changes to Firebase
  useEffect(() => {
    if (!isFirebaseConfigured || !user || loading) return;

    const performSync = async () => {
      const pendingBlocks = blocks.filter(b => !b.synced);
      const pendingPages = pages.filter(p => !p.synced);
      const pendingShares = shares.filter(s => !s.synced);

      const currentBlockIds = new Set(blocks.map(b => b.id));
      const currentPageIds = new Set(pages.map(p => p.id));
      const currentShareIds = new Set(shares.map(s => s.id));

      const deletedBlockIds = Array.from(knownBlockIds.current.keys()).filter(id => !currentBlockIds.has(id));
      const deletedPageIds = Array.from(knownPageIds.current.keys()).filter(id => !currentPageIds.has(id));
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
      console.log('[Sync] Uploading to Firebase...', {
        pendingPages: pendingPages.length,
        pendingBlocks: pendingBlocks.length,
      });

      try {
        if (deletedBlockIds.length > 0 || deletedPageIds.length > 0 || deletedShareIds.length > 0) {
          await Promise.all([
            ...deletedBlockIds.map(id => deleteFirebaseBlock(wsId, id, knownBlockIds.current.get(id))),
            ...deletedPageIds.map(id => deleteFirebasePage(wsId, id, knownPageIds.current.get(id))),
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

        knownBlockIds.current = new Map(blocks.map(b => [b.id, b.ownerWorkspaceId]));
        knownPageIds.current = new Map(pages.map(p => [p.id, p.ownerWorkspaceId]));
        knownShareIds.current = currentShareIds;

        console.log('[Sync] Saved successfully.');
        toast.success('Guardado', { id: 'sync-success', duration: 1500, position: 'bottom-right' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Sync] Failed to sync. Full error:', error);
        toast.error(`Error al guardar: ${msg.slice(0, 80)}`, { duration: 6000 });
      }
    };

    window.addEventListener('online', performSync);
    const timeoutId = window.setTimeout(performSync, 1500);
    return () => {
      window.removeEventListener('online', performSync);
      window.clearTimeout(timeoutId);
    };
  }, [blocks, pages, shares, markAsSynced, markPagesAsSynced, markSharesAsSynced, user, loading]);

  return { loading, user };
};
