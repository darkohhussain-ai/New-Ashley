'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  Timestamp,
} from 'firebase/firestore';

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

// --- MOCK DATA FOR OFFLINE DEVELOPMENT ---

const mockEmployees = [
    { id: 'emp1', name: 'John Doe', jobTitle: 'Manager', employmentStartDate: Timestamp.now(), dateOfBirth: Timestamp.fromDate(new Date('1990-01-15')), email: 'john.doe@example.com', phone: '123-456-7890', photoUrl: 'https://picsum.photos/seed/emp1/100/100' },
    { id: 'emp2', name: 'Jane Smith', jobTitle: 'Developer', employmentStartDate: Timestamp.now(), dateOfBirth: Timestamp.fromDate(new Date('1992-05-20')), email: 'jane.smith@example.com', phone: '987-654-3210', photoUrl: 'https://picsum.photos/seed/emp2/100/100' }
];

const mockItems = [
    { id: 'item1', model: 'Sofa-001', quantity: 2, destination: 'Erbil', notes: 'Handle with care', transferId: null, createdAt: Timestamp.now() },
    { id: 'item2', model: 'Chair-007', quantity: 10, destination: 'Baghdad', notes: '', transferId: null, createdAt: Timestamp.now() },
];

const mockTransfers = [
    { id: 'transfer1', cargoName: 'Shipment to Erbil', destinationCity: 'Erbil', driverName: 'Driver A', warehouseManagerName: 'Manager X', itemIds: ['item1'], transferDate: Timestamp.now() }
];

const MOCK_DATA_STORE: Record<string, any[]> = {
    'employees': mockEmployees,
    'items': mockItems,
    'transfers': mockTransfers,
    'expenses': [
        { id: 'exp1', employeeId: 'emp1', amount: 50, date: Timestamp.now(), notes: 'Team Lunch' }
    ],
    'excel_files': [
        { id: 'file1', storekeeperId: 'emp2', storageName: 'Q1 Inventory.xlsx', categoryName: 'Living Room', date: Timestamp.now(), source: 'Ashley Store', type: 'imported' }
    ],
    'storage_locations': [
        { id: 'loc1', name: 'A-4-1', warehouseType: 'Ashley' },
        { id: 'loc2', name: 'H-1-1-1', warehouseType: 'Huana' },
    ],
};

function getMockDataForPath(path: string) {
    if (path.startsWith('excel_files/')) {
        return [{ id: 'item-sub1', fileId: path.split('/')[1], model: 'Sub Item 1', quantity: 5 }];
    }
    const collectionName = path.split('/')[0];
    return MOCK_DATA_STORE[collectionName] || [];
}

/**
 * OFFLINE VERSION of useCollection hook. Returns mock data.
 * Does not connect to Firestore.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Simulate async data fetching
    const timer = setTimeout(() => {
      if (!memoizedTargetRefOrQuery) {
        setData(null);
      } else {
        let path = 'unknown';
        if (memoizedTargetRefOrQuery.type === 'collection') {
          path = (memoizedTargetRefOrQuery as CollectionReference).path;
        } else if (memoizedTargetRefOrQuery.type === 'query') {
          path = (memoizedTargetRefOrQuery as any)._query.path.segments.join('/');
        }
        setData(getMockDataForPath(path) as WithId<T>[]);
      }
      setIsLoading(false);
    }, 500); // 500ms delay to simulate network

    return () => clearTimeout(timer);
  }, [memoizedTargetRefOrQuery]);
  
  return { data, isLoading, error, setData };
}