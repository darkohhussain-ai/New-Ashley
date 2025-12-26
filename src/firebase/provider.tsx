'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User } from 'firebase/auth';

// --- MOCK USER FOR OFFLINE DEVELOPMENT ---
const mockUser: User = {
    uid: 'mock-user-123',
    email: 'offline-user@example.com',
    emailVerified: true,
    displayName: 'Offline User',
    isAnonymous: false,
    photoURL: 'https://picsum.photos/seed/mock-user/100/100',
    providerData: [],
    metadata: {},
    providerId: 'password',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
};


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
 * OFFLINE VERSION of FirebaseProvider. Manages and provides mock Firebase services and user state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  
  const contextValue = useMemo((): FirebaseContextState => ({
      areServicesAvailable: true,
      firebaseApp: null, // Not available in offline mode
      firestore: null,   // Not available in offline mode
      auth: null,        // Not available in offline mode
      user: mockUser,
      isUserLoading: false, // Always false in offline mode
      userError: null,
  }), []);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 * NOTE: In offline mode, services will be null.
 */
export const useFirebase = (): Partial<FirebaseServicesAndUser> => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return {
    firebaseApp: context.firebaseApp as FirebaseApp, // Casting to satisfy type, will be null
    firestore: context.firestore as Firestore, // Casting to satisfy type, will be null
    auth: context.auth as Auth, // Casting to satisfy type, will be null
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. Will be null in offline mode. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth as Auth;
};

/** Hook to access Firestore instance. Will be null in offline mode. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore as Firestore;
};

/** Hook to access Firebase App instance. Will be null in offline mode. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp as FirebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * Returns a mock user in offline mode.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user: user || null, isUserLoading: !!isUserLoading, userError: userError || null };
};
