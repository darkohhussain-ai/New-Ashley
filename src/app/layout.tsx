
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AppProvider, useAppContext } from '@/context/app-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider, useTranslation } from '@/context/language-provider';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/shared/splash-screen';
import { AppHeader } from '@/components/shared/app-header';
import { Noto_Naskh_Arabic } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase'; // Import the new provider
import Image from 'next/image';
import { cn } from '@/lib/utils';


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
                key={settings.mainBackground}
                src={settings.mainBackground}
                alt="Main background"
                fill
                className="object-cover"
            />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
    )
}

function SystemCornerLogo() {
    const { settings } = useAppContext();
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage || !settings.appLogo) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 w-20 h-20 bg-background/50 backdrop-blur-sm p-2 rounded-full shadow-lg pointer-events-none">
            <div className="relative w-full h-full">
                <Image 
                    key={settings.appLogo}
                    src={settings.appLogo}
                    alt="System Logo"
                    fill
                    className="object-contain"
                />
            </div>
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
                <SystemCornerLogo />
              </>
            )}
            {children}
        </>
    );
}

function HtmlWrapper({ children }: { children: React.ReactNode }) {
  const { language } = useTranslation();
  return (
    <html lang={language} dir={language === 'ku' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      {children}
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <FirebaseClientProvider>
      <AppProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <HtmlWrapper>
                <head />
                <body className={cn(`${notoNaskhArabic.variable} font-sans antialiased`, 'min-h-screen')} suppressHydrationWarning>
                  <AppContent>
                      {children}
                  </AppContent>
                  <Toaster />
                </body>
              </HtmlWrapper>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AppProvider>
    </FirebaseClientProvider>
  );
}
