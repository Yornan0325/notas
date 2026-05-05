import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from 'firebase/storage';
import type { Block, Page } from '../components/type/typeScript';
import type { ShareInvite } from '../components/type/typeScript';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const workspaceId = import.meta.env.VITE_FIREBASE_WORKSPACE_ID || 'default';

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId
);

const getFirebaseServices = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase no esta configurado. Revisa las variables VITE_FIREBASE_*.');
  }

  if (!app) {
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    storage = getStorage(app);
  }

  return {
    db: firestore as Firestore,
    storage: storage as FirebaseStorage,
  };
};

const workspacePath = (db: Firestore) => doc(db, 'workspaces', workspaceId);

const pagesCollection = (db: Firestore) =>
  collection(workspacePath(db), 'pages');

const blocksCollection = (db: Firestore) =>
  collection(workspacePath(db), 'blocks');

const sharesCollection = (db: Firestore) =>
  collection(workspacePath(db), 'shares');

export const loadWorkspaceFromFirebase = async () => {
  const { db } = getFirebaseServices();
  const [pageSnapshot, blockSnapshot] = await Promise.all([
    getDocs(pagesCollection(db)),
    getDocs(blocksCollection(db)),
  ]);

  const pages = pageSnapshot.docs.map((item) => item.data() as Page);
  const blocks = blockSnapshot.docs.map((item) => ({
    ...(item.data() as Block),
    synced: true,
  }));

  return { pages, blocks };
};

export const syncWorkspaceToFirebase = async (pages: Page[], blocks: Block[]) => {
  const { db } = getFirebaseServices();
  const batch = writeBatch(db);

  batch.set(
    workspacePath(db),
    {
      id: workspaceId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  pages.forEach((page) => {
    batch.set(doc(pagesCollection(db), page.id), page, { merge: true });
  });

  blocks.forEach((block) => {
    batch.set(doc(blocksCollection(db), block.id), block, { merge: true });
  });

  await batch.commit();
};

export const syncSharesToFirebase = async (shares: ShareInvite[]) => {
  const { db } = getFirebaseServices();
  const batch = writeBatch(db);

  shares.forEach((share) => {
    batch.set(doc(sharesCollection(db), share.id), share, { merge: true });
  });

  await batch.commit();
};

export const deleteFirebaseShare = async (shareId: string) => {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(sharesCollection(db), shareId));
};

export const deleteFirebasePage = async (pageId: string) => {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(pagesCollection(db), pageId));
};

export const deleteFirebaseBlock = async (blockId: string) => {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(blocksCollection(db), blockId));
};

export const uploadBlockImage = async ({
  docId,
  pageId,
  blockId,
  file,
}: {
  docId: string;
  pageId: string;
  blockId: string;
  file: File;
}) => {
  const { storage } = getFirebaseServices();
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '-');
  const path = `workspaces/${workspaceId}/docs/${docId}/pages/${pageId}/blocks/${blockId}/${Date.now()}-${safeName}`;
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

export const saveBlockToFirebase = async (block: Block) => {
  const { db } = getFirebaseServices();
  await setDoc(doc(blocksCollection(db), block.id), block, { merge: true });
};
