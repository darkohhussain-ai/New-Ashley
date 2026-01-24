
'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Truck, FileText, User, Warehouse, Printer, Edit, Trash2, Save, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransmitReportPdf } from '@/components/transmit/TransmitReportPdf';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import type { Transfer, ItemForTransfer } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ViewTransferPage() {
  const { id: transferId } = useParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { transfers, setTransfers, transferItems, setTransferItems, settings, isLoading: isAppLoading } = useAppContext();

  const pdfRef = useRef<HTMLDivElement>(null);
  
  const transfer = useMemo(() => transfers?.find(t => t.id === transferId), [transfers, transferId]);
  const items = useMemo(() => transferItems?.filter(i => i.transferId === transferId), [transferItems, transferId]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableTransfer, setEditableTransfer] = useState<Transfer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchQuery.trim()) {
      return items;
    }
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

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !transfer || !items || !settings) return;
    
    const { pdfSettings, customFont } = settings;
    const pdfContentEl = pdfRef.current;
    const scale = pdfSettings.invoice?.scale ?? 2;

    const canvas = await html2canvas(pdfContentEl, { 
      scale,
      useCORS: true, 
      backgroundColor: 'white',
      onclone: (document) => {
        if (customFont && language === 'ku') {
            const style = document.createElement('style');
            style.innerHTML = `@font-face { font-family: 'CustomAppFont'; src: url(${customFont}); } body, table, div, p, h1, h2, h3 { font-family: 'CustomAppFont' !important; }`;
            document.head.appendChild(style);
        }
      }
    });

    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = imgWidth / pdfWidth;
    const scaledImgHeight = imgHeight / ratio;

    let position = 0;
    let heightLeft = scaledImgHeight;

    pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, scaledImgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, scaledImgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${transfer.cargoName}.pdf`);
  };

  const handlePrint = () => {
    window.print();
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

  return (
    <>
    {transfer && (
       <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
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
    )}
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:p-0">
      <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
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
                    <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> {t('edit')}</Button>
                    <Button onClick={handleDownloadPdf} disabled={!transfer || !items}>
                        <FileText className="mr-2"/> {t('download_pdf')}
                    </Button>
                    <Button variant="outline" onClick={handlePrint} disabled={!transfer || !items}>
                        <Printer className="mr-2"/> {t('print')}
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> {t('delete')}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                            <AlertDialogDescription>This will delete the transfer slip and return all its items to the staging list. This action cannot be undone.</AlertDialogDescription>
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

      {transfer && items ? (
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
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>{t('transferred_items')} ({filteredItems.length})</CardTitle>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('search_by_model_or_invoice')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
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
                                        <TableCell className="text-muted-foreground">{item.notes || t('na')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      ) : (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold">{t('transfer_not_found')}</h2>
            <p className="text-muted-foreground">{t('transfer_not_found_desc')}</p>
        </div>
      )}
    </div>
    </>
  );
}
