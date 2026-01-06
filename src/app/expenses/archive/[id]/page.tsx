
'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, DollarSign, User, FileDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

export default function ViewExpenseReportPage() {
  const { t, language } = useTranslation();
  const { id: reportId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { expenseReports, setExpenseReports, expenses, setExpenses, employees } = useAppContext();

  const report = useMemo(() => expenseReports.find(r => r.id === reportId), [expenseReports, reportId]);
  const reportItems = useMemo(() => expenses.filter(i => i.expenseReportId === reportId), [expenses, reportId]);

  const isLoading = !report || !reportItems || !employees;

  const getEmployeeName = (employeeId: string, useKurdish: boolean = false) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const handleDeleteReport = () => {
    if (!reportId || !report) return;
    setExpenseReports(prev => prev.filter(r => r.id !== reportId));
    setExpenses(prev => prev.filter(e => e.expenseReportId !== reportId));
    toast({ title: t('report_deleted'), description: t('report_deleted_desc') });
    router.push('/expenses/archive');
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
        <h2 className="text-2xl font-bold mb-2">{t('report_not_found')}</h2>
        <p className="text-muted-foreground mb-6">{t('report_not_found_desc')}</p>
        <Button asChild>
          <Link href="/expenses/archive"><ArrowLeft className="mr-2"/>{t('back_to_expense_archive')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/expenses/archive"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl">{t('expense_report_details')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2"/>{t('delete_report')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('confirm_delete_expense_report', {reportName: report.reportName})}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteReport}>{t('delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{report.reportName}</CardTitle>
              <CardDescription className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/>{format(parseISO(report.reportDate), 'PPP')}</span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('items_in_report_count', {count: reportItems.length})}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('employee')}</TableHead>
                      <TableHead>{t('notes')}</TableHead>
                      <TableHead className="text-right">{t('amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="flex items-center gap-2" dir={language === 'ku' ? 'rtl' : 'ltr'}>
                          <User className="w-4 h-4 text-muted-foreground" />
                          {getEmployeeName(item.employeeId, language === 'ku')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.notes || t('na')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="text-lg font-bold">{t('total')}</TableCell>
                      <TableCell className="text-right text-lg font-bold text-primary">{formatCurrency(report.totalAmount)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
    
