
"use client"

import { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useAppContext } from "@/context/app-provider"
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { doc } from 'firebase/firestore'

type Theme = "dark" | "light"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings: globalSettings, isLoading: isAppLoading } = useAppContext();
  const { user, loading: isAuthLoading } = useAuth();
  const db = useFirestore();

  // Get user-specific setting from Firestore
  const userSettingsRef = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return doc(db, 'users', user.id, 'settings', 'main');
  }, [db, user]);

  const { data: userSettings, isLoading: isUserSettingsLoading } = useDoc<{ darkModeEnabled: boolean }>(userSettingsRef);
  
  // Determine the effective theme
  const theme = useMemo(() => {
    // Check for user-specific setting first
    if (userSettings && typeof userSettings.darkModeEnabled === 'boolean') {
        return userSettings.darkModeEnabled ? 'dark' : 'light';
    }
    // Fallback to global app setting
    return globalSettings?.theme || 'light';
  }, [userSettings, globalSettings]);


  // Apply theme class to HTML element
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    // We only set the theme for the logged-in user. We don't touch global settings.
    if (userSettingsRef) {
        setDocumentNonBlocking(userSettingsRef, { darkModeEnabled: newTheme === 'dark' }, { merge: true });
    }
  }, [userSettingsRef]);
  
  // The main AppProvider handles the initial splash screen
  if (isAppLoading || isAuthLoading) {
    return null;
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
