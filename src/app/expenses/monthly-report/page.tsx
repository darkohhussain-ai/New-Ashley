

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Printer, Loader2, BarChart, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as ShadcnTableFooter } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import type { AllPdfSettings } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyExpenseReportPage() {
  const { t, language } = useTranslation();
  const { expenses, employees, settings } = useAppContext();
  const { user, hasPermission } = useAuth();
  const isReadOnly = !hasPermission('page:admin');
  const { toast } = useToast();
  
  const { pdfSettings, customFont } = settings;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
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
    if (isLoading || !expenses || !employees || !selectedDate) return { summary: [], grandTotal: 0 };

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filteredExpenses = expenses.filter(e => isWithinInterval(parseISO(e.date), { start, end }));

    const employeeSummaries = new Map<string, {
        employeeName: string;
        totalAmount: number;
        taxiTotal: number;
        purchasesTotal: number;
        taxiBreakdown: Record<string, number>;
    }>();

    filteredExpenses.forEach(expense => {
        if (!employeeSummaries.has(expense.employeeId)) {
            employeeSummaries.set(expense.employeeId, {
                employeeName: getEmployeeName(expense.employeeId, language === 'ku'),
                totalAmount: 0,
                taxiTotal: 0,
                purchasesTotal: 0,
                taxiBreakdown: {},
            });
        }

        const summary = employeeSummaries.get(expense.employeeId)!;
        summary.totalAmount += expense.amount;

        if (expense.expenseType === 'Taxi Expenses') {
            summary.taxiTotal += expense.amount;
            if (expense.expenseSubType) {
                summary.taxiBreakdown[expense.expenseSubType] = (summary.taxiBreakdown[expense.expenseSubType] || 0) + expense.amount;
            }
        } else if (expense.expenseType === 'Purchases (Buying Items)') {
            summary.purchasesTotal += expense.amount;
        }
    });

    const summaryArray = Array.from(employeeSummaries.entries()).map(([employeeId, summary]) => ({
      employeeId,
      ...summary
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    const grandTotal = summaryArray.reduce((sum, item) => sum + item.totalAmount, 0);

    return { summary: summaryArray, grandTotal };
  }, [isLoading, expenses, employees, selectedDate, language, getEmployeeName, t, isReadOnly, user]);


  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    if (!selectedDate || monthlyData.summary.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No data to generate PDF.",
      });
      return;
    }

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    });

    const fontName = 'CustomAppFont';

    if (customFont) {
        try {
            const base64Font = customFont.split(',')[1];
            doc.addFileToVFS(`${fontName}.ttf`, base64Font);
            doc.addFont(`${fontName}.ttf`, fontName, 'normal');
            doc.setFont(fontName);
        } catch (e) {
            console.error("Error with custom font:", e);
            doc.setFont('helvetica');
        }
    } else {
        doc.setFont('helvetica');
    }

    const headerTitle = t('monthly_expense_report');
    const headerDate = format(selectedDate, 'MMMM yyyy');
    
    doc.setFontSize(18);
    doc.text(headerTitle, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(headerDate, doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    let startY = 80;

    monthlyData.summary.forEach((item) => {
        if (startY > doc.internal.pageSize.getHeight() - 100) {
            doc.addPage();
            startY = 40;
        }
        
        autoTable(doc, {
            head: [[item.employeeName, isReadOnly ? '***' : formatCurrency(item.totalAmount)]],
            startY: startY,
            theme: 'plain',
            headStyles: { fontStyle: 'bold', fontSize: 12, fillColor: false, textColor: 20 },
        });

        const body = [
          [t('taxi_expenses'), isReadOnly ? '***' : formatCurrency(item.taxiTotal)],
          ...Object.entries(item.taxiBreakdown).map(([subType, amount]) => ([
            `- ${t(subType.toLowerCase().replace(/\s/g, '_'))}`,
            isReadOnly ? '***' : formatCurrency(amount)
          ])),
          [t('purchases_buying_items'), isReadOnly ? '***' : formatCurrency(item.purchasesTotal)],
        ].filter(row => (row[1] as string) !== formatCurrency(0));

        autoTable(doc, {
            body: body,
            startY: (doc as any).lastAutoTable.finalY,
            theme: 'grid',
            styles: {
                font: fontName,
                fontSize: 9,
                cellPadding: 4,
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'right' },
            }
        });
        startY = (doc as any).lastAutoTable.finalY + 20;
    });

    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(14);
    doc.setFont(fontName, 'bold');
    doc.text(`${t('grand_total')}: ${isReadOnly ? '***' : formatCurrency(monthlyData.grandTotal)}`, doc.internal.pageSize.getWidth() - 30, finalY, { align: 'right' });


    doc.save(`monthly-expenses-${format(selectedDate, 'yyyy-MM')}.pdf`);
  };

  const handleExportExcel = () => {
    if (!monthlyData || monthlyData.summary.length === 0 || !selectedDate) {
      toast({
        variant: "destructive",
        title: t('no_data_to_export'),
      });
      return;
    }

    const allTaxiSubtypes = new Set<string>();
    monthlyData.summary.forEach(item => {
        Object.keys(item.taxiBreakdown).forEach(subType => allTaxiSubtypes.add(subType));
    });
    const sortedTaxiSubtypes = Array.from(allTaxiSubtypes).sort();

    const dataToExport = monthlyData.summary.map(item => {
        const row: {[key: string]: any} = {
            [t('employee')]: item.employeeName,
            [t('total_expenses')]: item.totalAmount,
            [t('taxi_expenses')]: item.taxiTotal,
            [t('purchases_buying_items')]: item.purchasesTotal,
        };
        
        sortedTaxiSubtypes.forEach(subType => {
            row[t(subType.toLowerCase().replace(/\s/g, '_'))] = item.taxiBreakdown[subType] || 0;
        });

        return row;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    const totals: {[key: string]: any} = {
        [t('employee')]: t('grand_total'),
        [t('total_expenses')]: monthlyData.grandTotal,
        [t('taxi_expenses')]: monthlyData.summary.reduce((sum, item) => sum + item.taxiTotal, 0),
        [t('purchases_buying_items')]: monthlyData.summary.reduce((sum, item) => sum + item.purchasesTotal, 0),
    };
    sortedTaxiSubtypes.forEach(subType => {
        totals[t(subType.toLowerCase().replace(/\s/g, '_'))] = monthlyData.summary.reduce((sum, item) => sum + (item.taxiBreakdown[subType] || 0), 0);
    });

    XLSX.utils.sheet_add_json(worksheet, [totals], { skipHeader: true, origin: -1 });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Expenses');

    XLSX.writeFile(workbook, `Monthly_Expenses_${format(selectedDate, 'yyyy-MM')}.xlsx`);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const PageContent = () => (
      <>
       {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
            ) : monthlyData.summary.length > 0 ? (
            <div className="space-y-8">
                <Card className="print:shadow-none print:border-none">
                    <CardHeader>
                        <div className="text-center">
                            <h1 className="text-2xl">{t('monthly_expense_report')}</h1>
                            <p className="text-muted-foreground">{selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Accordion type="single" collapsible className="w-full">
                          {monthlyData.summary.map(item => (
                            <AccordionItem value={item.employeeId} key={item.employeeId}>
                              <AccordionTrigger className="hover:no-underline text-base">
                                <div className="flex justify-between w-full pr-4">
                                  <span dir={language === 'ku' ? 'rtl' : 'ltr'}>{item.employeeName}</span>
                                  <span className="font-semibold">{isReadOnly ? '***' : formatCurrency(item.totalAmount)}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="p-4 bg-muted/50 rounded-md">
                                  <Table>
                                    <TableBody>
                                      {item.taxiTotal > 0 && (
                                        <>
                                          <TableRow>
                                            <TableCell className="font-medium pl-4">{t('taxi_expenses')}</TableCell>
                                            <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.taxiTotal)}</TableCell>
                                          </TableRow>
                                          {Object.entries(item.taxiBreakdown).map(([subType, amount]) => (
                                            <TableRow key={subType} className="text-sm">
                                              <TableCell className="text-muted-foreground pl-8">- {t(subType.toLowerCase().replace(/\s/g, '_'))}</TableCell>
                                              <TableCell className="text-right text-muted-foreground">{isReadOnly ? '***' : formatCurrency(amount)}</TableCell>
                                            </TableRow>
                                          ))}
                                        </>
                                      )}
                                      {item.purchasesTotal > 0 && (
                                        <TableRow>
                                          <TableCell className="font-medium pl-4">{t('purchases_buying_items')}</TableCell>
                                          <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.purchasesTotal)}</TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                       </Accordion>
                       <div className="flex justify-end font-bold text-lg mt-4 pr-4">
                          <span>{t('grand_total')}:</span>
                          <span className="text-primary ml-2">{isReadOnly ? '***' : formatCurrency(monthlyData.grandTotal)}</span>
                       </div>
                    </CardContent>
                </Card>
            </div>
            ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg print:hidden">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">{t('no_expenses_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_expenses_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : 'the selected month'})}</p>
            </div>
            )}
      </>
  );

  return (
    <>
      <div className="hidden print:block">
        <ReportWrapper>
          <PageContent />
        </ReportWrapper>
      </div>
      <div className="h-[calc(100vh-80px)] flex flex-col print:hidden">
        <header className="flex items-center justify-between gap-4 mb-8 p-4 md:p-8">
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
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                  }}
                  captionLayout="dropdown-nav" fromYear={2020} toYear={2040}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading || monthlyData.summary.length === 0}><Printer className="mr-2 h-4 w-4"/>{t('print')}</Button>
            <Button variant="outline" onClick={handleGeneratePdf} disabled={isLoading || monthlyData.summary.length === 0}>
                <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || monthlyData.summary.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4"/> Excel
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8">
            <PageContent />
        </main>
      </div>
    </>
  );
}
