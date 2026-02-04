
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Printer, DollarSign, Clock, Gift, Banknote, FileText, Settings, FileDown } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import * as XLSX from 'xlsx';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

function AshleyExpensesDashboard() {
  const { t } = useTranslation();
  const { expenses, overtime, bonuses, withdrawals, settings } = useAppContext();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const menuItems = [
    { title: t('expenses'), icon: DollarSign, href: '/expenses', color: 'bg-blue-500' },
    { title: t('overtime'), icon: Clock, href: '/overtime', color: 'bg-orange-500' },
    { title: t('bonuses'), icon: Gift, href: '/bonuses', color: 'bg-green-500' },
    { title: t('cash_withdrawals'), icon: Banknote, href: '/cash-withdrawal', color: 'bg-rose-500' },
    { title: t('monthly_reports'), icon: FileText, href: '/monthly-report', color: 'bg-indigo-500' },
    { title: t('settings'), icon: Settings, href: '/ashley-expenses-settings', color: 'bg-gray-500' },
  ];

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

  const handleExportExcel = () => {
    const dataToExport = chartData.map(item => ({
      Category: item.name,
      'Total Amount': item.total,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Overview");
    XLSX.writeFile(workbook, `Ashley_Expenses_Overview_${format(selectedDate || new Date(), 'yyyy-MM')}.xlsx`);
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
                      {chartData.map((item, index) => {
                          const percentage = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
                          return (
                              <TableRow key={item.name} className="odd:bg-table-row-secondary even:bg-table-row-primary">
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>{formatCurrency(item.total)}</TableCell>
                                  <TableCell>
                                      <div className="flex items-center gap-2">
                                          <Progress value={percentage} style={{ backgroundColor: item.fill }} />
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
      <div className="hidden print:block">
        <ReportWrapper>
          <DashboardContent />
        </ReportWrapper>
      </div>

      <div className="h-[calc(100vh-80px)] flex flex-col print:hidden">
       <header className="bg-card border-b p-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl">{t('ashley_employees_management')}</h1>
          </div>
            <div className='flex items-center gap-2'>
                <Button onClick={handlePrint} variant="outline" size="icon"><Printer className="h-4 w-4"/></Button>
                <Button onClick={handleExportExcel} variant="outline" size="icon"><FileDown className="h-4 w-4"/></Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
                  </PopoverContent>
                </Popover>
            </div>
        </div>
      </header>
      <main className='w-full p-4 md:p-8 flex-1 overflow-y-auto space-y-8'>
        <DashboardContent />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <DashboardCard
              key={item.title}
              title={item.title}
              icon={item.icon}
              href={item.href}
              color={item.color}
            />
          ))}
        </div>
      </main>
    </div>
    </>
  );
}

export default withAuth(AshleyExpensesDashboard);
