
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
  ShieldCheck,
} from 'lucide-react';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { useAuth } from '@/hooks/use-auth';

const allMenuItems = [
    {
      title: 'ashley_employees_management',
      icon: CreditCard,
      href: '/ashley-expenses',
      color: 'bg-blue-500',
      permission: 'page:ashley-expenses:view',
    },
    {
      title: 'transmit_cargo',
      icon: PackagePlus,
      href: '/transmit',
      color: 'bg-yellow-500',
      permission: 'page:transmit:view',
    },
    {
      title: 'placement_storage',
      icon: Box,
      href: '/items',
      color: 'bg-green-500',
      permission: 'page:items:view',
    },
    {
      title: 'marketing_feedback',
      icon: Star,
      href: '/marketing-feedback',
      color: 'bg-cyan-500',
      permission: 'page:marketing-feedback:view',
    },
    {
        title: 'admin_panel',
        icon: ShieldCheck,
        href: '/admin',
        color: 'bg-red-500',
        permission: 'page:admin',
    },
    {
      title: 'settings',
      icon: SettingsIcon,
      href: '/settings',
      color: 'bg-purple-500',
      permission: 'page:settings',
    },
    {
      title: 'employees',
      icon: Users,
      href: '/employees',
      color: 'bg-pink-500',
      permission: 'page:employees:view',
    },
    {
      title: 'my_account',
      icon: UserCircle,
      href: '/account',
      color: 'bg-gray-500',
      permission: 'page:account',
    },
];

const NewsTicker = () => {
    const { settings } = useAppContext();

    if (!settings.newsTickerText) {
        return null;
    }
    
    return (
        <div className="relative flex items-center overflow-x-hidden bg-primary/80 text-primary-foreground py-2">
            <div className="animate-marquee whitespace-nowrap">
                <span className="mx-4">{settings.newsTickerText}</span>
            </div>

            <div className="absolute inset-y-0 flex items-center animate-marquee2 whitespace-nowrap">
                 <span className="mx-4">{settings.newsTickerText}</span>
            </div>
        </div>
    );
};


export function DashboardClient() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { settings } = useAppContext();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuItems = allMenuItems.filter(item => hasPermission(item.permission));
  
  if (!isMounted) {
      return null;
  }

  return (
    <>
      {settings.dashboardBanner && (
        <div className="container mx-auto px-4">
            <div
            className="relative w-full mx-auto my-4 max-w-6xl rounded-lg overflow-hidden"
            style={{ height: `${settings.dashboardBannerHeight}px` }}
            >
            <Image
                key={settings.dashboardBanner}
                src={settings.dashboardBanner}
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
              title={t(item.title)}
              icon={item.icon}
              href={item.href}
              color={item.color}
            />
          ))}
        </div>
      </main>
      <NewsTicker />
    </>
  );
}
