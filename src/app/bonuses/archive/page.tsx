
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, Truck, Eye, Loader2, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import type { Bonus } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BonusArchivePage() {
  const { t } = useTranslation();
  const { bonuses } = useAppContext();
  const isLoading = !bonuses;

  const groupedByDay = useMemo(() => {
    if (!bonuses) return [];
    
    const groups: Record<string, { records: Bonus[], totalLoads: number, totalAmount: number }> = {};
    
    bonuses.forEach(record => {
      const day = format(parseISO(record.date), 'yyyy-MM-dd');
      if (!groups[day]) {
        groups[day] = { records: [], totalLoads: 0, totalAmount: 0 };
      }
      groups[day].records.push(record);
      groups[day].totalLoads += record.loadCount;
      groups[day].totalAmount += record.totalAmount;
    });

    return Object.entries(groups)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bonuses]);
  
  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between gap-4 p-4 md:p-8 border-b print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/bonuses"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl">{t('bonuses_archive')}</h1>
        </div>
         <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4"/> {t('print')}</Button>
            <Button asChild>
                <Link href="/bonuses/add"><Plus className="mr-2"/> {t('add_bonus')}</Link>
            </Button>
         </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        ) : groupedByDay.length > 0 ? (
          <Card>
            <CardHeader>
                <CardTitle>{t('daily_bonus_summary')}</CardTitle>
                <CardDescription>{t('daily_bonus_summary_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead className="text-center">{t('total_loads')}</TableHead>
                            <TableHead className="text-center">{t('total_amount')}</TableHead>
                            <TableHead className="text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedByDay.map(({ date, totalLoads, totalAmount }) => (
                            <TableRow key={date}>
                                <TableCell>{format(parseISO(date), 'PPP')}</TableCell>
                                <TableCell className="text-center">{totalLoads}</TableCell>
                                <TableCell className="text-center">{formatCurrency(totalAmount)}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild size="sm">
                                        <Link href={`/bonuses/add?date=${date}`}><Eye className="mr-2"/>{t('view_details')}</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg">{t('no_bonus_records')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_bonus_records_desc')}</p>
             <Button asChild className="mt-4"><Link href="/bonuses/add">{t('add_bonus')}</Link></Button>
          </div>
        )}
      </main>
    </div>
  );
}
