
'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/context/language-provider';

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { t, setLanguage, language } = context;

  return { t, setLanguage, language };
}
