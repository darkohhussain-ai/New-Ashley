'use client';

import React, { createContext, useState, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import en from '@/locales/en.json';
import ku from '@/locales/ku.json';

export type Language = 'en' | 'ku';

// The structure of our translation files
type Translations = Record<string, string>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create the context with a default value
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// The provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<Language>('app-language', 'en');
  
  // For simplicity, we'll keep the translations in memory. 
  // The settings page can still modify them via local storage if needed,
  // but this provider will just use the imported JSONs for reliability.
  const translations: Record<Language, Translations> = { en, ku };

  const t = useCallback((key: string): string => {
    // Fallback logic: If a key is not found in the current language, try English. If still not found, return the key itself.
    return translations[language][key] || translations['en'][key] || key;
  }, [language, translations]);

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
