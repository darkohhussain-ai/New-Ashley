'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

export async function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return await getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return await getSdks(getApp());
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
export * from './errors';
export * from './error-emitter';
