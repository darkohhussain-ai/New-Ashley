'use client';
import {
  FirebaseApp,
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';
import {
  Auth,
  getAuth,
} from 'firebase/auth';
import {
  Firestore,
  getFirestore,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
} from 'firebase/storage';

import { firebaseConfig } from './config';
import { FirebaseClientProvider, FirebaseProvider } from './provider';

export {
  useAuth,
  useFirebaseApp,
  useFirestore,
  useStorage,
  useUser,
  useCollection,
  useDoc,
} from './hooks';

export { FirebaseClientProvider, FirebaseProvider };

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

export function getFirebase(): FirebaseServices {
  if (!firebaseApp) {
    //
    // Initialize Firebase
    //
    if (getApps().length) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);
  }
  return { app: firebaseApp, auth, db, storage };
}
