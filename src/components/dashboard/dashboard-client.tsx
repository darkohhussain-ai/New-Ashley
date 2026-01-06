'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Users,
  Box,
  Settings as SettingsIcon,
  CreditCard,
  PackagePlus,
  Star,
  UserCircle,
} from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import { useTranslation } from '@/hooks/use-translation';
import { DashboardCard } from './dashboard-card';


export function DashboardClient() {
  const { t } = useTranslation();

  const [savedBannerHeight] = useLocalStorage('dashboard-banner-height', 150);
  const [savedDashboardBanner, setSavedDashboardBanner] = useLocalStorage<string | null>(
    'dashboard-banner',
    null
  );
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    if (!savedDashboardBanner) {
      setSavedDashboardBanner('https://i.ibb.co/6Wp2t1Y/image.png')
    }
  }, []);

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
    <>
      {savedDashboardBanner && (
        <div className="container mx-auto px-4">
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
        </div>
      )}
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl">{t('welcome_back')}</h2>
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
    </>
  );
}
