
'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, DollarSign, User, FileDown, Trash2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseReportPdf } from '@/components/expenses/ExpenseReportPdf';
import type { Expense } from '@/lib/types';


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

export default function ViewExpenseReportPage() {
  const { t, language } = useTranslation();
  const { id: reportId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { expenseReports, setExpenseReports, expenses, setExpenses, employees, settings } = useAppContext();
  
  const reportPdfRef = useRef<HTMLDivElement>(null);

  const report = useMemo(() => expenseReports.find(r => r.id === reportId), [expenseReports, reportId]);
  const reportItems = useMemo(() => expenses.filter(i => i.expenseReportId === reportId), [expenses, reportId]);

  const isLoading = !report || !reportItems || !employees;

  const getEmployeeName = (employeeId: string, useKurdish: boolean = false) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const groupedExpenses = useMemo(() => {
    if (!reportItems || !employees) return [];
    
    const groups: Record<string, { employeeName: string; expenses: Expense[]; total: number }> = {};
    
    reportItems.forEach(exp => {
      if (!groups[exp.employeeId]) {
        groups[exp.employeeId] = {
          employeeName: getEmployeeName(exp.employeeId, language === 'ku'),
          expenses: [],
          total: 0
        };
      }
      groups[exp.employeeId].expenses.push(exp);
      groups[exp.employeeId].total += exp.amount;
    });

    return Object.values(groups).sort((a,b) => a.employeeName.localeCompare(b.employeeName));
  }, [reportItems, employees, language, getEmployeeName]);

  const handleDeleteReport = () => {
    if (!reportId || !report) return;
    setExpenseReports(prev => prev.filter(r => r.id !== reportId));
    setExpenses(prev => prev.filter(e => e.expenseReportId !== reportId));
    toast({ title: t('report_deleted'), description: t('report_deleted_desc') });
    router.push('/expenses/archive');
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownloadPdf = () => {
    if (!report || !settings) return;
    const doc = new jsPDF();
    const { pdfSettings, customFont } = settings;
    const useKurdishFont = language === 'ku' && customFont;
    const themeColor = pdfSettings.report.reportColors?.expense || '#3b82f6';
    const fontName = "CustomFont";

    if (useKurdishFont) {
        try {
            const fontBase64 = customFont.split(',')[1];
            if (fontBase64) {
                doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
                doc.addFont(`${fontName}.ttf`, fontName, 'normal');
                doc.setFont(fontName);
            }
        } catch (e) {
            console.error("Error adding custom font to PDF:", e);
        }
    }
    
    autoTable(doc, {
        body: [
            [{ content: report.reportName, styles: { halign: 'center', fontSize: 18, textColor: themeColor, font: useKurdishFont ? fontName : 'helvetica' } }],
            [{ content: format(parseISO(report.reportDate), 'PPP'), styles: { halign: 'center', fontSize: 11, textColor: 100, font: useKurdishFont ? fontName : 'helvetica' } }],
        ],
        theme: 'plain',
        startY: 20,
    });

    autoTable(doc, {
        head: [[t('employee'), t('expense_type'), t('notes'), t('amount')]],
        body: reportItems.map(item => [
            getEmployeeName(item.employeeId, useKurdishFont),
            `${t(item.expenseType.toLowerCase().replace(/[\s()]/g, '_'))}${item.expenseSubType ? ` (${t(item.expenseSubType.toLowerCase().replace(/\s/g, '_'))})` : ''}`,
            item.notes || '',
            formatCurrency(item.amount),
        ]),
        foot: [[
            { content: t('grand_total'), colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(report.totalAmount), styles: { halign: 'right', fontStyle: 'bold' } },
        ]],
        startY: (doc as any).lastAutoTable.finalY + 10,
        theme: pdfSettings.report.tableTheme || 'striped',
        styles: { font: useKurdishFont ? fontName : 'helvetica', valign: 'middle', cellPadding: 3, fontSize: 8 },
        headStyles: { fillColor: themeColor, textColor: 255, fontStyle: 'bold', halign: 'center', font: useKurdishFont ? fontName : 'helvetica' },
        footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
        columnStyles: {
            0: { halign: useKurdishFont ? 'right' : 'left' },
            1: { halign: useKurdishFont ? 'right' : 'left' },
            2: { halign: useKurdishFont ? 'right' : 'left' },
            3: { halign: 'right' },
        },
    });

    doc.save(`${report.reportName}.pdf`);
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
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:p-0">
        <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/expenses/archive"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl">{t('expense_report_details')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> {t('print')}</Button>
            <Button onClick={handleDownloadPdf}><FileDown className="mr-2 h-4 w-4" /> {t('download_pdf')}</Button>
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
              <div className="divide-y">
                {groupedExpenses.length > 0 ? groupedExpenses.map(group => (
                  <div key={group.employeeName} className="py-3 first:pt-0 last:pb-0">
                    {group.expenses.map(item => (
                      <div key={item.id} className="flex justify-between items-start gap-4 py-2">
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-2" dir={language === 'ku' ? 'rtl' : 'ltr'}>
                            <User className="h-4 w-4 text-muted-foreground" /> 
                            {getEmployeeName(item.employeeId, language === 'ku')}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 pl-6">{t(item.expenseType.toLowerCase().replace(/[\s()]/g, '_'))}{item.expenseSubType ? ` (${t(item.expenseSubType.toLowerCase().replace(/\s/g, '_'))})` : ''}</p>
                          {item.notes && <p className="text-sm mt-1 pl-6">{item.notes}</p>}
                        </div>
                        <p className="font-semibold text-primary">{formatCurrency(item.amount)}</p>
                      </div>
                    ))}
                    {group.expenses.length > 1 && (
                      <div className="flex justify-end items-center mt-2 pt-2 border-t border-dashed">
                        <p className="text-sm font-semibold text-muted-foreground">
                          {group.employeeName} {t('total')}: {formatCurrency(group.total)}
                        </p>
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-center py-8 text-muted-foreground">{t('no_expense_items_found')}</p>
                )}
              </div>
            </CardContent>
            {report.totalAmount > 0 && (
            <CardFooter className="bg-muted/80 py-4 justify-end">
                <div className="text-lg font-bold flex items-center gap-4">
                    <span>{t('grand_total')}:</span>
                    <span className="text-primary">{formatCurrency(report.totalAmount)}</span>
                </div>
            </CardFooter>
            )}
          </Card>
        </div>
      </div>
      <div className="hidden print:block">
        {report && employees && settings.pdfSettings && (
          <ExpenseReportPdf
            report={report}
            items={reportItems}
            employees={employees}
            settings={settings.pdfSettings}
          />
        )}
      </div>
    </>
  );
}
    
