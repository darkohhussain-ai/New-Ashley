'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Printer, Loader2, FileDown } from 'lucide-react';
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
import { useAuth } from '@/hooks/use-auth';
import useLocalStorage from '@/hooks/use-local-storage';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { AllPdfSettings } from '@/lib/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyExpenseReportPage() {
  const { t, language } = useTranslation();
  const { expenses, employees } = useAppContext();
  const { user, hasPermission } = useAuth();
  const isReadOnly = !hasPermission('page:admin');
  
  const [pdfSettings] = useLocalStorage<AllPdfSettings>('pdf-settings', { report: {}, invoice: {}, card: {} });
  const reportContentRef = useRef<HTMLDivElement>(null);


  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  useEffect(() => {
    // Only set date on client-side
    setSelectedDate(new Date());
  }, []);

  const isLoading = !expenses || !employees || !selectedDate;

  const getEmployeeName = (employeeId: string, useKurdish: boolean = false) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    if (isReadOnly && user?.username !== `${employee.name.split(' ')[0]}${employee.employeeId || ''}`) return '***';
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const monthlyData = useMemo(() => {
    if (!expenses || !employees || !selectedDate) return { expenses: [], summary: [], total: 0 };

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filteredExpenses = expenses.filter(e => isWithinInterval(parseISO(e.date), { start, end }));

    const employeeTotals = new Map<string, { totalAmount: number }>();
    filteredExpenses.forEach(expense => {
      const current = employeeTotals.get(expense.employeeId) || { totalAmount: 0 };
      current.totalAmount += expense.amount;
      employeeTotals.set(expense.employeeId, current);
    });

    const summary = Array.from(employeeTotals.entries()).map(([employeeId, totals]) => ({
      employeeId,
      employeeName: getEmployeeName(employeeId, language === 'ku'),
      ...totals
    })).sort((a,b) => b.totalAmount - a.totalAmount);
    
    const total = summary.reduce((sum, item) => sum + item.totalAmount, 0);

    return { expenses: filteredExpenses, summary, total };
  }, [expenses, employees, selectedDate, language, getEmployeeName, t, isReadOnly, user]);


  const handlePrint = () => {
    window.print();
  };
  
  const handleDownloadPdf = async () => {
    if (!reportContentRef.current || !selectedDate) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    
    const canvas = await html2canvas(reportContentRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth;
    const finalImgHeight = finalImgWidth / ratio;
    
    doc.addImage(imgData, 'PNG', 0, 0, finalImgWidth, finalImgHeight);
    doc.save(`monthly-expense-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={reportContentRef} className="bg-white" style={{width: '700px'}}>
             <ReportPdfHeader 
                title="Monthly Expense Report" 
                subtitle={selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}
                logoSrc={pdfSettings.report.logo ?? null} 
                themeColor={pdfSettings.report.reportColors?.expense}
             />
             <div className="p-8">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('employee')}</TableHead>
                            <TableHead className="text-right">{t('total_amount')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {monthlyData.summary.map(item => (
                            <TableRow key={item.employeeId}>
                                <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{item.employeeName}</TableCell>
                                <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.totalAmount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell className="text-lg">{t('grand_total')}</TableCell>
                            <TableCell className="text-right text-lg text-primary">{isReadOnly ? '***' : formatCurrency(monthlyData.total)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
                 <div className="pt-24">
                    <div className="flex justify-end">
                        <div className="w-64 text-center">
                            <p className="border-t pt-2">{t('warehouse_manager_signature')}</p>
                        </div>
                    </div>
                </div>
             </div>
          </div>
      </div>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:p-0">
        <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/expenses"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl">{t('monthly_expense_report')}</h1>
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
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-buttons" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading || monthlyData.expenses.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isLoading || monthlyData.expenses.length === 0}><FileDown className="mr-2"/>PDF</Button>
          </div>
        </header>

        <main className="print:p-8">
            {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
            ) : monthlyData.expenses.length > 0 ? (
            <div className="space-y-8">
                <Card className="print:shadow-none print:border-none">
                <CardHeader>
                    <div className="hidden print:block text-center">
                        <h1 className="text-2xl">{t('monthly_expense_report')}</h1>
                        <p className="text-muted-foreground">{selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('employee')}</TableHead>
                                    <TableHead className="text-right">{t('total_amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyData.summary.map(item => (
                                    <TableRow key={item.employeeId}>
                                        <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{item.employeeName}</TableCell>
                                        <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.totalAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="text-lg">{t('grand_total')}</TableCell>
                                    <TableCell className="text-right text-lg text-primary">{isReadOnly ? '***' : formatCurrency(monthlyData.total)}</TableCell>
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
                <h3 className="mt-4 text-lg font-medium">{t('no_expenses_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_expenses_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : 'the selected month'})}</p>
            </div>
            )}
        </main>
      </div>
    </>
  );
}
