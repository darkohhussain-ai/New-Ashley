'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyOvertimeReportPage() {
  const { t } = useTranslation();
  const { overtime, employees } = useAppContext();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);
  
  const isLoading = !overtime || !employees || !selectedDate;

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || 'Unknown';
  };

  const monthlyData = useMemo(() => {
    if (!overtime || !employees || !selectedDate) return { records: [], summary: [], totalAmount: 0, totalHours: 0 };

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filteredRecords = overtime.filter(r => isWithinInterval(parseISO(r.date), { start, end }));

    const employeeTotals = new Map<string, { totalAmount: number; totalHours: number }>();
    filteredRecords.forEach(record => {
      const current = employeeTotals.get(record.employeeId) || { totalAmount: 0, totalHours: 0 };
      current.totalAmount += record.totalAmount;
      current.totalHours += record.hours;
      employeeTotals.set(record.employeeId, current);
    });

    const summary = Array.from(employeeTotals.entries()).map(([employeeId, totals]) => ({
      employeeId,
      employeeName: getEmployeeName(employeeId),
      ...totals
    })).sort((a,b) => b.totalAmount - a.totalAmount);
    
    const totalAmount = summary.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalHours = summary.reduce((sum, item) => sum + item.totalHours, 0);

    return { records: filteredRecords, summary, totalAmount, totalHours };
  }, [overtime, employees, selectedDate]);

  const handlePrint = () => {
    window.print();
  };
  
  if (isLoading) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:p-0">
        <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/overtime"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">{t('monthly_overtime_report')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : <span>{t('pick_a_month')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-buttons" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
            <Button onClick={handlePrint} disabled={isLoading || monthlyData.records.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
        ) : monthlyData.records.length > 0 ? (
          <div className="space-y-8">
            <Card className="print:shadow-none print:border-none">
              <CardHeader>
                <CardTitle>{t('summary_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('employee')}</TableHead>
                                <TableHead className="text-right">{t('total_hours')}</TableHead>
                                <TableHead className="text-right">{t('total_amount')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlyData.summary.map(item => (
                                <TableRow key={item.employeeId}>
                                    <TableCell className="font-medium">{item.employeeName}</TableCell>
                                    <TableCell className="text-right font-semibold">{item.totalHours.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell className="text-lg font-bold">{t('grand_total')}</TableCell>
                                <TableCell className="text-right text-lg font-bold">{monthlyData.totalHours.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-lg font-bold text-primary">{formatCurrency(monthlyData.totalAmount)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg print:hidden">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('no_overtime_found')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_overtime_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : t('the_selected_month')})}</p>
          </div>
        )}
      </div>
    </>
  );
}

    