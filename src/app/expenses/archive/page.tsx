
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, DollarSign, Eye, Plus, Printer, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import * as XLSX from 'xlsx';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

export default function ExpenseArchivePage() {
  const { t } = useTranslation();
  const { expenseReports } = useAppContext();
  const isLoading = !expenseReports;

  const sortedReports = useMemo(() => {
    if (!expenseReports) return [];
    return [...expenseReports].sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
  }, [expenseReports]);
  
  const handlePrint = () => {
    window.print();
  }

  const handleExportExcel = () => {
    const dataToExport = sortedReports.map(report => ({
      [t('report_name')]: report.reportName,
      [t('report_date')]: format(parseISO(report.reportDate), 'yyyy-MM-dd'),
      [t('total_amount')]: report.totalAmount,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Reports");
    XLSX.writeFile(workbook, "Expense_Reports_Archive.xlsx");
  };
  
  const PageContent = () => (
      <>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-3"><Skeleton className="h-4 w-full" /></CardContent>
                <CardFooter><Skeleton className="h-8 w-24" /></CardFooter>
              </Card>
            ))}
          </div>
        ) : sortedReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedReports.map(report => (
              <Card key={report.id} className="hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg leading-tight flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary"/>
                    {format(parseISO(report.reportDate), 'PPP')}
                  </CardTitle>
                  <CardDescription>{report.reportName}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="flex items-center gap-2 text-2xl text-primary">
                    <DollarSign className="w-6 h-6" />
                    {formatCurrency(report.totalAmount)}
                  </p>
                </CardContent>
                <CardFooter className="print:hidden">
                  <Button asChild className="w-full">
                    <Link href={`/expenses/archive/${report.id}`}><Eye className="mr-2"/>{t('view_edit_details')}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg">{t('no_expense_reports_found')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_expense_reports_found_desc')}</p>
            <Button asChild className="mt-4"><Link href="/expenses/add">{t('create_report')}</Link></Button>
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
      <div className="h-screen bg-background text-foreground flex flex-col print:hidden">
        <header className="flex items-center justify-between gap-4 p-4 md:p-8 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/expenses"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl">{t('expense_report_archive')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" size="icon"><Printer className="h-4 w-4"/></Button>
            <Button onClick={handleExportExcel} variant="outline" size="icon"><FileDown className="h-4 w-4"/></Button>
            <Button asChild>
              <Link href="/expenses/add"><Plus className="mr-2" /> {t('create_report')}</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <PageContent />
        </main>
      </div>
    </>
  );
}
