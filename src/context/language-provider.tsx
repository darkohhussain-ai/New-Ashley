
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import ku from '@/locales/ku.json';

type Language = 'en' | 'ku';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Record<string, string>;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translationsData: Record<Language, Record<string, string>> = {
  en,
  ku,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

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

  const value = {
    language,
    setLanguage,
    translations: translationsData[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
