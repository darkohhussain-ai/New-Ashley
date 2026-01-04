
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Inter } from 'next/font/google';
import { AppProvider } from '@/context/app-provider';
import { FirebaseProvider } from '@/firebase';
import { LanguageProvider } from '@/context/language-provider';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/shared/splash-screen';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

// We can't export metadata from a client component, so we'll leave this commented out
// or move it to a server component if needed.
// export const metadata: Metadata = {
//   title: 'Ashley HR',
//   description: 'Human Resources Management',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // This timer ensures the splash screen is shown for at least 3 seconds.
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
