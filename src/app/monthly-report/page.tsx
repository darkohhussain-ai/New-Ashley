'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export default function MonthlyReportPage() {
  const { t, language } = useTranslation();
  const { overtime, bonuses, withdrawals, employees } = useAppContext();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reportType, setReportType] = useState<'overtime' | 'bonuses' | 'withdrawals'>('overtime');
  
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);
  
  const isLoading = !overtime || !bonuses || !withdrawals || !employees || !selectedDate;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    return language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const monthlyData = useMemo(() => {
    if (isLoading) return { records: [], summary: [], totalAmount: 0, totalHours: 0, totalLoads: 0 };

    const start = startOfMonth(selectedDate!);
    const end = endOfMonth(selectedDate!);

    let records: any[] = [];
    if (reportType === 'overtime') records = overtime;
    else if (reportType === 'bonuses') records = bonuses;
    else if (reportType === 'withdrawals') records = withdrawals;

    const filteredRecords = records.filter(r => isWithinInterval(parseISO(r.date), { start, end }));

    const employeeTotals = new Map<string, { totalAmount: number; totalHours?: number; totalLoads?: number }>();
    
    filteredRecords.forEach(record => {
      const current = employeeTotals.get(record.employeeId) || { totalAmount: 0, totalHours: 0, totalLoads: 0 };
      current.totalAmount += record.totalAmount || record.amount || 0;
      if (reportType === 'overtime') current.totalHours = (current.totalHours || 0) + record.hours;
      if (reportType === 'bonuses') current.totalLoads = (current.totalLoads || 0) + record.loadCount;
      employeeTotals.set(record.employeeId, current);
    });

    const summary = Array.from(employeeTotals.entries()).map(([employeeId, totals]) => ({
      employeeId,
      employeeName: getEmployeeName(employeeId),
      ...totals
    })).sort((a,b) => b.totalAmount - a.totalAmount);
    
    const totalAmount = summary.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalHours = reportType === 'overtime' ? summary.reduce((sum, item) => sum + (item.totalHours || 0), 0) : 0;
    const totalLoads = reportType === 'bonuses' ? summary.reduce((sum, item) => sum + (item.totalLoads || 0), 0) : 0;

    return { records: filteredRecords, summary, totalAmount, totalHours, totalLoads };
  }, [isLoading, selectedDate, reportType, overtime, bonuses, withdrawals, employees, getEmployeeName, t, language]);


  const handlePrint = () => {
    window.print();
  };

  const reportTitles = {
    overtime: t('monthly_overtime_report'),
    bonuses: t('monthly_bonus_report'),
    withdrawals: t('monthly_withdrawal_report')
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
              <Link href="/ashley-expenses"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-xl">{reportTitles[reportType]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="h-10 px-4 py-2 bg-background border border-input rounded-md text-sm"
            >
                <option value="overtime">{t('overtime')}</option>
                <option value="bonuses">{t('bonuses')}</option>
                <option value="withdrawals">{t('cash_withdrawals')}</option>
            </select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[280px] justify-start text-left", !selectedDate && "text-muted-foreground")}>
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

        <main className="print:p-8">
            {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
            ) : monthlyData.records.length > 0 ? (
            <div className="space-y-8">
                <Card className="print:shadow-none print:border-none">
                <CardHeader>
                    <div className="text-center">
                         <h1 className="text-2xl">{reportTitles[reportType]}</h1>
                         <p className="text-muted-foreground">{selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('employee')}</TableHead>
                                    {reportType === 'overtime' && <TableHead className="text-right">{t('total_hours')}</TableHead>}
                                    {reportType === 'bonuses' && <TableHead className="text-right">{t('total_loads')}</TableHead>}
                                    <TableHead className="text-right">{t('total_amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyData.summary.map(item => (
                                    <TableRow key={item.employeeId}>
                                        <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{item.employeeName}</TableCell>
                                        {reportType === 'overtime' && <TableCell className="text-right">{item.totalHours?.toFixed(2)}</TableCell>}
                                        {reportType === 'bonuses' && <TableCell className="text-right">{item.totalLoads}</TableCell>}
                                        <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell>{t('grand_total')}</TableCell>
                                     {reportType === 'overtime' && <TableCell className="text-right">{monthlyData.totalHours.toFixed(2)}</TableCell>}
                                     {reportType === 'bonuses' && <TableCell className="text-right">{monthlyData.totalLoads}</TableCell>}
                                    <TableCell className="text-right text-primary">{formatCurrency(monthlyData.totalAmount)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
                </Card>
                <div className="hidden print:block pt-24">
                    <div className="flex justify-end">
                        <div className="w-64 text-center">
                            <p className="border-t pt-2">{t('warehouse_manager_signature')}</p>
                        </div>
                    </div>
                </div>
            </div>
            ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg print:hidden">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg">{t('no_records_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_records_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : t('the_selected_month')})}</p>
            </div>
            )}
        </main>
      </div>
    </>
  );
}
