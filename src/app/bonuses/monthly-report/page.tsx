
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileDown, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { AllPdfSettings } from '@/lib/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyBonusReportPage() {
  const { bonuses, employees } = useAppContext();
  const [pdfSettings] = useLocalStorage<AllPdfSettings>('pdf-settings', { report: {}, invoice: {} });
  const pdfHeaderRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const isLoading = !bonuses || !employees;

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || 'Unknown';
  };

  const monthlyData = useMemo(() => {
    if (isLoading || !selectedDate) return { records: [], summary: [], totalAmount: 0, totalLoads: 0 };

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filteredRecords = bonuses.filter(r => isWithinInterval(parseISO(r.date), { start, end }));

    const employeeTotals = new Map<string, { totalAmount: number; totalLoads: number }>();
    filteredRecords.forEach(record => {
      const current = employeeTotals.get(record.employeeId) || { totalAmount: 0, totalLoads: 0 };
      current.totalAmount += record.totalAmount;
      current.totalLoads += record.loadCount;
      employeeTotals.set(record.employeeId, current);
    });

    const summary = Array.from(employeeTotals.entries()).map(([employeeId, totals]) => ({
      employeeId,
      employeeName: getEmployeeName(employeeId),
      ...totals
    })).sort((a,b) => b.totalAmount - a.totalAmount);
    
    const totalAmount = summary.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalLoads = summary.reduce((sum, item) => sum + item.totalLoads, 0);

    return { records: filteredRecords, summary, totalAmount, totalLoads };
  }, [isLoading, selectedDate, bonuses, employees]);

  const handleDownloadPdf = async () => {
    if (!pdfHeaderRef.current || !selectedDate) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const settings = pdfSettings.report || {};
    
    if (settings.customFont) {
        const fontName = "CustomFont";
        const fontStyle = "normal";
        const fontBase64 = settings.customFont.split(',')[1];
        doc.addFileToVFS(\`\${fontName}.ttf\`, fontBase64);
        doc.addFont(\`\${fontName}.ttf\`, fontName, fontStyle);
        doc.setFont(fontName);
    }
    
    const headerCanvas = await html2canvas(pdfHeaderRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const headerImgData = headerCanvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const headerRatio = headerCanvas.width / headerCanvas.height;
    const finalHeaderWidth = pdfWidth;
    const finalHeaderHeight = finalHeaderWidth / headerRatio;
    doc.addImage(headerImgData, 'PNG', 0, 0, finalHeaderWidth, finalHeaderHeight);

    let startY = finalHeaderHeight + 10;

    if (chartRef.current) {
        const chartCanvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const chartImgData = chartCanvas.toDataURL('image/png');
        const chartRatio = chartCanvas.width / chartCanvas.height;
        const chartWidth = pdfWidth - 28;
        const chartHeight = chartWidth / chartRatio;
        
        if (startY + chartHeight > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            startY = 20;
        }
        doc.addImage(chartImgData, 'PNG', 14, startY, chartWidth, chartHeight);
        startY += chartHeight + 20;
    }
    
    if(monthlyData.summary.length > 0) {
        if (startY + 40 > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            startY = 20;
        }
        doc.setFontSize(14);
        doc.text("Summary by Employee", 14, startY);
        startY += 10;
        autoTable(doc, {
          startY: startY,
          head: [['Employee', 'Total Loads', 'Total Bonus']],
          body: monthlyData.summary.map(item => [item.employeeName, item.totalLoads.toFixed(0), formatCurrency(item.totalAmount)]),
          foot: [['Grand Total', monthlyData.totalLoads.toFixed(0), formatCurrency(monthlyData.totalAmount)]],
          theme: 'grid',
          headStyles: { fillColor: settings.themeColor || '#22c55e' },
          footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
          didParseCell: (data) => { if (settings.customFont) { (data.cell.styles as any).font = "CustomFont"; } }
        });
    }
    
    if (settings.footerText) {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(settings.footerText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
    }
    
    doc.save(\`monthly-bonus-report-\${format(selectedDate, 'yyyy-MM')}.pdf\`);
  };

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {selectedDate && (
          <div ref={pdfHeaderRef} style={{ width: '700px', background: 'white', color: 'black' }}>
            <ReportPdfHeader 
                title="Monthly Bonus Report" 
                subtitle={format(selectedDate, 'MMMM yyyy')} 
                logoSrc={pdfSettings.report?.logo ?? null}
                themeColor={pdfSettings.report?.themeColor}
                headerText={pdfSettings.report?.headerText}
            />
          </div>
        )}
      </div>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/bonuses"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Monthly Bonus Report</h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : <span>Pick a month</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-buttons" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
            <Button onClick={handleDownloadPdf} disabled={isLoading || monthlyData.records.length === 0}><FileDown className="mr-2"/>Download PDF</Button>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>
        ) : monthlyData.records.length > 0 ? (
          <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Monthly Summary by Employee</CardTitle>
                </CardHeader>
                <CardContent ref={chartRef} className="pl-0">
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={monthlyData.summary} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                            <XAxis type="number" tickFormatter={(value) => formatCurrency(value as number)} />
                            <YAxis dataKey="employeeName" type="category" width={120} />
                            <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))'}} formatter={(value) => formatCurrency(value as number)} />
                            <Bar dataKey="totalAmount" name="Total Bonus" fill="hsl(var(--primary))" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary for {selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="text-right">Total Loads</TableHead>
                                <TableHead className="text-right">Total Bonus</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlyData.summary.map(item => (
                                <TableRow key={item.employeeId}>
                                    <TableCell className="font-medium">{item.employeeName}</TableCell>
                                    <TableCell className="text-right font-semibold">{item.totalLoads.toFixed(0)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell className="text-lg font-bold">Grand Total</TableCell>
                                <TableCell className="text-right text-lg font-bold">{monthlyData.totalLoads.toFixed(0)}</TableCell>
                                <TableCell className="text-right text-lg font-bold text-primary">{formatCurrency(monthlyData.totalAmount)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Bonuses Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">There are no bonuses recorded for {selectedDate ? format(selectedDate, 'MMMM yyyy') : 'the selected month'}.</p>
          </div>
        )}
      </div>
    </>
  );
}
