
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
import { usePathname } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { BackupReminder } from '@/components/shared/backup-reminder';

function DynamicThemeInjector() {
    const { settings } = useAppContext();
    const { theme } = useTheme();

    const colors = theme === 'dark' ? settings.darkThemeColors : settings.lightThemeColors;
    const dashboard = settings.dashboard;
    const sidebar = settings.sidebar || { fontSize: 12, textTransform: 'none' };

    // CHROMATIC GLASS LOGIC: Map --card to theme primary HSL components for colored transparency
    const styleString = `
        :root {
            --background: ${colors.background};
            --foreground: ${colors.foreground};
            --primary: ${colors.primary};
            --accent: ${colors.accent};
            --card: ${colors.primary}; /* Adaptive Card Base */
            --title-bar-bg: ${colors.titleBar || colors.primary};
            --card-header-bg: ${colors.accent};
            --table-header-bg: ${colors.primary};
            --table-row-primary: ${colors.tableRowPrimary};
            --table-row-secondary: ${colors.tableRowSecondary};
            --huana-highlight: ${colors.huanaHighlight};
            --location-occupied-border: ${colors.locationOccupiedBorder};
            --location-occupied-bg: ${colors.locationOccupiedBg};

            /* Dashboard Injections */
            --dashboard-font-size: ${dashboard?.fontSize || 12}px;
            --dashboard-radius: ${dashboard?.cardRadius || 12}px;
            --dashboard-title-color: ${dashboard?.titleColor || colors.primary};
            --dashboard-text-color: ${dashboard?.textColor || colors.foreground};
            --dashboard-accent-color: ${dashboard?.accentColor || colors.accent};
            --dashboard-text-transform: ${dashboard?.textTransform || 'none'};

            /* Sidebar Injections */
            --sidebar-custom-font-size: ${sidebar.fontSize}px;
            --sidebar-text-transform: ${sidebar.textTransform};
            --sidebar-background: ${colors.primary};
        }
    `;

    return <style dangerouslySetInnerHTML={{ __html: styleString }} />;
}

function CustomFontInjector() {
    const { settings } = useAppContext();
    const fontBody = settings.fontFamily || 'Inter, system-ui, sans-serif';
    const customFont = settings.customFont;

    let fontStyles = `
        :root {
            --font-body: "${fontBody}";
        }
    `;

    if (customFont) {
        fontStyles = `
            @font-face {
                font-family: 'CustomAppFont';
                src: url(${customFont});
            }
            :root {
                --font-body: 'CustomAppFont', "${fontBody}";
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
        <div className="fixed inset-0 z-[-1] overflow-hidden">
            <Image
                key={settings.mainBackground}
                src={settings.mainBackground}
                alt="Main background"
                fill
                className="object-cover"
                unoptimized
                crossOrigin="anonymous"
                priority
            />
            <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px]" />
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
        <SidebarProvider defaultOpen={true} className="bg-transparent">
            <CustomFontInjector />
            <DynamicThemeInjector />
            {!isLoginPage && <MainBackground />}

            {!isLoginPage && <AppSidebar />}
            
            <SidebarInset className="flex flex-col relative bg-transparent overflow-hidden">
                {!isLoginPage && (
                    <div className={cn(
                        "fixed top-4 z-50 md:hidden",
                        language === 'ku' ? "right-4" : "left-4"
                    )}>
                        <SidebarTrigger className="bg-primary text-white shadow-lg rounded-full h-12 w-12" />
                    </div>
                )}

                <div key={pathname} className="animate-fade-in-down flex-1 overflow-auto">
                    {children}
                </div>
                
                <BackupReminder />
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
