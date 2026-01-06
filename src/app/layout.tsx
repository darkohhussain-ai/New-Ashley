'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Inter } from 'next/font/google';
import { AppProvider } from '@/context/app-provider';
import { FirebaseProvider } from '@/firebase';
import { LanguageProvider } from '@/context/language-provider';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/shared/splash-screen';
import { AppHeader } from '@/components/shared/app-header';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        {showSplash ? (
          <SplashScreen />
        ) : (
          <FirebaseProvider>
            <ThemeProvider>
              <AppProvider>
                <LanguageProvider>
                  <AppHeader />
                  {children}
                </LanguageProvider>
              </AppProvider>
            </ThemeProvider>
            <Toaster />
          </FirebaseProvider>
        )}
      </body>
    </html>
  );
}
