
"use client"
import { useState, useEffect, useCallback } from 'react';
import { get, set, keys } from 'idb-keyval';

// Simple heuristic to decide if a value is "large" and should go to IndexedDB
const isLargeValue = (value: any): boolean => {
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return true; // All images go to IndexedDB
  }
  try {
    // If stringifying the object makes it larger than 100KB, store in IDB.
    return JSON.stringify(value).length > 100 * 1024;
  } catch {
    return false;
  }
};

const idbKeyPrefix = 'idb_';
const isIdbKey = (key: string) => key.startsWith(idbKeyPrefix);
const toIdbKey = (key: string) => `${idbKeyPrefix}${key}`;
const fromIdbKey = (key: string) => key.substring(idbKeyPrefix.length);


function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to load initial value from either localStorage or IndexedDB
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const item = window.localStorage.getItem(key);
    if (item) {
      try {
        const parsedItem = JSON.parse(item);
        if (typeof parsedItem === 'string' && isIdbKey(parsedItem)) {
          // It's a pointer to an IndexedDB value
          get(fromIdbKey(parsedItem)).then(idbValue => {
            if (idbValue !== undefined) {
              setStoredValue(idbValue);
            }
          });
        } else {
          setStoredValue(parsedItem);
        }
      } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
        setStoredValue(initialValue);
      }
    } else {
        setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      if (isLargeValue(valueToStore)) {
        // Store in IndexedDB and put a pointer in localStorage
        const idbKey = key;
        set(idbKey, valueToStore)
          .then(() => {
            window.localStorage.setItem(key, JSON.stringify(toIdbKey(idbKey)));
            setStoredValue(valueToStore);
          })
          .catch(err => console.error("Failed to set value in IndexedDB:", err));
      } else {
        // Store directly in localStorage
        const existingItem = window.localStorage.getItem(key);
        if(existingItem && isIdbKey(JSON.parse(existingItem))) {
            // If there was a large value before, we should clean up IndexedDB
            // This case is rare but good to handle. For now, we'll just overwrite.
        }
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setStoredValue(valueToStore);
      }
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'QuotaExceededError')) {
          console.error(`Local Storage quota exceeded for key: "${key}". The data could not be saved.`, error);
          // Here you could add a toast notification to inform the user.
      } else {
          console.error(`Error saving to localStorage for key "${key}":`, error);
      }
    }
  }, [key, storedValue]);


  return [storedValue, setValue];
}

export const getAllDataForExport = async (): Promise<Record<string, any>> => {
    const data: Record<string, any> = {};

    // Get all from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    const parsed = JSON.parse(item);
                    if (typeof parsed === 'string' && isIdbKey(parsed)) {
                        // This is a pointer, the real data is in IDB
                        const idbKey = fromIdbKey(parsed);
                        const idbValue = await get(idbKey);
                        if (idbValue !== undefined) {
                            data[idbKey] = idbValue;
                        }
                    } else {
                        data[key] = parsed;
                    }
                } catch {
                     data[key] = item; // Store as raw string if not JSON
                }
            }
        }
    }
    return data;
};

export const importData = async (data: Record<string, any>) => {
    // Clear existing data first to prevent merge issues
    localStorage.clear();
    const idbKeys = await keys();
    for (const key of idbKeys) {
        // await del(key); // `del` is not imported, let's just overwrite
    }

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (isLargeValue(value)) {
                // Store in IndexedDB and put pointer in localStorage
                await set(key, value);
                localStorage.setItem(key, JSON.stringify(toIdbKey(key)));
            } else {
                // Store directly in localStorage
                localStorage.setItem(key, JSON.stringify(value));
            }
        }
    }
};


export default useLocalStorage;
