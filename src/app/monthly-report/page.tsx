
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileDown, Printer, Loader2 } from 'lucide-react';
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
import { useAuth } from '@/hooks/use-auth';
import { FullMonthlyReportPdf } from '@/components/reports/FullMonthlyReportPdf';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyReportPage() {
  const { t, language } = useTranslation();
  const { employees, expenses, overtime, bonuses, withdrawals, settings } = useAppContext();
  const { user, hasPermission } = useAuth();
  const isReadOnly = !hasPermission('page:admin');
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const isLoading = !employees || !expenses || !overtime || !bonuses || !withdrawals || !selectedDate;
  
  const getEmployeeName = (employeeId: string, useKurdish: boolean = false) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    if (isReadOnly && user?.username !== `${employee.name.split(' ')[0]}${employee.employeeId || ''}`) return '***';
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const monthlyReportData = useMemo(() => {
    if (isLoading || !selectedDate) return { records: [] };

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const reportData = employees.map(emp => {
      const empExpenses = expenses.filter(e => e.employeeId === emp.id && isWithinInterval(parseISO(e.date), { start, end }));
      const empOvertime = overtime.filter(o => o.employeeId === emp.id && isWithinInterval(parseISO(o.date), { start, end }));
      const empBonuses = bonuses.filter(b => b.employeeId === emp.id && isWithinInterval(parseISO(b.date), { start, end }));
      const empWithdrawals = withdrawals.filter(w => w.employeeId === emp.id && isWithinInterval(parseISO(w.date), { start, end }));

      const totalExpenses = empExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalOvertime = empOvertime.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalBonuses = empBonuses.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalWithdrawals = empWithdrawals.reduce((sum, w) => sum + w.amount, 0);

      const salary = 0; // Salary calculation logic to be implemented here
      const netSalary = salary + totalOvertime + totalBonuses - totalExpenses - totalWithdrawals;

      return {
        employeeId: emp.id,
        employeeName: getEmployeeName(emp.id, language === 'ku'),
        salary,
        totalOvertime,
        totalBonuses,
        totalExpenses,
        totalWithdrawals,
        netSalary,
      };
    });

    return { records: reportData };
  }, [isLoading, employees, expenses, overtime, bonuses, withdrawals, selectedDate, getEmployeeName, language, isReadOnly, user?.username, t]);

  const grandTotals = useMemo(() => {
    return monthlyReportData.records.reduce((acc, record) => {
        acc.salary += record.salary;
        acc.totalOvertime += record.totalOvertime;
        acc.totalBonuses += record.totalBonuses;
        acc.totalExpenses += record.totalExpenses;
        acc.totalWithdrawals += record.totalWithdrawals;
        acc.netSalary += record.netSalary;
        return acc;
    }, {
        salary: 0,
        totalOvertime: 0,
        totalBonuses: 0,
        totalExpenses: 0,
        totalWithdrawals: 0,
        netSalary: 0,
    });
  }, [monthlyReportData.records]);


  const handlePrint = () => {
    window.print();
  };
  
  const PageContent = () => (
      <>
        {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
          ) : monthlyReportData.records.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('summary_for_month', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardTitle>
                <CardDescription>{t('summary_for_month_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <FullMonthlyReportPdf
                  records={monthlyReportData.records}
                  grandTotals={grandTotals}
                  getEmployeeName={getEmployeeName}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg print:hidden">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">{t('no_records_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_records_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : t('the_selected_month')})}</p>
            </div>
          )}
      </>
  );

  return (
    <>
      <div className="hidden print:block">
        <ReportWrapper
          title={t('monthly_reports')}
          date={selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}
        >
          <PageContent />
        </ReportWrapper>
      </div>

      <div className="h-[calc(100vh-80px)] flex flex-col print:hidden">
        <header className="flex items-center justify-between gap-4 mb-8 p-4 md:p-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/ashley-expenses"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl">{t('monthly_reports')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[280px] justify-start text-left", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : <span>{t('pick_a_month')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={handlePrint} disabled={isLoading || monthlyReportData.records.length === 0}><Printer className="h-4 w-4"/></Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8">
          <PageContent />
        </main>
      </div>
    </>
  );
}

    
