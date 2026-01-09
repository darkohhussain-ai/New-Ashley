
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, DollarSign, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

export default function ExpenseArchivePage() {
  const { t } = useTranslation();
  const { simpleExpenses } = useAppContext();
  const isLoading = !simpleExpenses;

  const groupedByDay = useMemo(() => {
    if (!simpleExpenses) return [];
    
    const groups: Record<string, { date: string, totalAmount: number, count: number }> = {};
    
    simpleExpenses.forEach(exp => {
      const day = format(parseISO(exp.date), 'yyyy-MM-dd');
      if (!groups[day]) {
        groups[day] = { date: day, totalAmount: 0, count: 0 };
      }
      groups[day].totalAmount += exp.amount;
      groups[day].count += 1;
    });

    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [simpleExpenses]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/expenses"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{t('expense_report_archive')}</h1>
        </div>
        <Button asChild>
          <Link href="/expenses/add"><Plus className="mr-2" /> {t('create_report')}</Link>
        </Button>
      </header>
      <main>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-3"><Skeleton className="h-4 w-full" /></CardContent>
                <CardFooter><Skeleton className="h-8 w-24" /></CardFooter>
              </Card>
            ))}
          </div>
        ) : groupedByDay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedByDay.map(report => (
              <Card key={report.date} className="hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg leading-tight flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary"/>
                    {format(parseISO(report.date), 'PPP')}
                  </CardTitle>
                  <CardDescription>{report.count} expenses</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="flex items-center gap-2 text-2xl font-bold text-primary">
                    <DollarSign className="w-6 h-6" />
                    {formatCurrency(report.totalAmount)}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" disabled>
                    {/* The view-by-day functionality is now integrated into the add page */}
                    <span className='opacity-50 cursor-not-allowed flex items-center'><Eye className="mr-2"/>{t('view_edit_details')}</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('no_expense_reports_found')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_expense_reports_found_desc')}</p>
            <Button asChild className="mt-4"><Link href="/expenses/add">{t('create_report')}</Link></Button>
          </div>
        )}
      </main>
    </div>
  );
}
