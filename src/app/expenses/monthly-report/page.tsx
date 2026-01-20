

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Printer, Loader2, FileDown, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import useLocalStorage from '@/hooks/use-local-storage';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { AllPdfSettings } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import Image from 'next/image';


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
  
  const { pdfSettings, customFont } = settings;
  const reportContentRef = useRef<HTMLDivElement>(null);


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
    if (isLoading || !expenses || !employees || !selectedDate) return { summary: [], grandTotal: 0, chartData: [] };

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

    const chartData = summaryArray.map(item => ({
        name: item.employeeName,
        [t('expenses')]: item.totalAmount,
    }));

    return { summary: summaryArray, grandTotal, chartData };
  }, [isLoading, expenses, employees, selectedDate, language, getEmployeeName, t, isReadOnly, user]);


  const handlePrint = () => {
    window.print();
  };
  
  const handleDownloadPdf = async () => {
    if (!reportContentRef.current || !selectedDate) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    
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
    
    let finalImgWidth = pdfWidth;
    let finalImgHeight = finalImgWidth / ratio;
    
    if (finalImgHeight > pdfHeight) {
        finalImgHeight = pdfHeight;
        finalImgWidth = finalImgHeight * ratio;
    }

    const x = (pdfWidth - finalImgWidth) / 2;
    
    doc.addImage(imgData, 'PNG', x, 0, finalImgWidth, finalImgHeight);
    doc.save(`monthly-expense-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={reportContentRef} style={{width: '800px'}}>
              {selectedDate && (
                <ReportWrapper
                    title={t('monthly_expense_report')}
                    date={format(selectedDate, 'MMMM yyyy')}
                    logoSrc={pdfSettings.report.logo}
                    themeColor={pdfSettings.report.reportColors?.expense || '#3b82f6'}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('employee')}</TableHead>
                                <TableHead className="text-right">{t('taxi_expenses')}</TableHead>
                                <TableHead className="text-right">{t('purchases_buying_items')}</TableHead>
                                <TableHead className="text-right font-bold">{t('total_amount')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {monthlyData.summary.map((item, index) => (
                            <TableRow key={item.employeeId} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                                <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{item.employeeName}</TableCell>
                                <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.taxiTotal)}</TableCell>
                                <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.purchasesTotal)}</TableCell>
                                <TableCell className="text-right font-bold">{isReadOnly ? '***' : formatCurrency(item.totalAmount)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-bold">{t('grand_total')}:</TableCell>
                                <TableCell className="text-right font-bold">{isReadOnly ? '***' : formatCurrency(monthlyData.grandTotal)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </ReportWrapper>
              )}
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
            <Button variant="outline" onClick={handlePrint} disabled={isLoading || monthlyData.summary.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isLoading || monthlyData.summary.length === 0}><FileDown className="mr-2"/>PDF</Button>
          </div>
        </header>

        <main className="print:p-8">
            {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
            ) : monthlyData.summary.length > 0 ? (
            <div className="space-y-8">
                <Card className="print:shadow-none print:border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart/> {t('employee_breakdown')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={monthlyData.chartData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" interval={0} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} cursor={{fill: 'hsl(var(--muted))'}} />
                                <Bar dataKey={t('expenses')} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="print:shadow-none print:border-none">
                    <CardHeader>
                        <div className="hidden print:block text-center">
                            <h1 className="text-2xl">{t('monthly_expense_report')}</h1>
                            <p className="text-muted-foreground">{selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Accordion type="single" collapsible className="w-full">
                          {monthlyData.summary.map(item => (
                            <AccordionItem value={item.employeeId} key={item.employeeId}>
                              <AccordionTrigger className="hover:no-underline">
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
                <Card>
                  <CardHeader><CardTitle>Report Preview</CardTitle></CardHeader>
                  <CardContent className="bg-muted/30 p-4 flex justify-center">
                    <div className="w-full max-w-3xl scale-[0.9] origin-top bg-white text-black">
                       <ReportWrapper
                            title={t('monthly_expense_report')}
                            date={selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}
                            logoSrc={pdfSettings.report.logo}
                            themeColor={pdfSettings.report.reportColors?.expense || '#3b82f6'}
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('employee')}</TableHead>
                                        <TableHead className="text-right">{t('taxi_expenses')}</TableHead>
                                        <TableHead className="text-right">{t('purchases_buying_items')}</TableHead>
                                        <TableHead className="text-right font-bold">{t('total_amount')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {monthlyData.summary.map((item, index) => (
                                    <TableRow key={item.employeeId} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                                        <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{item.employeeName}</TableCell>
                                        <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.taxiTotal)}</TableCell>
                                        <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.purchasesTotal)}</TableCell>
                                        <TableCell className="text-right font-bold">{isReadOnly ? '***' : formatCurrency(item.totalAmount)}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-right font-bold">{t('grand_total')}:</TableCell>
                                        <TableCell className="text-right font-bold">{isReadOnly ? '***' : formatCurrency(monthlyData.grandTotal)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </ReportWrapper>
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
        </main>
      </div>
    </>
  );
}
