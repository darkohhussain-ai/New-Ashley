
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
import { useAuth } from '@/hooks/use-auth';
import { FullMonthlyReportPdf } from '@/components/reports/FullMonthlyReportPdf';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

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

  const handleGeneratePdf = async () => {
    if (!selectedDate) return;
    const doc = new jsPDF({
      orientation: 'l',
      unit: 'pt',
      format: 'a4',
    });

    const fontName = 'CustomAppFont';

    if (settings.customFont) {
        try {
            const base64Font = settings.customFont.split(',')[1];
            const fontFileName = `${fontName}.ttf`;
            doc.addFileToVFS(fontFileName, base64Font);
            doc.addFont(fontFileName, fontName, 'normal');
            doc.setFont(fontName);
        } catch (e) {
            console.error("Error with custom font:", e);
            toast({
                variant: "destructive",
                title: "Font Error",
                description: "Could not apply the custom font. Using default.",
            });
            doc.setFont('helvetica');
        }
    } else {
        doc.setFont('helvetica');
    }

    const headerTitle = t('monthly_reports');
    const headerDate = format(selectedDate, 'MMMM yyyy');

    doc.setFontSize(18);
    doc.text(headerTitle, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(headerDate, doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    const head = [[
        t('employee'),
        t('salary'),
        t('overtime'),
        t('bonuses'),
        t('expenses'),
        t('cash_withdrawals'),
        t('net_salary'),
    ]];

    const body = monthlyReportData.records.map(record => [
        getEmployeeName(record.employeeId, language === 'ku'),
        isReadOnly ? '***' : formatCurrency(record.salary),
        isReadOnly ? '***' : formatCurrency(record.totalOvertime),
        isReadOnly ? '***' : formatCurrency(record.totalBonuses),
        isReadOnly ? '***' : formatCurrency(record.totalExpenses),
        isReadOnly ? '***' : formatCurrency(record.totalWithdrawals),
        isReadOnly ? '***' : formatCurrency(record.netSalary),
    ]);
    
    body.push([
        { content: t('grand_total'), styles: { fontStyle: 'bold' } },
        { content: isReadOnly ? '***' : formatCurrency(grandTotals.salary), styles: { fontStyle: 'bold' } },
        { content: isReadOnly ? '***' : formatCurrency(grandTotals.totalOvertime), styles: { fontStyle: 'bold' } },
        { content: isReadOnly ? '***' : formatCurrency(grandTotals.totalBonuses), styles: { fontStyle: 'bold' } },
        { content: isReadOnly ? '***' : formatCurrency(grandTotals.totalExpenses), styles: { fontStyle: 'bold', textColor: [239, 68, 68] } },
        { content: isReadOnly ? '***' : formatCurrency(grandTotals.totalWithdrawals), styles: { fontStyle: 'bold', textColor: [239, 68, 68] } },
        { content: isReadOnly ? '***' : formatCurrency(grandTotals.netSalary), styles: { fontStyle: 'bold' } },
    ]);
    
    autoTable(doc, {
        head: head,
        body: body,
        startY: 80,
        styles: {
            font: fontName,
            fontSize: 8,
            cellPadding: 4,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: '#3B82F6',
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
        },
        columnStyles: {
            0: { halign: language === 'ku' ? 'right' : 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
        },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.text(
            `${t('page')} ${doc.internal.pages.length}`,
            data.settings.margin.left,
            doc.internal.pageSize.getHeight() - 10
          );
        },
    });

    doc.save(`monthly-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
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
      </>
  );

  return (
    <>
      <div className="hidden print:block">
        <ReportWrapper>
          {selectedDate && <FullMonthlyReportPdf
              records={monthlyReportData.records}
              date={selectedDate}
              settings={settings}
              getEmployeeName={getEmployeeName}
          />}
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
            <Button variant="outline" onClick={handleGeneratePdf} disabled={isLoading || monthlyReportData.records.length === 0}>
                <FileText className="mr-2"/>PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading || monthlyReportData.records.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8">
          <PageContent />
        </main>
      </div>
    </>
  );
}
