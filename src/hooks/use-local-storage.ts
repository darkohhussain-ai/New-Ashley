
"use client"
import { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, getDocs, writeBatch, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { initialData } from '@/context/initial-data';

// A list of all collections managed by the application
const collections = [
    'employees', 'excel_files', 'items', 'storage_locations', 'expenses', 
    'expense_reports', 'overtime', 'bonuses', 'cash_withdrawals', 'sold_item_receipts', 
    'transfers', 'transfer_items', 'marketing_feedbacks', 'evaluation_questions',
    'users', 'roles'
];

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

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
    const db = getFirestore();
    const data: Record<string, any> = {};

    for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        data[collectionName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Also get settings from localStorage
    const settingsKeys = ['light-theme-colors', 'dark-theme-colors', 'dashboard-banner', 'dashboard-banner-height', 'app-logo', 'login-background-image', 'ashley-salary-settings', 'pdf-settings', 'app-language', 'translations-en', 'translations-ku'];
    settingsKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                data[key] = JSON.parse(value);
            } catch (e) {
                data[key] = value;
            }
        }
    });

    return data;
};

export const importData = async (data: Record<string, any>) => {
    const db = getFirestore();
    const batch = writeBatch(db);

    // Clear existing data in all collections
    for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        querySnapshot.forEach(document => {
            batch.delete(document.ref);
        });
    }
    
    // Commit the deletions first
    await batch.commit();
    
    // Start a new batch for writes
    const writeBatch = writeBatch(db);

    // Import new data
    for (const collectionName of collections) {
        if (data[collectionName] && Array.isArray(data[collectionName])) {
            for (const item of data[collectionName]) {
                if (item.id) {
                    const { id, ...itemData } = item;
                    const docRef = doc(db, collectionName, id);
                    writeBatch.set(docRef, itemData);
                }
            }
        }
    }
    
    // Commit the writes
    await writeBatch.commit();
    
    // Import localStorage settings
    Object.keys(data).forEach(key => {
        if (!collections.includes(key)) {
            localStorage.setItem(key, JSON.stringify(data[key]));
        }
    });
};


export default useLocalStorage;

