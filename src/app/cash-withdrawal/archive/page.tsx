
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Banknote, Eye, Loader2, Plus, Printer, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import type { CashWithdrawal } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import * as XLSX from 'xlsx';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function WithdrawalArchivePage() {
  const { t } = useTranslation();
  const { withdrawals } = useAppContext();
  const isLoading = !withdrawals;

  const groupedByDay = useMemo(() => {
    if (!withdrawals) return [];
    
    const groups: Record<string, { records: CashWithdrawal[], totalAmount: number }> = {};
    
    withdrawals.forEach(record => {
      const day = format(parseISO(record.date), 'yyyy-MM-dd');
      if (!groups[day]) {
        groups[day] = { records: [], totalAmount: 0 };
      }
      groups[day].records.push(record);
      groups[day].totalAmount += record.amount;
    });

    return Object.entries(groups)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [withdrawals]);
  
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const dataToExport = groupedByDay.map(item => ({
        [t('date')]: item.date,
        [t('total_withdrawn')]: item.totalAmount,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Withdrawal Archive");
    XLSX.writeFile(workbook, "Withdrawal_Archive.xlsx");
  };

  const PageContent = () => (
      <>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        ) : groupedByDay.length > 0 ? (
          <Card>
            <CardHeader>
                <CardTitle>{t('daily_withdrawal_summary')}</CardTitle>
                <CardDescription>{t('daily_withdrawal_summary_desc')}</CardDescription>
            </CardHeader>
             <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead className="text-center">{t('total_withdrawn')}</TableHead>
                            <TableHead className="text-right print:hidden"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedByDay.map(({ date, totalAmount }) => (
                            <TableRow key={date}>
                                <TableCell>{format(parseISO(date), 'PPP')}</TableCell>
                                <TableCell className="text-center">{formatCurrency(totalAmount)}</TableCell>
                                <TableCell className="text-right print:hidden">
                                    <Button asChild size="sm">
                                        <Link href={`/cash-withdrawal/add?date=${date}`}><Eye className="mr-2"/>{t('view_details')}</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg">{t('no_withdrawal_records')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_withdrawal_records_desc')}</p>
             <Button asChild className="mt-4"><Link href="/cash-withdrawal/add">{t('add_withdrawal')}</Link></Button>
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
        <header className="p-4 md:p-8 flex items-center justify-between gap-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/cash-withdrawal"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl">{t('withdrawal_archive')}</h1>
          </div>
           <div className="flex items-center gap-2">
               <Button onClick={handlePrint} variant="outline" size="icon"><Printer className="h-4 w-4"/></Button>
               <Button onClick={handleExportExcel} variant="outline" size="icon"><FileDown className="h-4 w-4"/></Button>
              <Button asChild>
                  <Link href="/cash-withdrawal/add"><Plus className="mr-2"/> {t('add_withdrawal')}</Link>
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
