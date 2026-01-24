
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

export async function initializeFirebase() {
  if (getApps().length) {
    return await getSdks(getApp());
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

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
