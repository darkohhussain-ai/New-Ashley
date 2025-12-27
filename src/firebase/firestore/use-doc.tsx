'use client';
import { useEffect, useState, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(
  path: string
): { data: T | null; isLoading: boolean; error: Error | null } {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setIsLoading(false);
      return;
    }
    
    const docRef = doc(firestore, path);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (err) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: path,
        });

        errorEmitter.emit('permission-error', contextualError);
        setError(contextualError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, isLoading, error };
}
