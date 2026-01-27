
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, Clock, Eye, Loader2, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO, isSameMonth } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import type { Overtime } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  const PageContent = () => (
      <>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        ) : monthlyReports.length > 0 ? (
        <Card>
            <CardHeader>
                <CardTitle>{t('daily_overtime_summary')}</CardTitle>
                <CardDescription>{t('overtime_summary_desc', {month: selectedMonth ? format(selectedMonth, 'MMMM yyyy') : '...'})}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead className="text-center">{t('total_hours')}</TableHead>
                            <TableHead className="text-center">{t('total_amount')}</TableHead>
                            <TableHead className="text-right print:hidden"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {monthlyReports.map(({ date, totalHours, totalAmount }) => (
                        <TableRow key={date}>
                            <TableCell>{format(parseISO(date), 'PPP')}</TableCell>
                            <TableCell className="text-center">{totalHours.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{formatCurrency(totalAmount)}</TableCell>
                            <TableCell className="text-right print:hidden">
                                <Button asChild size="sm">
                                    <Link href={`/overtime/add?date=${date}`}><Eye className="mr-2"/>{t('view_details')}</Link>
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
              <h3 className="mt-4 text-lg">{t('no_overtime_records_found')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('no_overtime_found_for_month', {month: selectedMonth ? format(selectedMonth, 'MMMM yyyy') : t('the_selected_month')})}</p>
              <Button asChild className="mt-4"><Link href="/overtime/add">{t('add_overtime')}</Link></Button>
          </div>
        )}
      </>
  );

  return (
    <>
      <div className="hidden print:block">
        <ReportWrapper>
          <PageContent />
        </ReportWrapper>
      </div>
      <div className="h-screen bg-background text-foreground flex flex-col print:hidden">
        <header className="p-4 md:p-8 flex items-center justify-between gap-4 mb-8 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/overtime"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-xl">{t('overtime_archive')}</h1>
          </div>
          <div className="flex items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedMonth && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => {
                      setSelectedMonth(date);
                      setIsCalendarOpen(false);
                    }}
                    captionLayout="dropdown-nav" fromYear={2020} toYear={2040}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handlePrint} variant="outline" disabled={isLoading || monthlyReports.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
              <Button asChild>
                  <Link href="/overtime/add"><Plus className="mr-2"/> {t('add_overtime')}</Link>
              </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <PageContent />
        </main>
      </div>
    </>
  );
}
