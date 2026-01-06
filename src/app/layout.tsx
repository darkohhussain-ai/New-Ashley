'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AppProvider } from '@/context/app-provider';
import { FirebaseProvider } from '@/firebase';
import { LanguageProvider } from '@/context/language-provider';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/shared/splash-screen';
import { AppHeader } from '@/components/shared/app-header';
import { Noto_Naskh_Arabic } from 'next/font/google';

const notoNaskhArabic = Noto_Naskh_Arabic({ 
  subsets: ['arabic'],
  variable: '--font-body',
  display: 'swap',
});

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
      <body className={`${notoNaskhArabic.variable} font-sans antialiased`}>
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
