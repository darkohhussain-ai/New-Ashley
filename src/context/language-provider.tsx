
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import en from '@/locales/en.json';

type Language = 'en'; // Only English is supported now.

interface LanguageContextType {
  language: Language;
  translations: {
    en: Record<string, string>;
  };
  setTranslations: (translations: Record<string, string>, lang: Language) => void;
  resetTranslations: () => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const defaultTranslations = { en };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language: Language = 'en'; // Hardcode to English
  
  const [englishTranslations, setEnglishTranslations] = useLocalStorage('translations_en', defaultTranslations.en);
  
  const setTranslations = useCallback((newTranslations: Record<string, string>, lang: Language) => {
    if (lang === 'en') {
      setEnglishTranslations(newTranslations);
    }
  }, [setEnglishTranslations]);

  const resetTranslations = useCallback(() => {
      setEnglishTranslations(defaultTranslations.en);
  }, [setEnglishTranslations]);

  const t = useCallback((key: string): string => {
    return englishTranslations[key] || key;
  }, [englishTranslations]);

  const value = {
    language,
    translations: { en: englishTranslations },
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
