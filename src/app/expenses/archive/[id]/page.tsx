'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, DollarSign, User, FileDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAppContext } from '@/context/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

export default function ViewExpenseReportPage() {
  const { t } = useTranslation();
  const { id: reportId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { expenseReports, setExpenseReports, expenses, setExpenses, employees } = useAppContext();

  const [pdfSettings] = useLocalStorage<AllPdfSettings>('pdf-settings', { report: {}, invoice: {} });
  const pdfHeaderRef = useRef<HTMLDivElement>(null);

  const report = useMemo(() => expenseReports.find(r => r.id === reportId), [expenseReports, reportId]);
  const reportItems = useMemo(() => expenses.filter(i => i.expenseReportId === reportId), [expenses, reportId]);

  const isLoading = !report || !reportItems || !employees;

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || 'Unknown Employee';
  };

  const handleDeleteReport = () => {
    if (!reportId || !report) return;
    setExpenseReports(prev => prev.filter(r => r.id !== reportId));
    setExpenses(prev => prev.filter(e => e.expenseReportId !== reportId));
    toast({ title: t('report_deleted'), description: t('report_deleted_desc') });
    router.push('/expenses/archive');
  };

  const handleDownloadPdf = async () => {
    if (!pdfHeaderRef.current || !report || !reportItems) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const settings = pdfSettings.report || {};
    
    if (settings.customFont) {
      const fontName = "CustomFont";
      const fontStyle = "normal";
      const fontBase64 = settings.customFont.split(',')[1];
      doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
      doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
      doc.setFont(fontName);
    }
    
    const canvas = await html2canvas(pdfHeaderRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth;
    const finalImgHeight = finalImgWidth / ratio;
    
    doc.addImage(imgData, 'PNG', 0, 0, finalImgWidth, finalImgHeight);
    
    autoTable(doc, {
      startY: finalImgHeight + 10,
      head: [[t('employee'), t('notes'), t('amount')]],
      body: reportItems.map(item => [getEmployeeName(item.employeeId), item.notes || 'N/A', formatCurrency(item.amount)]),
      foot: [[t('total'), '', formatCurrency(report.totalAmount)]],
      theme: 'grid',
      headStyles: { fillColor: settings.reportColors?.expense || settings.themeColor || '#22c55e' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      didParseCell: (data) => {
        if (settings.customFont) { data.cell.styles.font = "CustomFont"; }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 40;
    const pageHeight = doc.internal.pageSize.height;
    if (finalY > pageHeight - 30) {
        doc.addPage();
    }
    const signatureY = finalY > pageHeight - 50 ? 40 : finalY;
    doc.setFontSize(10);
    doc.text("...................................", doc.internal.pageSize.width - 120, signatureY, { align: 'center' });
    doc.text("Warehouse Manager Signature", doc.internal.pageSize.width - 120, signatureY + 10, { align: 'center' });


    if (settings.footerText) {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(settings.footerText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
    }
    
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
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={pdfHeaderRef} style={{ width: '700px', background: 'white', color: 'black' }}>
          <ReportPdfHeader 
            title={report.reportName} 
            subtitle={`${t('report_date')}: ${format(parseISO(report.reportDate), 'PPP')}`} 
            logoSrc={pdfSettings.report?.logo ?? null} 
            themeColor={pdfSettings.report?.reportColors?.expense ?? pdfSettings.report?.themeColor}
            headerText={pdfSettings.report?.headerText}
          />
        </div>
      </div>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/expenses/archive"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">{t('expense_report_details')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadPdf} variant="outline"><FileDown className="mr-2"/>{t('download_pdf')}</Button>
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
                        <TableCell className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {getEmployeeName(item.employeeId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.notes || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
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
    
