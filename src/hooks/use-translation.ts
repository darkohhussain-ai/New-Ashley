
'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/context/language-provider';

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { translations, setLanguage, language } = context;

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return { t, setLanguage, language };
}
