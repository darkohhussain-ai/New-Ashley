
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Printer, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

function AshleyExpensesDashboard() {
  const { t, language } = useTranslation();
  const { expenses, overtime, bonuses, withdrawals, settings } = useAppContext();
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const monthlyTotals = useMemo(() => {
    if (!selectedDate) return { expenses: 0, overtime: 0, bonuses: 0, withdrawals: 0 };
    
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filterAndSum = (data: any[], amountField: string) => {
        return data.filter(d => d.date && isWithinInterval(parseISO(d.date), { start, end }))
                   .reduce((sum, item) => sum + (item[amountField] || 0), 0);
    }
    
    return {
        expenses: filterAndSum(expenses, 'amount'),
        overtime: filterAndSum(overtime, 'totalAmount'),
        bonuses: filterAndSum(bonuses, 'totalAmount'),
        withdrawals: filterAndSum(withdrawals, 'amount'),
    }
  }, [selectedDate, expenses, overtime, bonuses, withdrawals]);
  
  const chartData = [
      { name: t('expenses'), total: monthlyTotals.expenses, fill: settings.pdfSettings.report.reportColors?.expense || 'hsl(var(--chart-1))' },
      { name: t('overtime'), total: monthlyTotals.overtime, fill: settings.pdfSettings.report.reportColors?.overtime || 'hsl(var(--chart-2))' },
      { name: t('bonuses'), total: monthlyTotals.bonuses, fill: settings.pdfSettings.report.reportColors?.bonus || 'hsl(var(--chart-3))' },
      { name: t('cash_withdrawals'), total: monthlyTotals.withdrawals, fill: settings.pdfSettings.report.reportColors?.withdrawal || 'hsl(var(--chart-4))' },
  ];
  
  const grandTotal = chartData.reduce((sum, item) => sum + item.total, 0);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!printRef.current || !selectedDate) return;
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      onclone: (document) => {
        if (settings?.customFont && language === 'ku') {
            const style = document.createElement('style');
            style.innerHTML = `@font-face { font-family: 'CustomPdfFont'; src: url(${settings.customFont}); } body, table, div, p, h1, h2, h3 { font-family: 'CustomPdfFont' !important; }`;
            document.head.appendChild(style);
        }
      }
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'px', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfWidth * (canvas.height / canvas.width));
    pdf.save(`ashley-expenses-summary-${format(selectedDate, 'yyyy-MM')}.pdf`);
  };

  const DashboardContent = () => (
    <Card>
      <CardHeader>
          <CardTitle>{t('monthly_overview')}</CardTitle>
          <CardDescription>{t('monthly_overview_desc', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardDescription>
      </CardHeader>
      <CardContent>
          {grandTotal > 0 ? (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead className="w-[40%]">Visualization</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {chartData.map(item => {
                          const percentage = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
                          return (
                              <TableRow key={item.name}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>{formatCurrency(item.total)}</TableCell>
                                  <TableCell>
                                      <div className="flex items-center gap-2">
                                          <Progress value={percentage} style={{ '--progress-indicator-color': item.fill } as React.CSSProperties} />
                                          <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                                      </div>
                                  </TableCell>
                              </TableRow>
                          );
                      })}
                  </TableBody>
              </Table>
          ) : (
              <p className="text-center text-muted-foreground py-8">{t('no_records_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : t('the_selected_month')})}</p>
          )}
      </CardContent>
   </Card>
  );

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={printRef} style={{ width: '700px' }}>
          {selectedDate && (
            <ReportWrapper
              title={t('monthly_overview')}
              date={format(selectedDate, 'MMMM yyyy')}
              logoSrc={settings.appLogo}
              themeColor={settings.pdfSettings.report.reportColors?.general}
            >
              <DashboardContent />
            </ReportWrapper>
          )}
        </div>
      </div>
      <div className="hidden print:block">
        {selectedDate && (
          <ReportWrapper
            title={t('monthly_overview')}
            date={format(selectedDate, 'MMMM yyyy')}
            logoSrc={settings.appLogo}
            themeColor={settings.pdfSettings.report.reportColors?.general}
          >
            <DashboardContent />
          </ReportWrapper>
        )}
      </div>

      <div className="h-[calc(100vh-80px)] flex flex-col">
       <header className="bg-card border-b p-4 print:hidden">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl">{t('ashley_employees_management')}</h1>
          </div>
            <div className='flex items-center gap-2'>
                <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4"/> {t('print')}</Button>
                <Button onClick={handleDownloadPdf} variant="outline"><FileDown className="mr-2 h-4 w-4"/> {t('download_pdf')}</Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
                  </PopoverContent>
                </Popover>
            </div>
        </div>
      </header>
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto'>
        <DashboardContent />
      </main>
    </div>
    </>
  );
}

export default withAuth(AshleyExpensesDashboard);
