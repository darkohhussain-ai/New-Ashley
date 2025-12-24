'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  // In a deployed Firebase App Hosting environment, the SDK is automatically
  // initialized with the correct configuration. In other environments, we
  // fall back to the firebaseConfig object.
  // The FIREBASE_APP_HOSTING_CONFIG environment variable is set automatically
  // by the App Hosting backend.
  if (process.env.NEXT_PUBLIC_FIREBASE_APP_HOSTING_CONFIG) {
    try {
      const app = initializeApp();
      return getSdks(app);
    } catch (e) {
       console.error(
        'Automatic Firebase initialization failed, falling back to firebaseConfig. This may happen if you are developing locally.',
        e
      );
    }
  }

  const app = initializeApp(firebaseConfig);
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
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
