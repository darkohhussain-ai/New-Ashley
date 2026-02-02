
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
import { Skeleton } from '@/components/ui/skeleton';


function CustomFontInjector() {
    const { settings } = useAppContext();
    const fontBody = settings.fontFamily || 'Arial';
    const customFont = settings.customFont;

    let fontStyles = `
        :root {
            --font-body: "${fontBody}", sans-serif;
        }
    `;

    if (customFont) {
        fontStyles = `
            @font-face {
                font-family: 'CustomAppFont';
                src: url(${customFont});
            }
            :root {
                --font-body: 'CustomAppFont', "${fontBody}", sans-serif;
            }
        `;
    }

    return (
        <style>{fontStyles}</style>
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
                unoptimized
                crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
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

        const channel = new BroadcastChannel('settings-update');
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'reload') {
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
    
    if (isLoading) {
        if (pathname === '/login') {
            return (
                <div className="flex min-h-screen items-center justify-center p-4">
                    <Skeleton className="w-full max-w-sm h-96" />
                </div>
            )
        }
        return <SplashScreen />;
    }

    return (
        <>
            <CustomFontInjector />

            {!isLoginPage && <MainBackground />}
            
            {!isLoginPage && <AppHeader />}
            <div key={pathname} className="animate-fade-in-down">
                {children}
            </div>
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
      <body className={cn('antialiased', 'min-h-screen')} suppressHydrationWarning>
        <FirebaseClientProvider>
          <AppProvider>
            <AuthProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <AppContent>
                      {children}
                  </AppContent>
                  <Toaster />
                </ThemeProvider>
              </LanguageProvider>
            </AuthProvider>
          </AppProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
