
"use client"
import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useAppContext } from "@/context/app-provider";

type Theme = "dark" | "light"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, setSettings, isLoading } = useAppContext();
  
  const theme = settings?.theme || 'light';

  const setTheme = (newTheme: Theme) => {
      if (settings) {
          setSettings({ ...settings, theme: newTheme });
      }
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  if (isLoading) {
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
