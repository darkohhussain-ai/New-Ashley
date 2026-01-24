
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

export async function initializeFirebase() {
  if (getApps().length) {
    return await getSdks(getApp());
  }

  let firebaseApp;
  try {
    // This will succeed on App Hosting where env vars are present.
    firebaseApp = initializeApp();
  } catch (e) {
    // This will fail in other environments (like local dev), which is expected.
    console.log("Firebase auto-init failed, using local config. This is normal for development.");
    firebaseApp = initializeApp(firebaseConfig);
  }

  return await getSdks(firebaseApp);
}

export async function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  try {
    await enableIndexedDbPersistence(firestore);
  } catch (err: any) {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one.
        // Silently fail, as another tab is handling persistence.
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence.
        console.warn("Firestore persistence is not available in this browser.");
      }
  }

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
