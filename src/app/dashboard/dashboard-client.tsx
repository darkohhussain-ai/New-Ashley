
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import { MonthlyFinancialChart } from '@/components/dashboard/MonthlyFinancialChart';
import { StorageSummaryChart } from '@/components/dashboard/StorageSummaryChart';
import { FinancialSummaries } from '@/components/dashboard/FinancialSummaries';
import { StagedItemsSummary } from '@/components/dashboard/StagedItemsSummary';
import { OrderRequestsSummary } from '@/components/dashboard/OrderRequestsSummary';

export function DashboardClient() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { settings } = useAppContext();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
      return null;
  }

  return (
    <div className="w-full p-4 md:p-8 space-y-10 animate-fade-in-down">
        {/* Section 1: Top Summary Cards */}
        {hasPermission('admin:all') && <FinancialSummaries />}
        
        {/* Section 2: Staged Items Summary */}
        {hasPermission('page:transmit:view') && <StagedItemsSummary />}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Section 3: Order Requests */}
            {hasPermission('admin:all') && <OrderRequestsSummary />}
            
            {/* Section 4: Monthly Overview */}
            {hasPermission('admin:all') && <MonthlyFinancialChart />}
        </div>

        {/* Section 5: Storage Status Overview */}
        {hasPermission('page:items:view') && (
            <div className="max-w-2xl">
                <StorageSummaryChart />
            </div>
        )}

        {settings.newsTickerText && (
            <div className="relative flex items-center overflow-x-hidden bg-primary/10 text-primary py-3 rounded-xl border border-primary/20">
                <div className="animate-marquee whitespace-nowrap">
                    <span className="mx-4 font-bold text-sm">{settings.newsTickerText}</span>
                </div>
                <div className="absolute inset-y-0 flex items-center animate-marquee2 whitespace-nowrap">
                     <span className="mx-4 font-bold text-sm">{settings.newsTickerText}</span>
                </div>
            </div>
        )}
    </div>
  );
}
