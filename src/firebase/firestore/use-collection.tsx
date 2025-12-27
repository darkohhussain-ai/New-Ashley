'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Query,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';

import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type CollectionOptions = {
  constraints?: QueryConstraint[];
};

export function useCollection<T>(
  path: string,
  options?: CollectionOptions
): { data: T[]; isLoading: boolean; error: Error | null } {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedOptions = useMemo(
    () => options,
    [JSON.stringify(options?.constraints)]
  );

  useEffect(() => {
    const collectionRef = collection(firestore, path);
    const queryRef = memoizedOptions?.constraints
      ? query(collectionRef, ...memoizedOptions.constraints)
      : collectionRef;

    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setIsLoading(false);
      },
      (err) => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        });

        errorEmitter.emit('permission-error', contextualError);
        setError(contextualError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path, memoizedOptions]);

  return { data, isLoading, error };
}
