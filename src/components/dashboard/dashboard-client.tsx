
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { MonthlyFinancialChart } from '@/components/dashboard/MonthlyFinancialChart';
import { StorageSummaryChart } from '@/components/dashboard/StorageSummaryChart';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FinancialSummaries } from '@/components/dashboard/FinancialSummaries';
import { StagedItemsSummary } from '@/components/dashboard/StagedItemsSummary';
import { OrderRequestsSummary } from '@/components/dashboard/OrderRequestsSummary';

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
        href: '/settings?tab=admin',
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
        <div className="relative flex items-center overflow-x-hidden bg-primary/80 text-primary-foreground py-1.5">
            <div className="animate-marquee whitespace-nowrap">
                <span className="mx-4 text-xs font-bold uppercase tracking-widest">{settings.newsTickerText}</span>
            </div>

            <div className="absolute inset-y-0 flex items-center animate-marquee2 whitespace-nowrap">
                 <span className="mx-4 text-xs font-bold uppercase tracking-widest">{settings.newsTickerText}</span>
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
      <main className="w-full p-4 md:p-6 space-y-6">
        {settings.dashboardBanner && (
            <div className="relative w-full rounded-xl overflow-hidden animate-fade-in-down shadow-sm"
                style={{ height: `${settings.dashboardBannerHeight - 20}px` }}
            >
                <Image
                    key={settings.dashboardBanner}
                    src={settings.dashboardBanner}
                    alt="Dashboard Banner"
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>
        )}

        {hasPermission('admin:all') && (
            <div className="animate-fade-in-down" style={{ animationDelay: '100ms' }}>
                <FinancialSummaries />
            </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasPermission('page:transmit:view') && (
                <div className="animate-fade-in-down" style={{ animationDelay: '200ms' }}>
                    <StagedItemsSummary />
                </div>
            )}
            {hasPermission('admin:all') && (
                <div className="animate-fade-in-down" style={{ animationDelay: '150ms' }}>
                    <OrderRequestsSummary />
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {hasPermission('admin:all') && (
                <Link href="/ashley-expenses" className="block animate-fade-in-down hover:-translate-y-1 transition-transform" style={{ animationDelay: '300ms' }}>
                    <MonthlyFinancialChart />
                </Link>
            )}
            {hasPermission('page:items:view') && (
                  <Link href="/items" className="block animate-fade-in-down hover:-translate-y-1 transition-transform" style={{ animationDelay: '400ms' }}>
                    <StorageSummaryChart />
                </Link>
            )}
        </div>

         <Card className="animate-fade-in-down border-none shadow-sm" style={{ animationDelay: '500ms' }}>
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-base">{t('services')}</CardTitle>
                <CardDescription className="text-[11px]">{t('select_service')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
                {menuItems.map((item) => (
                    <DashboardCard
                    key={item.title}
                    title={t(item.title)}
                    icon={item.icon}
                    href={item.href}
                    color={item.color}
                    />
                ))}
            </CardContent>
        </Card>

      </main>
      <NewsTicker />
    </>
  );
}
