'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, Clock, Eye, Loader2, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isSameMonth } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import type { Overtime } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function OvertimeArchivePage() {
  const { t } = useTranslation();
  const { overtime: allOvertimeRecords } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setSelectedMonth(new Date());
  }, []);
  
  const isLoading = !allOvertimeRecords || !selectedMonth;

  const monthlyReports = useMemo(() => {
    if (!allOvertimeRecords || !selectedMonth) return [];
    
    const groups: Record<string, { records: Overtime[], totalHours: number, totalAmount: number }> = {};
    
    const monthRecords = allOvertimeRecords.filter(record => 
        isSameMonth(parseISO(record.date), selectedMonth)
    );

    monthRecords.forEach(record => {
      const day = format(parseISO(record.date), 'yyyy-MM-dd');
      if (!groups[day]) {
        groups[day] = { records: [], totalHours: 0, totalAmount: 0 };
      }
      groups[day].records.push(record);
      groups[day].totalHours += record.hours;
      groups[day].totalAmount += record.totalAmount;
    });

    return Object.entries(groups)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allOvertimeRecords, selectedMonth]);

  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/overtime"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-xl">{t('overtime_archive')}</h1>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-48 justify-start text-left", !selectedMonth && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedMonth} onSelect={setSelectedMonth} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
            <Button onClick={handlePrint} variant="outline" disabled={isLoading || monthlyReports.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
            <Button asChild>
                <Link href="/overtime/add"><Plus className="mr-2"/> {t('add_overtime')}</Link>
            </Button>
        </div>
      </header>
      <main>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        ) : monthlyReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthlyReports.map(({ date, totalHours, totalAmount }) => (
              <Card key={date} className="hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary"/>
                    {format(parseISO(date), 'PPP')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-3 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4"/> {t('total_hours')}: <span className="text-foreground">{totalHours.toFixed(2)}</span></p>
                  <p className="text-lg text-primary">{formatCurrency(totalAmount)}</p>
                </CardContent>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/overtime/add?date=${date}`}><Eye className="mr-2"/>{t('view_edit_details')}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg">{t('no_overtime_records_found')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_overtime_found_for_month', {month: selectedMonth ? format(selectedMonth, 'MMMM yyyy') : t('the_selected_month')})}</p>
             <Button asChild className="mt-4"><Link href="/overtime/add">{t('add_overtime')}</Link></Button>
          </div>
        )}
      </main>
    </div>
  );
}
