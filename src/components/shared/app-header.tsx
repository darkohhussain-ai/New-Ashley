
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  Calendar,
  Clock,
  RefreshCcw,
  Languages,
  Home,
} from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const [time, setTime] = useState<Date | null>(null);
  const { t, setLanguage, language } = useTranslation();

  const [savedLogo] = useLocalStorage(
    'app-logo',
    'https://picsum.photos/seed/ashley-logo/300/100'
  );

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!isMounted) {
    return (
      <header className="bg-card border-b top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Skeleton state or minimal header */}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card border-b top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground w-1/3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span suppressHydrationWarning>{time ? format(time, 'MMMM d, yyyy') : '...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span suppressHydrationWarning>{time ? format(time, 'h:mm:ss a') : '...'}</span>
            </div>
          </div>
          <div className="flex items-center justify-center w-1/3">
            {savedLogo && (
              <Link href="/">
                <div className="relative w-full max-w-[240px] h-16 cursor-pointer">
                  <Image
                    src={savedLogo}
                    alt="App Logo"
                    fill
                    className="object-contain"
                    data-ai-hint="logo"
                  />
                </div>
              </Link>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 w-1/3">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/"><Home className="w-5 h-5 text-muted-foreground hover:text-primary" /></Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Languages className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => setLanguage('en')}
                  disabled={language === 'en'}
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setLanguage('ku')}
                  disabled={language === 'ku'}
                >
                  Kurdish (Soranî)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              aria-label={t('refresh_page')}
            >
              <RefreshCcw className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </Button>
            <Bell className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer" />
            <Link href="/account">
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>{'A'}</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
