
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAppContext } from '@/context/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import type { AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { shapeText } from '@/lib/pdf-utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyExpenseReportPage() {
  const { t, language } = useTranslation();
  const { expenses, employees, expenseReports } = useAppContext();

  const [pdfSettings] = useLocalStorage<AllPdfSettings>('pdf-settings', { report: {}, invoice: {} });
  const pdfHeaderRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  useEffect(() => {
    // Only set date on client-side
    setSelectedDate(new Date());
  }, []);

  const isLoading = !expenses || !employees || !expenseReports || !selectedDate;

  const getEmployeeName = (employeeId: string, useKurdish: boolean = false) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const monthlyData = useMemo(() => {
    if (!expenses || !employees || !expenseReports || !selectedDate) return { expenses: [], summary: [], total: 0 };

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const relevantReportIds = new Set(
        expenseReports
            .filter(r => isWithinInterval(parseISO(r.reportDate), { start, end }))
            .map(r => r.id)
    );

    const filteredExpenses = expenses.filter(e => relevantReportIds.has(e.expenseReportId));

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
  }, [expenses, employees, expenseReports, selectedDate, language, getEmployeeName, t]);

  const handleDownloadPdf = async () => {
    if (!pdfHeaderRef.current || !selectedDate) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const settings = pdfSettings.report || {};
    const useKurdish = language === 'ku';
    const fontName = "CustomFont";

    if (settings.customFont && useKurdish) {
        try {
            const fontBase64 = settings.customFont.split(',')[1];
            doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
            doc.addFont(`${fontName}.ttf`, fontName, "normal");
            doc.setFont(fontName);
        } catch (e) {
            console.error("Failed to load custom font:", e);
        }
    }
    
    // Header
    const headerCanvas = await html2canvas(pdfHeaderRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const headerImgData = headerCanvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const headerRatio = headerCanvas.width / headerCanvas.height;
    const finalHeaderWidth = pdfWidth;
    const finalHeaderHeight = finalHeaderWidth / headerRatio;
    doc.addImage(headerImgData, 'PNG', 0, 0, finalHeaderWidth, finalHeaderHeight);

    let startY = finalHeaderHeight + 20;

    // Summary Table
    if(monthlyData.summary.length > 0) {
        autoTable(doc, {
          startY: startY,
          head: [[shapeText(t('employee')), shapeText(t('total_amount'))]],
          body: monthlyData.summary.map(item => [shapeText(item.employeeName), formatCurrency(item.totalAmount)]),
          foot: [[shapeText(t('grand_total')), formatCurrency(monthlyData.total)]],
          theme: 'grid',
          styles: { font: (useKurdish && settings.customFont) ? fontName : 'helvetica', halign: useKurdish ? 'right' : 'left' },
          headStyles: { font: (useKurdish && settings.customFont) ? fontName : 'helvetica', fillColor: settings.reportColors?.expense || settings.themeColor || '#22c55e' },
          footStyles: { font: (useKurdish && settings.customFont) ? fontName : 'helvetica', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        });
        startY = (doc as any).lastAutoTable.finalY + 20;
    }
    
    // Detailed Table
    if(monthlyData.expenses.length > 0) {
        if (startY + 40 > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            startY = 20;
        }
        if (useKurdish && settings.customFont) doc.setFont(fontName);
        doc.setFontSize(14);
        doc.text(shapeText(t('all_transactions')), useKurdish ? doc.internal.pageSize.width - 14 : 14, startY, { align: useKurdish ? 'right' : 'left' });
        startY += 10;
        
        const getReportName = (reportId: string) => expenseReports.find(r => r.id === reportId)?.reportName || 'N/A';

        autoTable(doc, {
          startY: startY,
          head: [[shapeText(t('date')), shapeText(t('report')), shapeText(t('employee')), shapeText(t('notes')), shapeText(t('amount'))]],
          body: monthlyData.expenses.map(item => [
              format(parseISO(expenseReports.find(r=>r.id === item.expenseReportId)!.reportDate), 'PP'),
              shapeText(getReportName(item.expenseReportId)),
              shapeText(getEmployeeName(item.employeeId, useKurdish)),
              shapeText(item.notes || t('na')),
              formatCurrency(item.amount)
          ]),
          theme: 'striped',
          styles: { font: (useKurdish && settings.customFont) ? fontName : 'helvetica', halign: useKurdish ? 'right' : 'left' },
          headStyles: { font: (useKurdish && settings.customFont) ? fontName : 'helvetica', fillColor: [40, 40, 40] },
        });
    }

    const finalYWithSignature = (doc as any).lastAutoTable.finalY + 40;
    const pageHeightWithSignature = doc.internal.pageSize.height;
    if (finalYWithSignature > pageHeightWithSignature - 30) {
        doc.addPage();
    }
    const signatureYWithSignature = finalYWithSignature > pageHeightWithSignature - 50 ? 40 : finalYWithSignature;
    if (useKurdish && settings.customFont) doc.setFont(fontName);
    doc.setFontSize(10);
    doc.text("...................................", doc.internal.pageSize.width - 120, signatureYWithSignature, { align: 'center' });
    doc.text(shapeText(t('warehouse_manager_signature')), doc.internal.pageSize.getWidth() - 120, signatureYWithSignature + 10, { align: 'center' });


    if (settings.footerText) {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            if (useKurdish && settings.customFont) doc.setFont(fontName);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(shapeText(settings.footerText), doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
    }
    
    doc.save(`monthly-expense-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {selectedDate && (
          <div ref={pdfHeaderRef} style={{ width: '700px', background: 'white', color: 'black' }}>
            <ReportPdfHeader 
                title={t('monthly_expense_report')} 
                subtitle={format(selectedDate, 'MMMM yyyy')} 
                logoSrc={pdfSettings.report?.logo ?? null}
                themeColor={pdfSettings.report?.reportColors?.expense ?? pdfSettings.report?.themeColor}
                headerText={pdfSettings.report?.headerText}
            />
          </div>
        )}
      </div>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:p-0">
        <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/expenses"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">{t('monthly_expense_report')}</h1>
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
            <Button onClick={handleDownloadPdf} disabled={isLoading || monthlyData.expenses.length === 0}><FileText className="mr-2"/>{t('download_pdf')}</Button>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading || monthlyData.expenses.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
          </div>
        </header>

        <main className="print:p-8">
            {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
            ) : monthlyData.expenses.length > 0 ? (
            <div className="space-y-8">
                <Card className="print:shadow-none print:border-none">
                <CardHeader>
                    <div className="print:hidden">
                        <CardTitle>{t('summary_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardTitle>
                    </div>
                    <div className="hidden print:block text-center">
                        <h1 className="text-2xl font-bold">{t('monthly_expense_report')}</h1>
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
                                        <TableCell className="font-medium" dir={language === 'ku' ? 'rtl' : 'ltr'}>{item.employeeName}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="text-lg font-bold">{t('grand_total')}</TableCell>
                                    <TableCell className="text-right text-lg font-bold text-primary">{formatCurrency(monthlyData.total)}</TableCell>
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

    
