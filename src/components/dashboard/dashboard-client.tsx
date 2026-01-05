
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Box,
  Settings as SettingsIcon,
  CreditCard,
  Bell,
  ChevronDown,
  Calendar,
  Clock,
  PackagePlus,
  Star,
  RefreshCcw,
  UserCircle,
  Languages,
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
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DashboardCard } from './dashboard-card';


export function DashboardClient() {
  const [time, setTime] = useState<Date | null>(null);
  const { t, setLanguage, language } = useTranslation();

  const [savedBannerHeight] = useLocalStorage('dashboard-banner-height', 150);
  const [savedDashboardBanner] = useLocalStorage(
    'dashboard-banner',
    'https://i.ibb.co/6Wp2t1Y/image.png'
  );
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

  const menuItems = [
    {
      title: t('ashley_employees_management'),
      icon: CreditCard,
      href: '/ashley-expenses',
      color: 'bg-blue-500',
    },
    {
      title: t('transmit_cargo'),
      icon: PackagePlus,
      href: '/transmit',
      color: 'bg-yellow-500',
    },
    {
      title: t('placement_storage'),
      icon: Box,
      href: '/items',
      color: 'bg-green-500',
    },
    {
      title: t('marketing_feedback'),
      icon: Star,
      href: '/marketing-feedback',
      color: 'bg-cyan-500',
    },
    {
      title: t('settings'),
      icon: SettingsIcon,
      href: '/settings',
      color: 'bg-purple-500',
    },
    {
      title: t('employees'),
      icon: Users,
      href: '/employees',
      color: 'bg-pink-500',
    },
    {
      title: t('my_account'),
      icon: UserCircle,
      href: '/account',
      color: 'bg-gray-500',
    },
  ];
  
  if (!isMounted) {
      return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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
                <div className="relative w-full max-w-[240px] aspect-[3/1]">
                  <Image
                    src={savedLogo}
                    alt="App Logo"
                    fill
                    className="object-contain"
                    data-ai-hint="logo"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 w-1/3">
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
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>{'A'}</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          {savedDashboardBanner && (
            <div
              className="relative w-full mx-auto my-4 max-w-6xl rounded-lg overflow-hidden"
              style={{ height: `${savedBannerHeight}px` }}
            >
              <Image
                src={savedDashboardBanner}
                alt="Dashboard Banner"
                fill
                className="object-contain"
                data-ai-hint="banner abstract"
              />
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{t('welcome_back')}</h2>
          <p className="text-muted-foreground">{t('select_service')}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <DashboardCard
              key={item.title}
              title={item.title}
              icon={item.icon}
              href={item.href}
              color={item.color}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
