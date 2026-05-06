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

export const syncWorkspaceToFirebase = async (wsId: string, pages: Page[], blocks: Block[]) => {
  const { db } = getFirebaseServices();
  const batch = writeBatch(db);

  // Firestore rejects undefined values — strip them before writing
  const clean = <T extends object>(obj: T): T =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

  batch.set(
    getWorkspaceRef(db, wsId),
    { id: wsId, updatedAt: serverTimestamp() },
    { merge: true }
  );

  pages.forEach((page) => {
    const wsRef = page.ownerWorkspaceId ? getWorkspaceRef(db, page.ownerWorkspaceId) : getWorkspaceRef(db, wsId);
    batch.set(doc(collection(wsRef, 'pages'), page.id), clean(page), { merge: true });
  });

  blocks.forEach((block) => {
    const wsRef = block.ownerWorkspaceId ? getWorkspaceRef(db, block.ownerWorkspaceId) : getWorkspaceRef(db, wsId);
    batch.set(doc(collection(wsRef, 'blocks'), block.id), clean(block), { merge: true });
  });

  await batch.commit();
};

export const syncSharesToFirebase = async (wsId: string, shares: ShareInvite[]) => {
  const { db } = getFirebaseServices();
  const batch = writeBatch(db);
  const clean = <T extends object>(obj: T): T =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

  shares.forEach((share) => {
    const shareData = clean({ ...share, ownerWorkspaceId: wsId });
    batch.set(doc(sharesCollection(db), share.id), shareData, { merge: true });
  });

  await batch.commit();
};

export const deleteFirebaseShare = async (shareId: string) => {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(sharesCollection(db), shareId));
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
          synced: true,
        }));
        const explicitRoot = docPages.find((p) => p.isDocumentRoot);
        const rootPage = explicitRoot || docPages.filter((p) => !p.parentId).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))[0];
        
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
        synced: true
      }));
      allPages.push(...docPages);
      
      const pageIds = docPages.map((p) => p.id);
      for (let i = 0; i < pageIds.length; i += 10) {
        const chunk = pageIds.slice(i, i + 10);
        if (chunk.length === 0) continue;
        const bQuery = query(collection(wsRef, 'blocks'), where('pageId', 'in', chunk));
        const bSnap = await getDocs(bQuery);
        const docBlocks = bSnap.docs.map((d) => ({
          ...(d.data() as Block),
          ownerWorkspaceId: share.ownerWorkspaceId,
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
  const clean = <T extends object>(obj: T): T =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
  const wsRef = block.ownerWorkspaceId ? getWorkspaceRef(db, block.ownerWorkspaceId) : getWorkspaceRef(db, wsId);
  await setDoc(doc(collection(wsRef, 'blocks'), block.id), clean(block), { merge: true });
};
