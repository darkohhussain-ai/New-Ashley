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
import autoTable from 'jspdf-autotable';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyOvertimeReportPage() {
  const { t, language } = useTranslation();
  const { overtime, employees, settings, isLoading } = useAppContext();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      setSelectedDate(new Date());
    }
  }, [isLoading]);

  const getEmployeeName = (employeeId: string, useKurdish: boolean = false) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const monthlyData = useMemo(() => {
    if (isLoading || !overtime || !employees || !selectedDate) return { records: [], summary: [], totalAmount: 0, totalHours: 0 };

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
  }, [isLoading, overtime, employees, selectedDate, t, language, getEmployeeName]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (isLoading || monthlyData.records.length === 0 || !selectedDate || !settings) return;

    const doc = new jsPDF();
    const tableTheme = settings.pdfSettings.report.tableTheme || 'striped';
    const themeColor = settings.pdfSettings.report.reportColors?.overtime || '#f97316';

    doc.setFontSize(18);
    doc.setTextColor(themeColor);
    doc.text(t('monthly_overtime_report'), 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(format(selectedDate, 'MMMM yyyy'), 14, 30);

    const head = [[t('employee'), t('total_hours'), t('total_amount')]];
    const body = monthlyData.summary.map(item => [
      item.employeeName,
      item.totalHours.toFixed(2),
      formatCurrency(item.totalAmount)
    ]);
    
    const foot = [[
      t('grand_total'),
      monthlyData.totalHours.toFixed(2),
      formatCurrency(monthlyData.totalAmount),
    ]];

    autoTable(doc, {
      head,
      body,
      foot,
      startY: 40,
      theme: tableTheme,
      styles: {
        valign: 'middle',
        cellPadding: 3,
        fontSize: 8,
      },
      headStyles: {
        fillColor: themeColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      footStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`monthly-overtime-report-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
  };
  
  if (isLoading || !selectedDate) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
        <header className="flex items-center justify-between gap-4 mb-8 print:hidden p-4 md:p-8">
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
                        if (date) setSelectedDate(date);
                        setIsCalendarOpen(false);
                    }}
                    captionLayout="dropdown-nav" fromYear={2020} toYear={2040}
                    />
                </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={handlePrint} disabled={monthlyData.records.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
                <Button variant="outline" onClick={handleDownloadPdf} disabled={monthlyData.records.length === 0}><FileDown className="mr-2"/>PDF</Button>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 md:px-8 print:p-8">
            {monthlyData.records.length > 0 ? (
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
                                    <TableCell colSpan={1} className="text-right font-semibold">{t('grand_total')}</TableCell>
                                    <TableCell className="text-right font-semibold">{monthlyData.totalHours.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold text-primary">{formatCurrency(monthlyData.totalAmount)}</TableCell>
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
                <h3 className="mt-4 text-lg font-medium">{t('no_overtime_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_overtime_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : t('the_selected_month')})}</p>
            </div>
            )}
        </main>
    </div>
  );
}