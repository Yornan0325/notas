import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const getWorkspaceId = () => {
  if (!isFirebaseConfigured) return 'default';
  try {
    const auth = getFirebaseAuth();
    return auth?.currentUser?.uid || auth?.currentUser?.email || 'default';
  } catch {
    return 'default';
  }
};

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId
);

export const getFirebaseServices = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase no esta configurado. Revisa las variables VITE_FIREBASE_*.');
  }

  if (!app) {
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  }

  return {
    db: firestore as Firestore,
    storage: storage as FirebaseStorage,
    auth: auth as Auth,
  };
};

export const getFirebaseAuth = () => {
  const { auth } = getFirebaseServices();
  return auth;
};

export const getFirestoreDB = () => {
  const { db } = getFirebaseServices();
  return db;
};


