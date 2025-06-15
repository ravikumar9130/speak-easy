'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load value from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          setStoredValue(parsed);
        }
        setIsLoaded(true);
      }
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      setIsLoaded(true);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // Dispatch custom event to sync across tabs/components
        window.dispatchEvent(new CustomEvent('localStorage', {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes from other tabs/components
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    const handleNativeStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('localStorage', handleStorageChange as EventListener);
      window.addEventListener('storage', handleNativeStorageChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('localStorage', handleStorageChange as EventListener);
        window.removeEventListener('storage', handleNativeStorageChange);
      }
    };
  }, [key]);

  return [storedValue, setValue, isLoaded] as const;
}