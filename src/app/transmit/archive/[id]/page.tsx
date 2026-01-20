
'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Truck, FileText, User, Warehouse, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransmitReportPdf } from '@/components/transmit/TransmitReportPdf';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import type { Transfer, ItemForTransfer, AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';


export default function ViewTransferPage() {
  const { id: transferId } = useParams();
  const { t, language } = useTranslation();
  const { transfers, transferItems, settings } = useAppContext();
  const { pdfSettings, appLogo } = settings;

  const pdfRef = useRef<HTMLDivElement>(null);
  
  const transfer = useMemo(() => transfers.find(t => t.id === transferId), [transfers, transferId]);
  const items = useMemo(() => transferItems.filter(i => i.transferId === transferId), [transferItems, transferId]);

  const isLoading = !transfer || !items;

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !transfer || !items) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    
    const canvas = await html2canvas(pdfRef.current, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: 'white'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    let finalImgWidth = pdfWidth;
    let finalImgHeight = pdfWidth / ratio;

    if (finalImgHeight > pdfHeight) {
      finalImgHeight = pdfHeight;
      finalImgWidth = finalImgHeight * ratio;
    }

    const x = (pdfWidth - finalImgWidth) / 2;

    doc.addImage(imgData, 'PNG', x, 0, finalImgWidth, finalImgHeight);
    doc.save(`${transfer.cargoName}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    {transfer && (
       <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={pdfRef} style={{ width: '700px' }}>
              <TransmitReportPdf
                title={`${transfer.destinationCity} Transmit`}
                items={items}
                logoSrc={appLogo}
                themeColor={pdfSettings.invoice?.themeColor || '#f97316'}
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
            <Button onClick={handleDownloadPdf} disabled={!transfer || !items}>
                <FileText className="mr-2"/> {t('download_pdf')}
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={!transfer || !items}>
                <Printer className="mr-2"/> {t('print')}
            </Button>
          </div>
      </header>

      {isLoading ? (
        <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      ) : transfer && items ? (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{transfer.cargoName}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <p className="flex gap-2 items-center"><Truck className="w-4 h-4 text-primary"/> <strong>{t('destination')}:</strong> {transfer.destinationCity}</p>
                    <p className="flex gap-2 items-center"><Calendar className="w-4 h-4 text-primary"/> <strong>{t('date')}:</strong> {format(parseISO(transfer.transferDate), 'PPP')}</p>
                    <p className="flex gap-2 items-center"><User className="w-4 h-4 text-primary"/> <strong>{t('driver')}:</strong> {transfer.driverName}</p>
                    <p className="flex gap-2 items-center"><Warehouse className="w-4 h-4 text-primary"/> <strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('transferred_items')} ({items.length})</CardTitle>
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
                                {items.map((item) => (
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
