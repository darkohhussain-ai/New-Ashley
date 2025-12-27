'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { type FirebaseApp } from 'firebase/app';
import {
  type Auth,
  signInAnonymously,
} from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import { useUser } from './auth/use-user';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

export function FirebaseProvider({
  firebaseApp,
  auth,
  firestore,
  children,
}: React.PropsWithChildren<FirebaseContextValue>) {
  const contextValue = useMemo(
    () => ({ firebaseApp, auth, firestore }),
    [firebaseApp, auth, firestore]
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
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


export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}

export function useFirestore() {
  return useFirebase().firestore;
}

export function useAuth() {
  return useFirebase().auth;
}
