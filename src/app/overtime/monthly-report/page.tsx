

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Printer, Loader2, FileDown, BarChart } from 'lucide-react';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyOvertimeReportPage() {
  const { t, language } = useTranslation();
  const { overtime, employees, settings } = useAppContext();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);
  
  const isLoading = !overtime || !employees || !selectedDate;

  const getEmployeeName = (employeeId: string, useKurdish: boolean = false) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const monthlyData = useMemo(() => {
    if (isLoading || !overtime || !employees || !selectedDate) return { records: [], summary: [], totalAmount: 0, totalHours: 0, chartData: [] };

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
      employeeName: getEmployeeName(employeeId, language === 'ku'),
      ...totals
    })).sort((a,b) => b.totalAmount - a.totalAmount);
    
    const totalAmount = summary.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalHours = summary.reduce((sum, item) => sum + item.totalHours, 0);
    
    return { records: filteredRecords, summary, totalAmount, totalHours };
  }, [isLoading, overtime, employees, selectedDate, t, language]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (isLoading || monthlyData.records.length === 0 || !selectedDate) return;

    const doc = new jsPDF();
    const tableTheme = settings.pdfSettings.report.tableTheme || 'striped';
    const themeColor = settings.pdfSettings.report.reportColors?.overtime || '#f97316';

    // Title
    doc.setFontSize(18);
    doc.setTextColor(themeColor);
    doc.text(t('monthly_overtime_report'), 14, 22);

    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(format(selectedDate, 'MMMM yyyy'), 14, 30);

    const head = [[t('employee'), t('total_hours'), t('total_amount')]];
    const body = monthlyData.summary.map(item => [
      item.employeeName,
      item.totalHours.toFixed(2),
      formatCurrency(item.totalAmount)
    ]);

    const totalRow = [
      { content: t('grand_total'), styles: { fontStyle: 'bold', halign: 'right' } },
      { content: monthlyData.totalHours.toFixed(2), styles: { fontStyle: 'bold', halign: 'center' } },
      { content: formatCurrency(monthlyData.totalAmount), styles: { fontStyle: 'bold', halign: 'center' } }
    ];

    (doc as any).autoTable({
      head,
      body: [...body, totalRow],
      startY: 40,
      theme: tableTheme,
      styles: {
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
        fontSize: 8,
      },
      headStyles: {
        fillColor: themeColor,
        textColor: 255,
        fontStyle: 'bold',
      },
      didDrawPage: (data: any) => {
        // Footer
        const pageCount = doc.internal.pages.length;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`monthly-overtime-report-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
  };
  
  if (isLoading) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="p-4 md:p-8 print:p-0 flex-1 overflow-y-auto">
          <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
              <Link href="/overtime"><ArrowLeft /></Link>
              </Button>
              <h1 className="text-xl">{t('monthly_overtime_report')}</h1>
          </div>
          <div className="flex items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[280px] justify-start text-left", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : <span>{t('pick_a_month')}</span>}
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }}
                    captionLayout="dropdown-nav" fromYear={2020} toYear={2040}
                  />
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
                      <div className="text-center">
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
