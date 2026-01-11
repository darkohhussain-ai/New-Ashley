
"use client"
import { useState, useEffect, useCallback } from 'react';
import { get, set, clear, keys, del, UseStore } from 'idb-keyval';

// A list of all collections managed by the application
const collections = [
    'employees', 'excel_files', 'items', 'storage_locations', 'expenses', 
    'expense_reports', 'overtime', 'bonuses', 'cash_withdrawals', 'sold_item_receipts', 
    'transfers', 'transfer_items', 'marketing_feedbacks', 'evaluation_questions',
    'users', 'roles',
    'app-language', 'translations-en', 'translations-ku',
    'light-theme-colors', 'dark-theme-colors', 'dashboard-banner', 
    'dashboard-banner-height', 'app-logo', 'login-background-image', 
    'ashley-salary-settings', 'pdf-settings'
];

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    get(key).then(val => {
        if (val !== undefined) {
            setStoredValue(val);
        } else {
            set(key, initialValue);
            setStoredValue(initialValue);
        }
    }).finally(() => {
        setIsInitialized(true);
    });
  }, [key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined' || !isInitialized) {
      return;
    }
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    set(key, valueToStore);
  }, [key, storedValue, isInitialized]);

  return [storedValue, setValue];
}

export const getAllDataForExport = async (): Promise<Record<string, any>> => {
    const data: Record<string, any> = {};
    const allKeys = await keys();

    for (const key of allKeys) {
        if (typeof key === 'string' && collections.includes(key)) {
            const value = await get(key);
            if (value !== undefined) {
                data[key] = value;
            }
        }
    }
    return data;
};

export const importData = async (data: Record<string, any>) => {
    // Clear all existing data managed by the app
    const allKeys = await keys();
    for (const key of allKeys) {
      if(typeof key === 'string' && collections.includes(key)) {
        await del(key);
      }
    }

    // Import new data
    for (const key in data) {
        if (collections.includes(key)) {
            await set(key, data[key]);
        }
    }
};

export default useLocalStorage;
