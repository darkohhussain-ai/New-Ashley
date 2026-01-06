'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Printer, Loader2, FileDown } from 'lucide-react';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { shapeText } from '@/lib/pdf-utils';
import useLocalStorage from '@/hooks/use-local-storage';
import { AllPdfSettings } from '@/lib/types';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyOvertimeReportPage() {
  const { t, language } = useTranslation();
  const { overtime, employees } = useAppContext();
  const [pdfSettings] = useLocalStorage<AllPdfSettings>('pdf-settings', { report: {}, invoice: {}, card: {} });
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);


  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);
  
  const isLoading = !overtime || !employees || !selectedDate;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    return language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const monthlyData = useMemo(() => {
    if (!overtime || !employees || !selectedDate) return { records: [], summary: [], totalAmount: 0, totalHours: 0 };

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filteredRecords = overtime.filter(r => isWithinInterval(parseISO(r.date), { start, end }));

    const employeeTotals = new Map<string, { totalAmount: number; totalHours: number; records: typeof overtime }>();
    filteredRecords.forEach(record => {
      const current = employeeTotals.get(record.employeeId) || { totalAmount: 0, totalHours: 0, records: [] };
      current.totalAmount += record.totalAmount;
      current.totalHours += record.hours;
      current.records.push(record);
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
  }, [overtime, employees, selectedDate, t, language]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!selectedDate || monthlyData.summary.length === 0) return;
    const doc = new jsPDF();
    const useKurdish = language === 'ku';

    if (customFontBase64 && useKurdish) {
        try {
            const fontName = "CustomFont";
            doc.addFileToVFS(`${fontName}.ttf`, customFontBase64.split(',')[1]);
            doc.addFont(`${fontName}.ttf`, fontName, "normal");
            doc.setFont(fontName);
        } catch (e) {
            console.error("Could not add custom font to PDF", e);
        }
    }
    
    doc.setFontSize(18);
    doc.text(shapeText(`${t('monthly_overtime_report')} - ${format(selectedDate, 'MMMM yyyy')}`), 14, 22);
    doc.setFontSize(11);
    
    const head = [[shapeText(t('employee')), shapeText(t('total_hours')), shapeText(t('total_amount'))]];
    const body = monthlyData.summary.map(item => [
        shapeText(item.employeeName),
        item.totalHours.toFixed(2),
        formatCurrency(item.totalAmount)
    ]);

    autoTable(doc, {
      startY: 30,
      head,
      body,
      foot: [[shapeText(t('grand_total')), monthlyData.totalHours.toFixed(2), formatCurrency(monthlyData.totalAmount)]],
      theme: 'striped',
      styles: { font: (customFontBase64 && useKurdish) ? 'CustomFont' : 'helvetica', halign: useKurdish ? 'right' : 'left' },
      headStyles: { fillColor: pdfSettings.report.reportColors?.overtime || '#f97316' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 40;
    const pageHeight = doc.internal.pageSize.height;
    if (finalY > pageHeight - 30) {
        doc.addPage();
    }
    const signatureY = finalY > pageHeight - 50 ? 40 : finalY;
    doc.setFontSize(10);
    doc.text("...................................", doc.internal.pageSize.width - 120, signatureY, { align: 'center' });
    doc.text(shapeText(t('warehouse_manager_signature')), doc.internal.pageSize.width - 120, signatureY + 10, { align: 'center' });


    doc.save(`monthly-overtime-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
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
            <h1 className="text-xl">{t('monthly_overtime_report')}</h1>
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
            <Button variant="outline" onClick={handlePrint} disabled={isLoading || monthlyData.records.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isLoading || monthlyData.records.length === 0}><FileDown className="mr-2"/>PDF</Button>
          </div>
        </header>

        <main className="print:p-8">
            {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
            ) : monthlyData.records.length > 0 ? (
            <div className="space-y-8">
                <Card className="print:shadow-none print:border-none">
                <CardHeader>
                    <div className="print:hidden">
                        <CardTitle>{t('summary_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardTitle>
                    </div>
                    <div className="hidden print:block text-center">
                         <h1 className="text-2xl">{t('monthly_overtime_report')}</h1>
                         <p className="text-muted-foreground">{selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}</p>
                    </div>
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
                                        <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{item.employeeName}</TableCell>
                                        <TableCell className="text-right">{item.totalHours.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell>{t('grand_total')}</TableCell>
                                    <TableCell className="text-right">{monthlyData.totalHours.toFixed(2)}</TableCell>
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
                <h3 className="mt-4 text-lg">{t('no_overtime_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_overtime_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : t('the_selected_month')})}</p>
            </div>
            )}
        </main>
      </div>
    </>
  );
}
