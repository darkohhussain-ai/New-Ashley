
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
  <div className="relative flex items-center overflow-x-hidden bg-primary text-primary-foreground py-2">
  <div className="animate-marquee whitespace-nowrap">
    <span className="mx-6 text-xs font-medium tracking-wide">{settings.newsTickerText}</span>
  </div>
  <div className="absolute inset-y-0 flex items-center animate-marquee2 whitespace-nowrap">
    <span className="mx-6 text-xs font-medium tracking-wide">{settings.newsTickerText}</span>
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
  <div className="flex flex-col min-h-full bg-background">
  <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
  {/* Banner */}
  {settings.dashboardBanner && (
  <div 
    className="relative w-full rounded-2xl overflow-hidden animate-fade-in-up shadow-soft-md"
    style={{ height: `${Math.max(settings.dashboardBannerHeight - 20, 120)}px` }}
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
  
  {/* Financial Summaries */}
  {hasPermission('admin:all') && (
  <section className="animate-fade-in-up stagger-1">
    <FinancialSummaries />
  </section>
  )}
  
  {/* Summary Cards Row */}
  <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
  {hasPermission('page:transmit:view') && (
    <div className="animate-fade-in-up stagger-2">
      <StagedItemsSummary />
    </div>
  )}
  {hasPermission('admin:all') && (
    <div className="animate-fade-in-up stagger-3">
      <OrderRequestsSummary />
    </div>
  )}
  </section>
  
  {/* Charts Row */}
  <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
  {hasPermission('admin:all') && (
    <Link 
      href="/ashley-expenses" 
      className="block animate-fade-in-up stagger-4 group"
    >
      <div className="transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-0.5 rounded-2xl">
        <MonthlyFinancialChart />
      </div>
    </Link>
  )}
  {hasPermission('page:items:view') && (
    <Link 
      href="/items" 
      className="block animate-fade-in-up stagger-5 group"
    >
      <div className="transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-0.5 rounded-2xl">
        <StorageSummaryChart />
      </div>
    </Link>
  )}
  </section>
  
  {/* Quick Access Services */}
  <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
  <Card className="shadow-soft-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold">{t('services')}</CardTitle>
      <CardDescription className="text-sm">{t('select_service')}</CardDescription>
    </CardHeader>
    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-0">
      {menuItems.map((item, index) => (
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
  </section>
  </main>
  
  {/* News Ticker */}
  <div className="sticky bottom-0 z-20">
  <NewsTicker />
  </div>
  </div>
  );
}
