
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import en from '@/locales/en.json';
import ku from '@/locales/ku.json';

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

const defaultTranslations = { en, ku };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  
  const [englishTranslations, setEnglishTranslations] = useLocalStorage('translations_en', defaultTranslations.en);
  const [kurdishTranslations, setKurdishTranslations] = useLocalStorage('translations_ku', defaultTranslations.ku);

  useEffect(() => {
    const storedLanguage = localStorage.getItem('ashley-hr-lang') as Language | null;
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'ku')) {
      setLanguageState(storedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ashley-hr-lang', lang);
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
    const translations = language === 'en' ? englishTranslations : kurdishTranslations;
    return translations[key] || key;
  }, [language, englishTranslations, kurdishTranslations]);

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
