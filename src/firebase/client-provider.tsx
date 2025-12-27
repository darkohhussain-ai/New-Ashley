'use client';

import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { useUser } from './auth/use-user';
import { useAuth } from './provider';
import { signInAnonymously } from 'firebase/auth';
import { useEffect, useState } from 'react';


let firebaseApp: ReturnType<typeof initializeFirebase> | undefined;

function getFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = initializeFirebase();
  return firebaseApp;
}

function AuthGate({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const [isSigningIn, setIsSigningIn] = useState(true);

    useEffect(() => {
        if (isUserLoading) return; 

        if (user) {
            setIsSigningIn(false);
        } else {
            signInAnonymously(auth).catch((error) => {
                console.error("Anonymous sign-in failed:", error);
            }).finally(() => {
                setIsSigningIn(false);
            });
        }
    }, [user, isUserLoading, auth]);

    if (isUserLoading || isSigningIn) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    
    return <>{children}</>;
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
