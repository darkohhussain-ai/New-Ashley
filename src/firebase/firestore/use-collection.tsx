'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  DocumentData,
  FirestoreError,
  onSnapshot,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirebase } from '@/firebase/provider';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  setData: React.Dispatch<React.SetStateAction<WithId<T>[] | null>>;
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * Custom hook that listens to a Firestore collection and provides real-time updates.
 * @template T Type of the document data in the collection.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery A memoized Firestore collection/query reference.
 * @returns {UseCollectionResult<T>} An object containing the collection data, loading state, and error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { isUserLoading } = useFirebase();

  // Combine local loading state with user loading state
  const [isCollectionLoading, setIsCollectionLoading] = useState<boolean>(true);
  const isLoading = isUserLoading || isCollectionLoading;

  useEffect(() => {
    // Wait until Firebase auth is initialized and we have a query
    if (isUserLoading || !memoizedTargetRefOrQuery) {
      if (!memoizedTargetRefOrQuery) {
        setIsCollectionLoading(false);
      }
      return;
    }
    
    if(!memoizedTargetRefOrQuery.__memo) {
      console.warn("useCollection was passed a query that was not wrapped in useMemoFirebase. This can lead to infinite render loops.");
    }

    setIsCollectionLoading(true);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as WithId<T>[];
        setData(docs);
        setIsCollectionLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        let path = "unknown";
        if(memoizedTargetRefOrQuery.type === 'collection') {
          path = (memoizedTargetRefOrQuery as CollectionReference).path;
        } else if(memoizedTargetRefOrQuery.type === 'query') {
          path = (memoizedTargetRefOrQuery as any)._query.path.segments.join('/');
        }
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        })
        
        errorEmitter.emit('permission-error', contextualError);
        setError(contextualError);
        setIsCollectionLoading(false);
        setData(null);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, isUserLoading]);
  
  return { data, isLoading, error, setData };
}
