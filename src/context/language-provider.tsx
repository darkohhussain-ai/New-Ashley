
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import en from '@/locales/en.json';

type Language = 'en' | 'ku';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: {
    en: Record<string, string>;
    ku: Record<string, string>;
  };
  setTranslations: (translations: Record<string, string>, lang: Language) => void;
  resetTranslations: () => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const defaultTranslations = { en, ku: en }; // Default Kurdish to English

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  
  const [englishTranslations, setEnglishTranslations] = useLocalStorage('translations_en', defaultTranslations.en);
  const [kurdishTranslations, setKurdishTranslations] = useLocalStorage('translations_ku', defaultTranslations.ku);

  const setLanguage = (lang: Language) => {
    // This function is now a no-op as we are removing the language switcher.
    // We will keep it in the context to avoid breaking dependencies, but it won't do anything.
  };

  const setTranslations = useCallback((newTranslations: Record<string, string>, lang: Language) => {
    if (lang === 'en') {
      setEnglishTranslations(newTranslations);
    } else {
      setKurdishTranslations(newTranslations);
    }
  }, [setEnglishTranslations, setKurdishTranslations]);

  const resetTranslations = useCallback(() => {
      setEnglishTranslations(defaultTranslations.en);
      setKurdishTranslations(defaultTranslations.ku);
  }, [setEnglishTranslations, setKurdishTranslations]);

  const t = useCallback((key: string): string => {
    // Always return English for now
    return englishTranslations[key] || key;
  }, [englishTranslations]);

  const value = {
    language,
    setLanguage,
    translations: { en: englishTranslations, ku: kurdishTranslations },
    setTranslations,
    resetTranslations,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
