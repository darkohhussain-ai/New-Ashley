
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AppProvider, useAppContext } from '@/context/app-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/context/language-provider';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/shared/splash-screen';
import { AppHeader } from '@/components/shared/app-header';
import { Noto_Naskh_Arabic } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase'; // Import the new provider
import Image from 'next/image';


const notoNaskhArabic = Noto_Naskh_Arabic({ 
  subsets: ['arabic'],
  variable: '--font-body',
  display: 'swap',
});

function CustomFontInjector() {
    const { settings } = useAppContext();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || !settings.customFont) {
        return null;
    }

    return (
        <style>{`
            @font-face { 
                font-family: 'CustomAppFont'; 
                src: url(${settings.customFont}); 
            }
            :root {
                --font-body: 'CustomAppFont', ${notoNaskhArabic.style.fontFamily};
            }
        `}</style>
    );
}

function MainBackground() {
    const { settings } = useAppContext();
    if (!settings.mainBackground) {
        return null;
    }
    return (
        <div className="fixed inset-0 z-[-1]">
            <Image
                src={settings.mainBackground}
                alt="Main background"
                fill
                className="object-cover"
            />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
    )
}

function AppContent({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAppContext();
    const [showSplash, setShowSplash] = useState(true);
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000); // Shortened splash time a bit

        return () => clearTimeout(timer);
    }, []);

    if (showSplash || isLoading) {
        return <SplashScreen />;
    }

    return (
        <>
            <CustomFontInjector />
            {!isLoginPage && (
              <>
                <MainBackground />
                <AppHeader />
              </>
            )}
            {children}
        </>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${notoNaskhArabic.variable} font-sans antialiased`} suppressHydrationWarning>
        <FirebaseClientProvider>
            <AppProvider>
                <LanguageProvider>
                  <ThemeProvider>
                    <AuthProvider>
                        <AppContent>
                            {children}
                        </AppContent>
                    </AuthProvider>
                  </ThemeProvider>
                </LanguageProvider>
            </AppProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
