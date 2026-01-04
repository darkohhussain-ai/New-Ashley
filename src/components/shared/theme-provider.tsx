
"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import useLocalStorage from "@/hooks/use-local-storage"

type Theme = "dark" | "light"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  useEffect(() => {
    if (!isMounted) return;

    // This effect handles applying the custom font to the document.
    const styleId = 'custom-app-font-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }
    
    if (customFontBase64) {
        styleElement.innerHTML = `
            @font-face {
                font-family: 'CustomAppFont';
                src: url(${customFontBase64});
            }
            body {
                font-family: 'CustomAppFont', var(--font-body), sans-serif !important;
            }
        `;
    } else {
        // If no custom font, revert to the default body font
        styleElement.innerHTML = `
             body {
                font-family: var(--font-body), sans-serif;
            }
        `;
    }

  }, [customFontBase64, isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    const storedTheme = localStorage.getItem("ashley-drp-theme") as Theme | null
    if (storedTheme) {
      setTheme(storedTheme)
    } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [isMounted])

  useEffect(() => {
    if (!isMounted) return;
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("ashley-drp-theme", theme)
  }, [theme, isMounted])

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
