
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, useTheme } from "@/components/shared/theme-provider";
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
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';

function DynamicThemeInjector() {
    const { settings } = useAppContext();
    const { theme } = useTheme();

    if (settings.selectedTheme !== 'custom') return null;

    const colors = theme === 'dark' ? settings.darkThemeColors : settings.lightThemeColors;

    const styleString = `
        :root {
            --background: ${colors.background};
            --foreground: ${colors.foreground};
            --primary: ${colors.primary};
            --accent: ${colors.accent};
            --card: ${colors.card};
            --title-bar-bg: ${colors.titleBar || colors.primary};
            --card-header-bg: ${colors.accent};
            --table-header-bg: ${colors.primary};
        }
    `;

    return <style dangerouslySetInnerHTML={{ __html: styleString }} />;
}

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
        <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
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
    const isDashboard = pathname === '/';

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ku' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('data-theme', settings.selectedTheme || 'default');
    }, [language, settings.selectedTheme]);
    
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
        <SidebarProvider defaultOpen={isDashboard}>
            <CustomFontInjector />
            <DynamicThemeInjector />

            {!isLoginPage && isDashboard && <AppSidebar />}
            
            <SidebarInset className="flex flex-col">
                {!isLoginPage && <MainBackground />}
                {!isLoginPage && <AppHeader />}
                <div key={pathname} className="animate-fade-in-down flex-1 overflow-auto">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
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
