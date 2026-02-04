'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Printer, Loader2, BarChart, FileDown } from 'lucide-react';
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
import { useAuth } from '@/hooks/use-auth';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

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
  const { user, hasPermission } = useAuth();
  const isReadOnly = !hasPermission('page:admin');
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);
  
  const isLoading = !overtime || !employees || !selectedDate;

  const getEmployeeName = (employeeId: string, useKurdish: boolean = false) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    if (isReadOnly && user?.username !== `${employee.name.split(' ')[0]}${employee.employeeId || ''}`) return '***';
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const monthlyData = useMemo(() => {
    if (isLoading || !overtime || !employees || !selectedDate) return { records: [], summary: [], totalAmount: 0, totalHours: 0 };

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filteredRecords = overtime.filter(r => isWithinInterval(parseISO(r.date), { start, end }));

    const employeeTotals = new Map<string, { totalAmount: number; totalHours: number }>();
    filteredRecords.forEach(record => {
      const current = employeeTotals.get(record.employeeId) || { totalAmount: 0, totalHours: 0 };
      current.totalAmount += record.totalAmount;
      current.totalHours += record.hours;
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
  }, [isLoading, overtime, employees, selectedDate, getEmployeeName, language, t, isReadOnly, user]);


  const handlePrint = () => {
    window.print();
  };
  
  const handleExportExcel = () => {
    if (isLoading || monthlyData.records.length === 0 || !selectedDate) {
      toast({
        variant: "destructive",
        title: "No data to export"
      });
      return;
    }
    const dataToExport = monthlyData.summary.map(item => ({
      [t('employee')]: item.employeeName,
      [t('total_hours')]: item.totalHours.toFixed(2),
      [t('total_amount')]: isReadOnly ? '***' : item.totalAmount,
    }));
    const totalsRow = {
      [t('employee')]: t('grand_total'),
      [t('total_hours')]: monthlyData.totalHours.toFixed(2),
      [t('total_amount')]: isReadOnly ? '***' : monthlyData.totalAmount,
    };
    dataToExport.push(totalsRow);

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Overtime Report');
    XLSX.writeFile(workbook, `Monthly_Overtime_Report_${format(selectedDate, 'yyyy-MM')}.xlsx`);
  };
  
  if(isLoading) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const PageContent = () => (
      <>
        {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-64 w-full" /></div>
            ) : monthlyData.records.length > 0 ? (
            <div className="space-y-8">
                <Card>
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
                                            <TableCell className="text-right">{isReadOnly ? '***' : formatCurrency(item.totalAmount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="text-lg">{t('grand_total')}</TableCell>
                                        <TableCell className="text-right text-lg">{monthlyData.totalHours.toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-lg text-primary">{isReadOnly ? '***' : formatCurrency(monthlyData.totalAmount)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg print:hidden">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">{t('no_overtime_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_overtime_found_for_month', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : t('the_selected_month')})}</p>
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
              <Link href="/overtime"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl">{t('monthly_overtime_report')}</h1>
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
            <Button variant="outline" size="icon" onClick={handlePrint} disabled={isLoading || monthlyData.records.length === 0}><Printer className="h-4 w-4"/></Button>
            <Button variant="outline" size="icon" onClick={handleExportExcel} disabled={isLoading || monthlyData.records.length === 0}><FileDown className="h-4 w-4"/></Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8">
          <PageContent />
        </main>
      </div>
    </>
  );
}
