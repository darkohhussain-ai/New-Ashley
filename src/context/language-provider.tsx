'use client';

import React, { createContext, useState, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import en from '@/locales/en.json';
import ku from '@/locales/ku.json';

export type Language = 'en' | 'ku';

// The structure of our translation files
export type Translations = Record<string, string>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: Record<Language, Translations>;
  setTranslations: (lang: Language, newTranslations: Translations) => void;
}

// Create the context with a default value
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// The provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<Language>('app-language', 'en');
  const [enTranslations, setEnTranslations] = useLocalStorage<Translations>('translations-en', en);
  const [kuTranslations, setKuTranslations] = useLocalStorage<Translations>('translations-ku', ku);
  
  const translations = {
    en: enTranslations,
    ku: kuTranslations,
  };

  const t = useCallback((key: string): string => {
    // Fallback logic: If a key is not found in the current language, try English. If still not found, return the key itself.
    const lang = translations[language];
    const enLang = translations['en'];
    return (lang && lang[key]) || (enLang && enLang[key]) || key;
  }, [language, translations]);

  const setTranslations = useCallback((lang: Language, newTranslations: Translations) => {
    if (lang === 'en') {
      setEnTranslations(newTranslations);
    } else if (lang === 'ku') {
      setKuTranslations(newTranslations);
    }
  }, [setEnTranslations, setKuTranslations]);

  const value = {
    language,
    setLanguage,
    t,
    translations,
    setTranslations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
