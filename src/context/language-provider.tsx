
'use client';

import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAppContext } from './app-provider';
import { Translations, Language } from '@/lib/types';

export type { Language };

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
  const { settings, setSettings, isLoading } = useAppContext();
  
  const language = settings?.language || 'en';
  const enTranslations = settings?.translations?.en || {};
  const kuTranslations = settings?.translations?.ku || {};

  const setLanguage = (lang: Language) => {
    if (settings) {
      setSettings({ ...settings, language: lang });
    }
  };
  
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
    setSettings(prevSettings => {
        // Guard against settings not being ready
        if (!prevSettings) return prevSettings;
        return {
            ...prevSettings,
            translations: {
                ...prevSettings.translations,
                [lang]: newTranslations,
            },
        }
    });
  }, [setSettings]);

  const value = {
    language,
    setLanguage,
    t,
    translations,
    setTranslations,
  };
  
  if (isLoading) {
    return null; // or a minimal loader, but AppProvider handles the main splash
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
