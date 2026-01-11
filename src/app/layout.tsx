
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AppProvider } from '@/context/app-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/context/language-provider';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/shared/splash-screen';
import { AppHeader } from '@/components/shared/app-header';
import { Noto_Naskh_Arabic } from 'next/font/google';
import { usePathname } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import { FirebaseClientProvider } from '@/firebase';

const notoNaskhArabic = Noto_Naskh_Arabic({ 
  subsets: ['arabic'],
  variable: '--font-body',
  display: 'swap',
});

function CustomFontInjector() {
    const [customFont] = useLocalStorage<string | null>('custom-font-base64', null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || !customFont) {
        return null;
    }

    return (
        <style>{`
            @font-face { 
                font-family: 'CustomAppFont'; 
                src: url(${customFont}); 
            }
            :root {
                --font-body: 'CustomAppFont', ${notoNaskhArabic.style.fontFamily};
            }
        `}</style>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSplash, setShowSplash] = useState(true);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <CustomFontInjector />
      </head>
      <body className={`${notoNaskhArabic.variable} font-sans antialiased`} suppressHydrationWarning>
        {showSplash ? (
          <SplashScreen />
        ) : (
          <ThemeProvider>
            <FirebaseClientProvider>
                <AppProvider>
                  <AuthProvider>
                    <LanguageProvider>
                      {!isLoginPage && <AppHeader />}
                      {children}
                    </LanguageProvider>
                  </AuthProvider>
                </AppProvider>
            </FirebaseClientProvider>
          </ThemeProvider>
        )}
        <Toaster />
      </body>
    </html>
  );
}
