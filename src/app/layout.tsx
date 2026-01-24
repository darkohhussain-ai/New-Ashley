
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AppProvider, useAppContext } from '@/context/app-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/context/language-provider';
import { useTranslation } from '@/hooks/use-translation';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/shared/splash-screen';
import { AppHeader } from '@/components/shared/app-header';
import { usePathname } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase';
import Image from 'next/image';
import { cn } from '@/lib/utils';

function CustomFontInjector() {
    const { settings } = useAppContext();
    const fontBody = settings.fontFamily || 'Arial';

    return (
        <style>{`
            :root {
                --font-body: "${fontBody}";
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
                    unoptimized
                />
            </div>
        </div>
    )
}

function AppContent({ children }: { children: React.ReactNode }) {
    const { isLoading, settings } = useAppContext();
    const { language } = useTranslation();
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ku' ? 'rtl' : 'ltr';

        // Listen for settings updates from other tabs
        const channel = new BroadcastChannel('settings-update');
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'reload') {
                // Add a small delay to allow data to sync, then reload
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        };
        channel.addEventListener('message', handleMessage);

        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, [language]);
    
    const isAppReady = !isLoading;

    return (
        <>
            <CustomFontInjector />

            {!isLoginPage && <MainBackground />}
            {!isLoginPage && <SystemCornerLogo />}
            
            {isAppReady ? (
                <>
                    {!isLoginPage && <AppHeader />}
                    <div key={pathname} className="animate-fade-in-down">
                        {children}
                    </div>
                </>
            ) : <SplashScreen />}
        </>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html suppressHydrationWarning>
      <body className={cn('antialiased', 'min-h-screen font-sans')} suppressHydrationWarning>
        <FirebaseClientProvider>
          <AuthProvider>
            <AppProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <AppContent>
                      {children}
                  </AppContent>
                  <Toaster />
                </ThemeProvider>
              </LanguageProvider>
            </AppProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
