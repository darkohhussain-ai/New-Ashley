
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, Banknote, Eye, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import type { CashWithdrawal } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function WithdrawalArchivePage() {
  const { t } = useTranslation();
  const { withdrawals } = useAppContext();
  const isLoading = !withdrawals;

  const groupedByDay = useMemo(() => {
    if (!withdrawals) return [];
    
    const groups: Record<string, { records: CashWithdrawal[], totalAmount: number }> = {};
    
    withdrawals.forEach(record => {
      const day = format(parseISO(record.date), 'yyyy-MM-dd');
      if (!groups[day]) {
        groups[day] = { records: [], totalAmount: 0 };
      }
      groups[day].records.push(record);
      groups[day].totalAmount += record.amount;
    });

    return Object.entries(groups)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [withdrawals]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/cash-withdrawal"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{t('withdrawal_archive')}</h1>
        </div>
         <Button asChild>
            <Link href="/cash-withdrawal/add"><Plus className="mr-2"/> {t('add_withdrawal')}</Link>
        </Button>
      </header>
      <main>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        ) : groupedByDay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedByDay.map(({ date, totalAmount }) => (
              <Card key={date} className="hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg leading-tight flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary"/>
                    {format(parseISO(date), 'PPP')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-3 text-sm">
                  <p className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</p>
                </CardContent>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/cash-withdrawal/add?date=${date}`}><Eye className="mr-2"/>{t('view_edit_details')}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('no_withdrawal_records')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_withdrawal_records_desc')}</p>
             <Button asChild className="mt-4"><Link href="/cash-withdrawal/add">{t('add_withdrawal')}</Link></Button>
          </div>
        )}
      </main>
    </div>
  );
}
