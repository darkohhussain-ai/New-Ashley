
"use client"
import { useState, useEffect, useCallback } from 'react';
import { get, set, keys, del } from 'idb-keyval';
import { produce } from 'immer';

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


function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? produce(storedValue, value) : value;

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
            del(fromIdbKey(JSON.parse(existingItem))).catch(err => console.error("Could not clean up old IDB key:", err));
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

// Merges a new item into an existing array, updating it if it exists or adding it if it doesn't.
const mergeItem = <T extends { id: string }>(existingArray: T[], newItem: T): T[] => {
    return produce(existingArray, draft => {
        const index = draft.findIndex(item => item.id === newItem.id);
        if (index !== -1) {
            draft[index] = { ...draft[index], ...newItem }; // Merge properties
        } else {
            draft.push(newItem);
        }
    });
};

// Merges an array of new items into an existing array.
const mergeArray = <T extends { id: string }>(existingArray: T[] = [], newItems: T[] = []): T[] => {
    if (!Array.isArray(existingArray) || !Array.isArray(newItems)) return existingArray;
    return produce(existingArray, draft => {
        newItems.forEach(newItem => {
            const index = draft.findIndex(item => item.id === newItem.id);
            if (index !== -1) {
                draft[index] = { ...draft[index], ...newItem };
            } else {
                draft.push(newItem);
            }
        });
    });
};

export const importData = async (data: Record<string, any>) => {
    // This function now merges data instead of overwriting.
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const newValue = data[key];
            const existingRaw = localStorage.getItem(key);
            let existingValue: any;

            if (existingRaw) {
                try {
                    const parsed = JSON.parse(existingRaw);
                    if (typeof parsed === 'string' && isIdbKey(parsed)) {
                        existingValue = await get(fromIdbKey(parsed));
                    } else {
                        existingValue = parsed;
                    }
                } catch {
                    existingValue = existingRaw;
                }
            }

            let valueToStore = newValue;
            // If both new and existing values are arrays, merge them.
            if (Array.isArray(existingValue) && Array.isArray(newValue)) {
                valueToStore = mergeArray(existingValue, newValue);
            } else if (typeof newValue === 'string' && !isIdbKey(newValue)) {
                try {
                    // If the new value is a string that can be parsed, we probably want to store it as an object
                    // but if not, store as string.
                    valueToStore = JSON.parse(newValue);
                } catch {
                    valueToStore = newValue;
                }
            }

            if (isLargeValue(valueToStore)) {
                await set(key, valueToStore);
                localStorage.setItem(key, JSON.stringify(toIdbKey(key)));
            } else {
                 if (typeof valueToStore === 'string') {
                    localStorage.setItem(key, valueToStore);
                } else {
                    localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            }
        }
    }
};


export default useLocalStorage;
