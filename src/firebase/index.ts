
'use client';
// This file is part of the Firebase integration.
// Since we are reverting to an offline-first approach, the functions here are placeholders
// and not actively used. They are kept for potential future re-integration.

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

export function getFirebase() {
  // Return null or a mock object to prevent errors
  return null;
}
