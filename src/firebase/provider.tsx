'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, onSnapshot, doc } from 'firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp?: FirebaseApp;
  firestore?: Firestore;
  auth?: Auth;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; 
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; 
  user: User | null;
  isUserLoading: boolean; 
  userError: Error | null; 
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser()
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * Manages and provides Firebase services and user authentication state.
 * @param {FirebaseProviderProps} props The provider props.
 * @returns {React.FC} A React component that provides the Firebase context.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children, firebaseApp, firestore, auth }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  // Determine if Firebase services are available
  const areServicesAvailable = !!(firebaseApp && firestore && auth);

  useEffect(() => {
    if (areServicesAvailable) {
      const unsubscribe = onAuthStateChanged(
        auth!,
        (user) => {
          setUser(user);
          setIsUserLoading(false);
        },
        (error) => {
          setUserError(error);
          setIsUserLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setIsUserLoading(false);
    }
  }, [areServicesAvailable, auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
      areServicesAvailable,
      firebaseApp: firebaseApp || null,
      firestore: firestore || null,
      auth: auth || null,
      user,
      isUserLoading,
      userError,
  }), [areServicesAvailable, firebaseApp, firestore, auth, user, isUserLoading, userError]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 * @returns {FirebaseServicesAndUser} An object containing the Firebase services and user state.
 */
export const useFirebase = (): Partial<FirebaseServicesAndUser> => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  // If services aren't available yet, return a loading state.
  if (!context.areServicesAvailable) {
    return {
      isUserLoading: context.isUserLoading,
      user: null,
      userError: context.userError,
    };
  }

  return {
    firebaseApp: context.firebaseApp as FirebaseApp,
    firestore: context.firestore as Firestore,
    auth: context.auth as Auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. Throws error if not available. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  if (!auth) throw new Error('Firebase Auth is not available.');
  return auth;
};

/** Hook to access Firestore instance. Throws error if not available. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firestore is not available.');
  return firestore;
};

/** Hook to access Firebase App instance. Throws error if not available. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) throw new Error('Firebase App is not available.');
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/** Hook specifically for accessing the authenticated user's state. */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user: user || null, isUserLoading: !!isUserLoading, userError: userError || null };
};
