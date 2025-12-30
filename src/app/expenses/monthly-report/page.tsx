
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, FileDown, User, BarChart } from 'lucide-react';
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MonthlyExpenseReportPage() {
  const { expenses, employees, expenseReports } = useAppContext();

  const defaultLogo = "https://picsum.photos/seed/ashley-logo/300/100";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);
  const pdfHeaderRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const isLoading = !expenses || !employees || !expenseReports;

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || 'Unknown';
  };
  
  const getReportName = (reportId: string) => {
      return expenseReports.find(r => r.id === reportId)?.reportName || 'N/A';
  }

  const monthlyData = useMemo(() => {
    if (isLoading || !selectedDate) return { expenses: [], summary: [], total: 0 };

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
      employeeName: getEmployeeName(employeeId),
      ...totals
    })).sort((a,b) => b.totalAmount - a.totalAmount);
    
    const total = summary.reduce((sum, item) => sum + item.totalAmount, 0);

    return { expenses: filteredExpenses, summary, total };
  }, [isLoading, selectedDate, expenses, employees, expenseReports]);

  const handleDownloadPdf = async () => {
    if (!pdfHeaderRef.current || !selectedDate) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    if (customFontBase64) {
      const fontName = "CustomFont";
      const fontStyle = "normal";
      const fontBase64 = customFontBase64.split(',')[1];
      doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
      doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
      doc.setFont(fontName);
    }
    
    // Header
    const headerCanvas = await html2canvas(pdfHeaderRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const headerImgData = headerCanvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const headerRatio = headerCanvas.width / headerCanvas.height;
    const finalHeaderWidth = pdfWidth - 28;
    const finalHeaderHeight = finalHeaderWidth / headerRatio;
    doc.addImage(headerImgData, 'PNG', 14, 14, finalHeaderWidth, finalHeaderHeight);

    let startY = finalHeaderHeight + 30;

    // Chart
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
    
    // Summary Table
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
          head: [['Employee', 'Total Amount']],
          body: monthlyData.summary.map(item => [item.employeeName, formatCurrency(item.totalAmount)]),
          foot: [['Grand Total', formatCurrency(monthlyData.total)]],
          theme: 'grid',
          headStyles: { fillColor: [22, 163, 74] },
          footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
          didParseCell: (data) => { if (customFontBase64) { (data.cell.styles as any).font = "CustomFont"; } }
        });
        startY = (doc as any).lastAutoTable.finalY + 20;
    }
    
    // Detailed Table
    if(monthlyData.expenses.length > 0) {
        if (startY + 40 > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            startY = 20;
        }
        doc.setFontSize(14);
        doc.text("Detailed Expenses", 14, startY);
        startY += 10;
        autoTable(doc, {
          startY: startY,
          head: [['Date', 'Report', 'Employee', 'Notes', 'Amount']],
          body: monthlyData.expenses.map(item => [
              format(parseISO(expenseReports.find(r=>r.id === item.expenseReportId)!.reportDate), 'PP'),
              getReportName(item.expenseReportId),
              getEmployeeName(item.employeeId),
              item.notes || 'N/A',
              formatCurrency(item.amount)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [40, 40, 40] },
          didParseCell: (data) => { if (customFontBase64) { (data.cell.styles as any).font = "CustomFont"; } }
        });
    }

    
    doc.save(`monthly-expense-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
  };

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {selectedDate && (
          <div ref={pdfHeaderRef} style={{ width: '700px', background: 'white', color: 'black' }}>
            <ReportPdfHeader title="Monthly Expense Report" subtitle={format(selectedDate, 'MMMM yyyy')} logoSrc={logoSrc ?? ''} />
          </div>
        )}
      </div>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/expenses"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Monthly Expense Report</h1>
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
            <Button onClick={handleDownloadPdf} disabled={isLoading || monthlyData.expenses.length === 0}><FileDown className="mr-2"/>Download PDF</Button>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>
        ) : monthlyData.expenses.length > 0 ? (
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
                            <Bar dataKey="totalAmount" name="Total Expenses" fill="hsl(var(--primary))" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Expenses for {selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Report</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.expenses.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{format(parseISO(expenseReports.find(r=>r.id === item.expenseReportId)!.reportDate), 'PP')}</TableCell>
                          <TableCell>{getReportName(item.expenseReportId)}</TableCell>
                          <TableCell>{getEmployeeName(item.employeeId)}</TableCell>
                          <TableCell className="text-muted-foreground">{item.notes || 'N/A'}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="text-lg font-bold">Grand Total</TableCell>
                            <TableCell className="text-right text-lg font-bold text-primary">{formatCurrency(monthlyData.total)}</TableCell>
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
            <h3 className="mt-4 text-lg font-medium">No Expenses Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">There are no expenses recorded for {selectedDate ? format(selectedDate, 'MMMM yyyy') : 'the selected month'}.</p>
          </div>
        )}
      </div>
    </>
  );
}
