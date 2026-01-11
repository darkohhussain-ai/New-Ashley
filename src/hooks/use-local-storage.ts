
"use client"
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    // For now, we always start with the initial value and let Firestore populate the data.
    // This simplifies the logic by removing the need to read from localStorage/IDB on boot.
    setStoredValue(initialValue);
  }, [key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
     // The actual data setting is now handled by Firestore hooks in the AppProvider.
     // This hook's setValue will update the local state for immediate UI feedback,
     // but the persistence is managed by the parent component that uses this hook
     // and then calls the appropriate Firestore function.
     const valueToStore = value instanceof Function ? value(storedValue) : value;
     setStoredValue(valueToStore);

  }, [storedValue]);


  return [storedValue, setValue];
}

export const getAllDataForExport = async (): Promise<Record<string, any>> => {
    // This functionality will now be handled server-side or via a dedicated backup utility
    // that has direct access to Firestore, as client-side export is no longer feasible.
    console.warn("Client-side data export is deprecated. Please use a server-side backup solution.");
    return {};
};


export const importData = async (data: Record<string, any>) => {
    console.warn("Client-side data import is deprecated. Please use a server-side restore solution.");
};


export default useLocalStorage;
