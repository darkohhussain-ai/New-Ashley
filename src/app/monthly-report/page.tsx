'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Printer, Loader2, FileDown } from 'lucide-react';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const { pdfSettings, customFont } = settings;
  const { user, hasPermission } = useAuth();
  const isReadOnly = !hasPermission('page:admin');
  const reportContentRef = useRef<HTMLDivElement>(null);


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

  const handleDownloadPdf = async () => {
    if (!reportContentRef.current || !selectedDate) return;
    
    const doc = new jsPDF({ orientation: 'l', unit: 'px', format: 'a4' });
    
    const canvas = await html2canvas(reportContentRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: 'white',
        onclone: (document) => {
            if (customFont && language === 'ku') {
                const style = document.createElement('style');
                style.innerHTML = `@font-face { font-family: 'CustomPdfFont'; src: url(${customFont}); } body, table, div, p, h1, h2, h3 { font-family: 'CustomPdfFont' !important; }`;
                document.head.appendChild(style);
            }
        }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = imgWidth / imgHeight;
    let finalImgHeight = pdfWidth / ratio;

    let position = 0;
    
    if (finalImgHeight < pdfHeight) {
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalImgHeight);
    } else {
        let heightLeft = imgHeight;
        const scaledImgWidth = pdfHeight * ratio;
        while(heightLeft > 0) {
            doc.addImage(imgData, 'PNG', (pdfWidth - scaledImgWidth) / 2, position, scaledImgWidth, pdfHeight);
            heightLeft -= (imgHeight * (pdfHeight / finalImgHeight));
            position -= pdfHeight;
            if(heightLeft > 0) {
                doc.addPage();
            }
        }
    }
    
    doc.save(`monthly-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
  };

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={reportContentRef} className="bg-white" style={{width: '1122px'}}>
              {selectedDate && <FullMonthlyReportPdf
                  records={monthlyReportData.records}
                  date={selectedDate}
                  settings={settings}
                  getEmployeeName={getEmployeeName}
              />}
          </div>
      </div>
      <div className="hidden print:block">
        {selectedDate && <FullMonthlyReportPdf
            records={monthlyReportData.records}
            date={selectedDate}
            settings={settings}
            getEmployeeName={getEmployeeName}
        />}
      </div>

      <div className="h-[calc(100vh-80px)] flex flex-col print:hidden">
        <header className="flex items-center justify-between gap-4 mb-8 print:hidden p-4 md:p-8">
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
             <Button variant="outline" onClick={handlePrint} disabled={isLoading || monthlyReportData.records.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
             <Button variant="outline" onClick={handleDownloadPdf} disabled={isLoading || monthlyReportData.records.length === 0}><FileDown className="mr-2"/>PDF</Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8">
          {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
          ) : monthlyReportData.records.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('summary_for_month', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardTitle>
                <CardDescription>{t('summary_for_month_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('employee')}</TableHead>
                                <TableHead className="text-right">{t('salary')}</TableHead>
                                <TableHead className="text-right">{t('overtime')}</TableHead>
                                <TableHead className="text-right">{t('bonuses')}</TableHead>
                                <TableHead className="text-right">{t('expenses')}</TableHead>
                                <TableHead className="text-right">{t('cash_withdrawals')}</TableHead>
                                <TableHead className="text-right font-bold">{t('net_salary')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlyReportData.records.map(record => (
                                <TableRow key={record.employeeId}>
                                    <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{record.employeeName}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(record.salary)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(record.totalOvertime)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(record.totalBonuses)}</TableCell>
                                    <TableCell className="text-right text-red-500">{formatCurrency(record.totalExpenses)}</TableCell>
                                    <TableCell className="text-right text-red-500">{formatCurrency(record.totalWithdrawals)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{isReadOnly ? '***' : formatCurrency(record.netSalary)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold">{t('grand_total')}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(grandTotals.salary)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(grandTotals.totalOvertime)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(grandTotals.totalBonuses)}</TableCell>
                                <TableCell className="text-right font-bold text-red-500">{formatCurrency(grandTotals.totalExpenses)}</TableCell>
                                <TableCell className="text-right font-bold text-red-500">{formatCurrency(grandTotals.totalWithdrawals)}</TableCell>
                                <TableCell className="text-right font-bold text-primary">{isReadOnly ? '***' : formatCurrency(grandTotals.netSalary)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">{t('no_records_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_records_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : t('the_selected_month')})}</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
