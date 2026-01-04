
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import en from '@/locales/en.json';
import ku from '@/locales/ku.json';


export type Language = 'en' | 'ku';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
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
  
  const [language, setLanguage] = useLocalStorage<Language>('app-language', 'en');
  const [englishTranslations, setEnglishTranslations] = useLocalStorage('translations_en', defaultTranslations.en);
  const [kurdishTranslations, setKurdishTranslations] = useLocalStorage('translations_ku', defaultTranslations.ku);
  
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
    if (language === 'ku') {
      return kurdishTranslations[key] || englishTranslations[key] || key;
    }
    return englishTranslations[key] || key;
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
