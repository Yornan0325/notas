import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { Block, Page, ShareInvite } from '../components/type/typeScript';
import { getFirebaseServices } from './firebase';

export const getWorkspaceRef = (db: Firestore, wsId: string) => doc(db, 'workspaces', wsId);

export const pagesCollection = (db: Firestore, wsId: string) => collection(getWorkspaceRef(db, wsId), 'pages');
export const blocksCollection = (db: Firestore, wsId: string) => collection(getWorkspaceRef(db, wsId), 'blocks');
export const sharesCollection = (db: Firestore) => collection(db, 'shares');

export const loadWorkspaceFromFirebase = async (wsId: string) => {
  const { db } = getFirebaseServices();
  const [pageSnapshot, blockSnapshot] = await Promise.all([
    getDocs(pagesCollection(db, wsId)),
    getDocs(blocksCollection(db, wsId)),
  ]);

  const pages = pageSnapshot.docs.map((item) => ({
    ...(item.data() as Page),
    synced: true,
  }));
  const blocks = blockSnapshot.docs.map((item) => ({
    ...(item.data() as Block),
    synced: true,
  }));

  return { pages, blocks };
};

const BATCH_LIMIT = 400;

const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const cleanRecord = <T extends object>(obj: T, omitKeys: string[] = []): T =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) => value !== undefined && !omitKeys.includes(key)
    )
  ) as T;

const findWorkspaceRef = (db: Firestore, wsId: string, ownerWorkspaceId?: string) =>
  ownerWorkspaceId ? getWorkspaceRef(db, ownerWorkspaceId) : getWorkspaceRef(db, wsId);

export const syncWorkspaceToFirebase = async (wsId: string, pages: Page[], blocks: Block[]) => {
  const { db } = getFirebaseServices();
  const skipFields = ['ownerWorkspaceId', 'sharePermission', 'sharedRootId'];

  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  operations.push((batch) => {
    batch.set(getWorkspaceRef(db, wsId), { id: wsId, updatedAt: serverTimestamp() }, { merge: true });
  });

  pages.forEach((page) => {
    const wsRef = findWorkspaceRef(db, wsId, page.ownerWorkspaceId);
    const pageRef = doc(collection(wsRef, 'pages'), page.id);
    operations.push((batch) => batch.set(pageRef, cleanRecord(page, skipFields), { merge: true }));
  });

  blocks.forEach((block) => {
    const wsRef = findWorkspaceRef(db, wsId, block.ownerWorkspaceId);
    const blockRef = doc(collection(wsRef, 'blocks'), block.id);
    operations.push((batch) => batch.set(blockRef, cleanRecord(block, skipFields), { merge: true }));
  });

  const chunks = chunkArray(operations, BATCH_LIMIT);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((op) => op(batch));
    await batch.commit();
  }
};

export const syncSharesToFirebase = async (wsId: string, shares: ShareInvite[]) => {
  const { db } = getFirebaseServices();
  const skipFields = ['sharePermission', 'sharedRootId'];

  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  shares.forEach((share) => {
    const shareData = cleanRecord({ ...share, ownerWorkspaceId: wsId }, skipFields);
    const shareRef = doc(sharesCollection(db), share.id);
    operations.push((batch) => batch.set(shareRef, shareData, { merge: true }));
  });

  const chunks = chunkArray(operations, BATCH_LIMIT);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((op) => op(batch));
    await batch.commit();
  }
};

export const deleteFirebaseShare = async (shareId: string) => {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(sharesCollection(db), shareId));
};

export const loadMySharesFromFirebase = async (wsId: string): Promise<ShareInvite[]> => {
  const { db } = getFirebaseServices();
  try {
    const q = query(sharesCollection(db), where('ownerWorkspaceId', '==', wsId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ShareInvite);
  } catch (error) {
    console.error('[Sync] Error loading own shares:', error);
    return [];
  }
};

const collectSharedPageTree = (pages: Page[], rootId: string) => {
  const allowedIds = new Set<string>([rootId]);
  let didAdd = true;

  while (didAdd) {
    didAdd = false;
    pages.forEach((page) => {
      if (page.parentId && allowedIds.has(page.parentId) && !allowedIds.has(page.id)) {
        allowedIds.add(page.id);
        didAdd = true;
      }
    });
  }

  return pages.filter((page) => allowedIds.has(page.id));
};

const getPagesForShare = (docPages: Page[], share: ShareInvite) => {
  if (share.targetType === 'workspace') return docPages;
  return collectSharedPageTree(docPages, share.targetId);
};

export const getSharedDocuments = async (email: string): Promise<Page[]> => {
  const { db } = getFirebaseServices();
  try {
    const sharesQuery = query(sharesCollection(db), where('email', '==', email));
    const snapshot = await getDocs(sharesQuery);
    
    const shares = snapshot.docs.map((d) => d.data() as ShareInvite);
    const pages: Page[] = [];
    
    for (const share of shares) {
      if (!share.ownerWorkspaceId) continue;
      const pagesQuery = query(
        collection(db, 'workspaces', share.ownerWorkspaceId, 'pages'),
        where('docId', '==', share.docId)
      );
      const pagesSnapshot = await getDocs(pagesQuery);
      if (!pagesSnapshot.empty) {
        const docPages = pagesSnapshot.docs.map((d) => ({
          ...(d.data() as Page),
          ownerWorkspaceId: share.ownerWorkspaceId,
          sharePermission: share.permission,
          sharedRootId: share.targetType === 'page' ? share.targetId : undefined,
          synced: true,
        }));
        const visiblePages = getPagesForShare(docPages, share);
        const rootPage = share.targetType === 'page'
          ? visiblePages.find((p) => p.id === share.targetId)
          : visiblePages.find((p) => p.isDocumentRoot) ||
            visiblePages.filter((p) => !p.parentId).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))[0];
        
        if (rootPage) {
          pages.push({ ...rootPage, docId: share.docId });
        }
      }
    }
    
    return pages;
  } catch (error) {
    console.error('Error fetching shared documents:', email, error);
    return [];
  }
};

