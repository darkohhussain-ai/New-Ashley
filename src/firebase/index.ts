'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  doc, 
  collection, 
  query, 
  where, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export async function initializeFirebase() {
  if (getApps().length) {
    const app = getApp();
    return await getSdks(app);
  }

  const firebaseApp = initializeApp(firebaseConfig);
  return await getSdks(firebaseApp);
}

export async function getSdks(firebaseApp: FirebaseApp) {
  const firestore = initializeFirestore(firebaseApp, {
      cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore,
    storage: getStorage(firebaseApp)
  };
}

// Export common Firestore functions from a central place
export {
  doc,
  collection,
  query,
  where,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
};

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
