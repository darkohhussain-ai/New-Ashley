'use client';

import { initializeFirebase } from './index';
import { FirebaseProvider, AuthGate } from './provider';

let firebaseApp: ReturnType<typeof initializeFirebase> | undefined;

function getFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = initializeFirebase();
  return firebaseApp;
}

export function FirebaseClientProvider({
  children,
}: React.PropsWithChildren) {
  const { firebaseApp, auth, firestore } = getFirebase();

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      <AuthGate>{children}</AuthGate>
    </FirebaseProvider>
  );
}
