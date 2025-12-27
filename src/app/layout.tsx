import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Inter } from 'next/font/google';
import { AppProvider } from '@/context/app-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Ashley HR',
  description: 'Human Resources Management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-body antialiased`} suppressHydrationWarning>
        <ThemeProvider>
            <AppProvider>
              {children}
            </AppProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
