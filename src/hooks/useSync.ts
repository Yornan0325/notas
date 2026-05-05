import { useEffect, useRef } from 'react';
import { useCodaStore } from '../store/useCodaStore';
import {
  deleteFirebaseBlock,
  deleteFirebasePage,
  deleteFirebaseShare,
  isFirebaseConfigured,
  loadWorkspaceFromFirebase,
  syncSharesToFirebase,
  syncWorkspaceToFirebase,
} from '../api/firebase';

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
  } = useCodaStore();
  const hasLoadedRemote = useRef(false);
  const knownBlockIds = useRef<Set<string>>(new Set());
  const knownPageIds = useRef<Set<string>>(new Set());
  const knownShareIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isFirebaseConfigured || hasLoadedRemote.current || !navigator.onLine) return;

    hasLoadedRemote.current = true;

    const loadRemoteWorkspace = async () => {
      try {
        const remoteWorkspace = await loadWorkspaceFromFirebase();

        if (remoteWorkspace.pages.length > 0 || remoteWorkspace.blocks.length > 0) {
          setPages(remoteWorkspace.pages);
          setBlocks(remoteWorkspace.blocks);
          knownPageIds.current = new Set(remoteWorkspace.pages.map((page) => page.id));
          knownBlockIds.current = new Set(remoteWorkspace.blocks.map((block) => block.id));
        }
      } catch (error) {
        console.error('No se pudo cargar el workspace desde Firebase:', error);
      }
    };

    loadRemoteWorkspace();
  }, [setBlocks, setPages]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const performSync = async () => {
      const pendingBlocks = blocks.filter((block) => !block.synced);
      const pendingPages = pages.filter((page) => !page.synced);
      const pendingShares = shares.filter((share) => !share.synced);
      const currentBlockIds = new Set(blocks.map((block) => block.id));
      const currentPageIds = new Set(pages.map((page) => page.id));
      const currentShareIds = new Set(shares.map((share) => share.id));
      const deletedBlockIds = Array.from(knownBlockIds.current).filter(
        (id) => !currentBlockIds.has(id)
      );
      const deletedPageIds = Array.from(knownPageIds.current).filter(
        (id) => !currentPageIds.has(id)
      );
      const deletedShareIds = Array.from(knownShareIds.current).filter(
        (id) => !currentShareIds.has(id)
      );

      if (
        pendingBlocks.length === 0 &&
        pendingPages.length === 0 &&
        pendingShares.length === 0 &&
        deletedBlockIds.length === 0 &&
        deletedPageIds.length === 0 &&
        deletedShareIds.length === 0
      ) {
        return;
      }

      if (!navigator.onLine) return;

      try {
        await Promise.all([
          ...deletedBlockIds.map((id) => deleteFirebaseBlock(id)),
          ...deletedPageIds.map((id) => deleteFirebasePage(id)),
          ...deletedShareIds.map((id) => deleteFirebaseShare(id)),
        ]);
        await syncWorkspaceToFirebase(pages, blocks);
        await syncSharesToFirebase(shares);
        markAsSynced(blocks.map((block) => block.id));
        markPagesAsSynced(pages.map((page) => page.id));
        markSharesAsSynced(shares.map((share) => share.id));
        knownBlockIds.current = currentBlockIds;
        knownPageIds.current = currentPageIds;
        knownShareIds.current = currentShareIds;
      } catch (error) {
        console.error('No se pudo sincronizar con Firebase:', error);
      }
    };

    const handleOnline = () => {
      performSync();
    };

    window.addEventListener('online', handleOnline);
    const timeoutId = window.setTimeout(performSync, 1200);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.clearTimeout(timeoutId);
    };
  }, [blocks, pages, shares, markAsSynced, markPagesAsSynced, markSharesAsSynced]);
};
