
"use client"
import { useState, useEffect, useCallback } from 'react';
import { get, set, keys, del, clear } from 'idb-keyval';
import { produce } from 'immer';

// Simple heuristic to decide if a value is "large" and should go to IndexedDB
const isLargeValue = (value: any): boolean => {
  if (typeof value === 'string' && (value.startsWith('data:image') || value.startsWith('data:font'))) {
    return true; // All images and fonts go to IndexedDB
  }
  try {
    // If stringifying the object makes it larger than 100KB, store in IDB.
    return JSON.stringify(value).length > 100 * 1024;
  } catch {
    return false;
  }
};

const idbKeyPrefix = 'idb_';
const isIdbKey = (key: string) => typeof key === 'string' && key.startsWith(idbKeyPrefix);
const toIdbKey = (key: string) => `${idbKeyPrefix}${key}`;
const fromIdbKey = (key: string) => key.substring(idbKeyPrefix.length);


function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => initialValue);

  // Effect to load initial value from either localStorage or IndexedDB
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const item = window.localStorage.getItem(key);
    if (item) {
      try {
        // IDB pointers are stored as JSON strings like ""idb_...""
        if (item.startsWith('"') && item.endsWith('"')) {
            const parsedItem = JSON.parse(item);
            if (typeof parsedItem === 'string' && isIdbKey(parsedItem)) {
                get(fromIdbKey(parsedItem)).then(idbValue => {
                    if (idbValue !== undefined) {
                      setStoredValue(idbValue);
                    }
                });
                return; // Exit here to avoid falling through
            }
        }
        
        // For other JSON or raw strings
        try {
            setStoredValue(JSON.parse(item));
        } catch {
            setStoredValue(item as any); // It's a raw string value
        }

      } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
        setStoredValue(initialValue);
      }
    } else {
        setStoredValue(initialValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? produce(storedValue, value) : value;

      if (isLargeValue(valueToStore)) {
        const idbKey = key;
        set(idbKey, valueToStore)
          .then(() => {
            window.localStorage.setItem(key, JSON.stringify(toIdbKey(idbKey)));
            setStoredValue(valueToStore);
          })
          .catch(err => console.error("Failed to set value in IndexedDB:", err));
      } else {
        const existingItem = window.localStorage.getItem(key);
        if(existingItem) {
            try {
              if (existingItem.startsWith('"')) { // Check if it could be a JSON string pointer
                const parsedItem = JSON.parse(existingItem);
                if (isIdbKey(parsedItem)) {
                    del(fromIdbKey(parsedItem)).catch(err => console.error("Could not clean up old IDB key:", err));
                }
              }
            } catch {}
        }
        
        if (typeof valueToStore === 'string') {
          window.localStorage.setItem(key, valueToStore);
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        setStoredValue(valueToStore);
      }
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'QuotaExceededError')) {
          console.error(`Local Storage quota exceeded for key: "${key}". The data could not be saved.`, error);
      } else {
          console.error(`Error saving to localStorage for key "${key}":`, error);
      }
    }
  }, [key, storedValue]);


  return [storedValue, setValue];
}

export const getAllDataForExport = async (): Promise<Record<string, any>> => {
    const data: Record<string, any> = {};
    const allLocalStorageKeys = Object.keys(localStorage);

    for (const key of allLocalStorageKeys) {
        if (!key.startsWith('genkit:')) {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    data[key] = JSON.parse(item);
                } catch {
                    data[key] = item;
                }
            }
        }
    }

    const idbKeysList = await keys();
    for (const key of idbKeysList) {
        if (typeof key === 'string') {
            data[key] = await get(key);
        }
    }

    return data;
};


export const importData = async (data: Record<string, any>) => {
    // Clear existing data first for a clean import
    localStorage.clear();
    await clear();
    
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            
            // Check if the key is one that should be in IndexedDB or localStorage
            if (isIdbKey(value)) {
                // This is a pointer. The actual data is also in our export.
                // We let the main loop handle writing the actual data to IDB.
                // Here we just write the pointer to localStorage.
                 localStorage.setItem(key, JSON.stringify(value));
            } else if (isLargeValue(value)) {
                 await set(key, value);
                 localStorage.setItem(key, JSON.stringify(toIdbKey(key)));
            }
            else {
                if (typeof value === 'string') {
                    localStorage.setItem(key, value);
                } else {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            }
        }
    }
};


export default useLocalStorage;
