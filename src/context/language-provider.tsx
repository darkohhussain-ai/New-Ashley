
'use client';

import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAppContext } from './app-provider';
import { Translations } from '@/lib/types';

export type Language = 'en' | 'ku';

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
  const { settings, setSettings } = useAppContext();
  const [language, setSavedLanguage] = useLocalStorage<Language>('app-language', 'en');
  
  // Safely initialize state, falling back to empty objects if settings are not yet available.
  const [enTranslations, setEnTranslations] = useState<Translations>(settings?.translations?.en || {});
  const [kuTranslations, setKuTranslations] = useState<Translations>(settings?.translations?.ku || {});
  
  useEffect(() => {
    // This effect ensures that when the settings are loaded from Firestore,
    // the local translation states are updated accordingly.
    if (settings?.translations) {
      setEnTranslations(settings.translations.en);
      setKuTranslations(settings.translations.ku);
    }
  }, [settings]);

  const setLanguage = (lang: Language) => {
    setSavedLanguage(lang);
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
    if (!settings) return; // Guard against settings not being ready

    setSettings({
        ...settings,
        translations: {
            ...settings.translations,
            [lang]: newTranslations,
        },
    });
  }, [setSettings, settings]);

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
