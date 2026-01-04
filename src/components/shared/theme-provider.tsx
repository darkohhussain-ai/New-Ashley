"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import useLocalStorage from "@/hooks/use-local-storage"

type Theme = "dark" | "light"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  applyCustomAppFont: (fontDataUrl: string | null) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);

  const applyCustomAppFont = (fontDataUrl: string | null) => {
    const styleId = 'custom-app-font-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    if (fontDataUrl) {
        styleElement.innerHTML = `
            @font-face {
                font-family: 'CustomAppFont';
                src: url(${fontDataUrl});
            }
            body {
                font-family: 'CustomAppFont', var(--font-body), sans-serif;
            }
        `;
    } else {
        styleElement.innerHTML = '';
        document.body.style.fontFamily = 'var(--font-body), sans-serif';
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("ashley-drp-theme") as Theme | null
    if (storedTheme) {
      setTheme(storedTheme)
    } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])
  
  useEffect(() => {
    if (customFontBase64) {
      applyCustomAppFont(customFontBase64);
    }
  }, [customFontBase64]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("ashley-drp-theme", theme)
  }, [theme])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, applyCustomAppFont }}>
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