export const loadSharedWorkspaceData = async (email: string) => {
  const { db } = getFirebaseServices();
  try {
    const sharesQuery = query(sharesCollection(db), where('email', '==', email));
    const snapshot = await getDocs(sharesQuery);
    const shares = snapshot.docs.map((d) => d.data() as ShareInvite);
    
    const allPages: Page[] = [];
    const allBlocks: Block[] = [];
    
    for (const share of shares) {
      if (!share.ownerWorkspaceId) continue;
      const wsRef = getWorkspaceRef(db, share.ownerWorkspaceId);
      
      const pQuery = query(collection(wsRef, 'pages'), where('docId', '==', share.docId));
      const pSnap = await getDocs(pQuery);
      
      const docPages = pSnap.docs.map((d) => ({
        ...(d.data() as Page),
        ownerWorkspaceId: share.ownerWorkspaceId,
        sharePermission: share.permission,
        sharedRootId: share.targetType === 'page' ? share.targetId : undefined,
        synced: true
      }));
      const visiblePages = getPagesForShare(docPages, share);
      allPages.push(...visiblePages);
      
      const pageIds = visiblePages.map((p) => p.id);
      for (let i = 0; i < pageIds.length; i += 10) {
        const chunk = pageIds.slice(i, i + 10);
        if (chunk.length === 0) continue;
        const bQuery = query(collection(wsRef, 'blocks'), where('pageId', 'in', chunk));
        const bSnap = await getDocs(bQuery);
        const docBlocks = bSnap.docs.map((d) => ({
          ...(d.data() as Block),
          ownerWorkspaceId: share.ownerWorkspaceId,
          sharePermission: share.permission,
          synced: true
        }));
        allBlocks.push(...docBlocks);
      }
    }
    
    return { pages: allPages, blocks: allBlocks };
  } catch (error) {
    console.error('Error fetching shared data:', email, error);
    return { pages: [], blocks: [] };
  }
};

export const deleteFirebasePage = async (wsId: string, pageId: string, ownerWorkspaceId?: string) => {
  const { db } = getFirebaseServices();
  const wsRef = ownerWorkspaceId ? getWorkspaceRef(db, ownerWorkspaceId) : getWorkspaceRef(db, wsId);
  await deleteDoc(doc(collection(wsRef, 'pages'), pageId));
};

export const deleteFirebaseBlock = async (wsId: string, blockId: string, ownerWorkspaceId?: string) => {
  const { db } = getFirebaseServices();
  const wsRef = ownerWorkspaceId ? getWorkspaceRef(db, ownerWorkspaceId) : getWorkspaceRef(db, wsId);
  await deleteDoc(doc(collection(wsRef, 'blocks'), blockId));
};

export const uploadBlockImage = async ({
  wsId,
  docId,
  pageId,
  blockId,
  file,
}: {
  wsId: string;
  docId: string;
  pageId: string;
  blockId: string;
  file: File;
}) => {
  const { storage } = getFirebaseServices();
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '-');
  const path = `workspaces/${wsId}/docs/${docId}/pages/${pageId}/blocks/${blockId}/${Date.now()}-${safeName}`;
  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      blockId,
      pageId,
      docId,
    },
  });

  const url = await getDownloadURL(imageRef);
  return { url, path, name: file.name };
};

export const saveBlockToFirebase = async (wsId: string, block: Block) => {
  const { db } = getFirebaseServices();
  const skipFields = ['ownerWorkspaceId', 'sharePermission', 'sharedRootId'];
  const wsRef = findWorkspaceRef(db, wsId, block.ownerWorkspaceId);
  await setDoc(doc(collection(wsRef, 'blocks'), block.id), cleanRecord(block, skipFields), { merge: true });
};
