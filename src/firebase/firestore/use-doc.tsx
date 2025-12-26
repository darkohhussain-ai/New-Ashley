'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  DocumentData,
  FirestoreError,
  Timestamp,
} from 'firebase/firestore';

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

// --- MOCK DATA FOR OFFLINE DEVELOPMENT ---

const mockEmployees = [
    { id: 'emp1', name: 'John Doe', jobTitle: 'Manager', employmentStartDate: Timestamp.now(), dateOfBirth: Timestamp.fromDate(new Date('1990-01-15')), email: 'john.doe@example.com', phone: '123-456-7890', photoUrl: 'https://picsum.photos/seed/emp1/100/100' },
    { id: 'emp2', name: 'Jane Smith', jobTitle: 'Developer', employmentStartDate: Timestamp.now(), dateOfBirth: Timestamp.fromDate(new Date('1992-05-20')), email: 'jane.smith@example.com', phone: '987-654-3210', photoUrl: 'https://picsum.photos/seed/emp2/100/100' }
];

const MOCK_SINGLE_DOCS: Record<string, any> = {
    'employees': mockEmployees[0],
     'excel_files': { id: 'file1', storekeeperId: 'emp2', storageName: 'Q1 Inventory.xlsx', categoryName: 'Living Room', date: Timestamp.now(), source: 'Ashley Store', type: 'imported' }
};

function getMockDocForPath(path: string) {
    const [collectionName, docId] = path.split('/');
    const collection = MOCK_SINGLE_DOCS[collectionName];
    if (collection && Array.isArray(collection)) {
        return collection.find(doc => doc.id === docId) || collection[0];
    }
    return MOCK_SINGLE_DOCS[collectionName] || null;
}


/**
 * OFFLINE VERSION of useDoc hook. Returns mock data.
 * Does not connect to Firestore.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const timer = setTimeout(() => {
        if (!memoizedDocRef) {
            setData(null);
        } else {
            const mockDoc = getMockDocForPath(memoizedDocRef.path);
            setData(mockDoc ? (mockDoc as WithId<T>) : null);
        }
        setIsLoading(false);
    }, 500); // Simulate network delay

    return () => clearTimeout(timer);
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
