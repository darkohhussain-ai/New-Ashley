"use client"
import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      // Try to parse as JSON, but fall back to the raw item if it's not valid JSON
      try {
        return JSON.parse(item);
      } catch (e) {
        // If it's a string that's not JSON, it might be stored directly
        // This is a bit of a type-cast, assuming if it's not JSON, it's a string-like value.
        // This is okay for this hook's usage in the app (e.g., 'app-font').
        return item as unknown as T;
      }
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        // Only stringify if it's not already a string, to avoid double quotes on simple strings
        const itemToSet = typeof valueToStore === 'string' ? valueToStore : JSON.stringify(valueToStore);
        window.localStorage.setItem(key, itemToSet);
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        try {
          setStoredValue(JSON.parse(item));
        } catch (e) {
          setStoredValue(item as unknown as T);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
