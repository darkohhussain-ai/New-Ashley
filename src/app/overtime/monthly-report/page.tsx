'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Printer, Loader2, FileDown, BarChart } from 'lucide-react';
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
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import html2canvas from 'html2canvas';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';


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
  const { pdfSettings, customFont } = settings;
  
  const reportContentRef = useRef<HTMLDivElement>(null);


  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
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
    
    const chartData = summary.map(item => ({
        name: item.employeeName,
        [t('overtime')]: item.totalAmount,
    }));

    return { records: filteredRecords, summary, totalAmount, totalHours, chartData };
  }, [isLoading, overtime, employees, selectedDate, t, language]);

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
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth;
    const finalImgHeight = finalImgWidth / ratio;
    
    doc.addImage(imgData, 'PNG', 0, 0, finalImgWidth, finalImgHeight);
    doc.save(`monthly-overtime-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
  };
  
  if (isLoading) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={reportContentRef} className="bg-white" style={{width: '700px'}}>
             <ReportWrapper 
                title="Monthly Overtime Report" 
                date={selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}
                logoSrc={pdfSettings.report.logo ?? null} 
                themeColor={pdfSettings.report.reportColors?.overtime}
             >
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
             </ReportWrapper>
          </div>
        </div>
        <div className="p-4 md:p-8 print:p-0 flex-1 overflow-y-auto">
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
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
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
                            <CardTitle className="flex items-center gap-2"><BarChart/> {t('employee_breakdown')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={monthlyData.chartData}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" interval={0} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Bar dataKey={t('overtime')} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
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
      </div>
    </>
  );
}
