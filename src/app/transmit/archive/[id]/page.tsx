

'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Truck, User, Warehouse, Printer, Edit, Trash2, Save, X, Search, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransmitReportPdf } from '@/components/transmit/TransmitReportPdf';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import type { Transfer, ItemForTransfer, BranchColors } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export default function ViewTransferPage() {
  const { id: transferId } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { transfers, setTransfers, transferItems, setTransferItems, settings, isLoading: isAppLoading } = useAppContext();

  const transfer = useMemo(() => transfers?.find(t => t.id === transferId), [transfers, transferId]);
  const items = useMemo(() => transferItems?.filter(i => i.transferId === transferId), [transferItems, transferId]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableTransfer, setEditableTransfer] = useState<Transfer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchQuery.trim()) return items;
    const queryLower = searchQuery.toLowerCase();
    return items.filter(item =>
      item.model.toLowerCase().includes(queryLower) ||
      (item.invoiceNo && item.invoiceNo.toLowerCase().includes(queryLower))
    );
  }, [items, searchQuery]);

  useEffect(() => {
    if (transfer) {
        setEditableTransfer(JSON.parse(JSON.stringify(transfer)));
    }
  }, [transfer]);
  
  const totalYearlyInvoices = useMemo(() => {
      if (!transfer || !transfers) return 0;
      const currentYear = new Date(transfer.transferDate).getFullYear();
      return transfers.filter(t => t.transferDate && new Date(t.transferDate).getFullYear() === currentYear).length;
  }, [transfers, transfer]);
  
  const handleSave = () => {
    if (!editableTransfer || !transfers) return;
    setTransfers(prev => prev.map(t => t.id === editableTransfer.id ? editableTransfer : t));
    toast({ title: "Transfer Updated", description: "The transfer details have been saved." });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!transfer || !transferItems || !transfers) return;
    // Disassociate items
    setTransferItems(prev => prev.map(item =>
        item.transferId === transfer.id ? { ...item, transferId: null } : item
    ));
    // Delete transfer
    setTransfers(prev => prev.filter(t => t.id !== transfer.id));
    toast({ title: "Transfer Deleted", description: "The items have been returned to the staging list." });
    router.push('/transmit/archive');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !transfer) return;
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${transfer.cargoName}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!transfer || !items) return;
    const dataToExport = items.map(item => ({
      'Model': item.model,
      'Quantity': item.quantity,
      'Invoice No': item.invoiceNo || 'N/A',
      'Storage': item.storage || 'N/A',
      'Notes': item.notes || 'N/A',
      'Request Date': item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
    XLSX.writeFile(workbook, `${transfer.cargoName}.xlsx`);
  };

  if (isAppLoading) {
    return (
        <div className="p-4 md:p-8 space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  const { pdfSettings, appLogo } = settings;
  
  const PageContent = () => (
    <div className="space-y-8">
            <Card>
                <CardHeader>
                    {isEditing ? (
                        <Input 
                            value={editableTransfer?.cargoName || ''}
                            onChange={(e) => setEditableTransfer(prev => prev ? {...prev, cargoName: e.target.value} : null)}
                            className="text-2xl h-auto p-0 border-0 shadow-none focus-visible:ring-0 font-bold"
                        />
                    ) : (
                        <CardTitle>{transfer.cargoName}</CardTitle>
                    )}
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1"><Label>{t('destination')}</Label><p className="flex gap-2 items-center"><Truck className="w-4 h-4 text-primary"/> {transfer.destinationCity}</p></div>
                    <div className="space-y-1">
                        <Label>{t('date')}</Label>
                        {isEditing ? (
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editableTransfer?.transferDate && "text-muted-foreground")}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {editableTransfer?.transferDate ? format(parseISO(editableTransfer.transferDate), 'PPP') : <span>{t('pick_a_date')}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                    mode="single"
                                    selected={editableTransfer?.transferDate ? parseISO(editableTransfer.transferDate) : new Date()}
                                    onSelect={(date) => {
                                        if (date) setEditableTransfer(prev => prev ? {...prev, transferDate: date.toISOString()} : null)
                                    }}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <p className="flex gap-2 items-center"><Calendar className="w-4 h-4 text-primary"/> {format(parseISO(transfer.transferDate), 'PPP')}</p>
                        )}
                    </div>
                     <div className="space-y-1">
                        <Label>{t('driver')}</Label>
                        {isEditing ? (
                             <Input value={editableTransfer?.driverName || ''} onChange={(e) => setEditableTransfer(prev => prev ? {...prev, driverName: e.target.value} : null)} />
                        ) : (
                            <p className="flex gap-2 items-center"><User className="w-4 h-4 text-primary"/> {transfer.driverName}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>{t('manager')}</Label>
                         {isEditing ? (
                             <Input value={editableTransfer?.warehouseManagerName || ''} onChange={(e) => setEditableTransfer(prev => prev ? {...prev, warehouseManagerName: e.target.value} : null)} />
                        ) : (
                            <p className="flex gap-2 items-center"><Warehouse className="w-4 h-4 text-primary"/> {transfer.warehouseManagerName}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('transferred_items')} ({filteredItems.length})</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('search_by_invoice_or_model')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('model')}</TableHead>
                                    <TableHead>{t('quantity')}</TableHead>
                                    <TableHead>{t('invoice_no')}</TableHead>
                                    <TableHead>{t('storage')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead>{t('notes')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.model}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.invoiceNo || 'N/A'}</TableCell>
                                        <TableCell>{item.storage || 'N/A'}</TableCell>
                                        <TableCell>{item.status || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.notes || t('na')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
  );

  if (!transfer || !items) {
    return (
      <div className="text-center py-16">
          <h2 className="text-2xl font-bold">{t('transfer_not_found')}</h2>
          <p className="text-muted-foreground">{t('transfer_not_found_desc')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden print:block">
        <div ref={pdfRef}>
            <TransmitReportPdf
                transfer={transfer}
                items={items || []}
                settings={{...pdfSettings.invoice, logo: pdfSettings.invoice.logo ?? appLogo}}
                invoiceNumber={transfer.invoiceNumber}
                totalYearlyInvoices={totalYearlyInvoices}
            />
        </div>
      </div>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:hidden">
        <header className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                  <Link href="/transmit/archive"><ArrowLeft /></Link>
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold">{t('transfer_details')}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                  <>
                      <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {t('save_changes')}</Button>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4" /> {t('cancel')}</Button>
                  </>
              ) : (
                  <>
                      <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={handleDownloadPdf}><FileText className="h-4 w-4"/></Button>
                      <Button variant="outline" size="icon" onClick={handleDownloadExcel}><FileSpreadsheet className="h-4 w-4"/></Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                              <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                              <AlertDialogDescription>{t('confirm_delete_transfer')}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete}>{t('delete')}</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </>
              )}
            </div>
        </header>

        <PageContent />
      </div>
    </>
  );
}

    
