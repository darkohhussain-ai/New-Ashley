'use client';
    
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  DocumentReference,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirebase } from '@/firebase/provider';


/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * Custom hook that listens to a Firestore document and provides real-time updates.
 * @template T Type of the document data.
 * @param {DocumentReference<DocumentData> | null | undefined} memoizedDocRef A memoized Firestore document reference.
 * @returns {UseDocResult<T>} An object containing the document data, loading state, and error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { user, isUserLoading } = useFirebase();

  const [isDocLoading, setIsDocLoading] = useState<boolean>(true);
  const isLoading = isUserLoading || isDocLoading;


  useEffect(() => {
    // Wait until Firebase auth is initialized, we have a user, and a doc ref.
    if (isUserLoading || !user || !memoizedDocRef) {
      if (!memoizedDocRef || !user) {
        setIsDocLoading(false);
      }
      return;
    }
    
    if(!(memoizedDocRef as any).__memo) {
      console.warn("useDoc was passed a ref that was not wrapped in useMemoFirebase. This can lead to infinite render loops.");
    }

    setIsDocLoading(true);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (doc) => {
        if (doc.exists()) {
          setData({ ...doc.data(), id: doc.id } as WithId<T>);
        } else {
          setData(null);
        }
        setIsDocLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          path: memoizedDocRef.path,
          operation: 'get',
        })
        errorEmitter.emit('permission-error', contextualError);
        setError(contextualError);
        setIsDocLoading(false);
        setData(null);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, isUserLoading, user]);

  return { data, isLoading, error };
}
