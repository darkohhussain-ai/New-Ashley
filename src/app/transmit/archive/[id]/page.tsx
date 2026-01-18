
'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Truck, FileText, User, Warehouse, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransferPdfCard } from '@/components/transmit/transfer-pdf-card';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import type { Transfer, ItemForTransfer, AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';


export default function ViewTransferPage() {
  const { id: transferId } = useParams();
  const { t, language } = useTranslation();
  const { transfers, transferItems, settings } = useAppContext();
  const { pdfSettings, customFont } = settings;

  const pdfCardRef = useRef<HTMLDivElement>(null);
  
  const transfer = useMemo(() => transfers.find(t => t.id === transferId), [transfers, transferId]);
  const items = useMemo(() => transferItems.filter(i => i.transferId === transferId), [transferItems, transferId]);

  const isLoading = !transfer || !items;

  const handleDownloadPdf = async () => {
    if (!pdfCardRef.current || !transfer || !items) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pdfGenSettings = pdfSettings.invoice || {};
    const useKurdish = language === 'ku';

    if (customFont && useKurdish) {
        const fontName = "CustomFont";
        const fontStyle = "normal";
        try {
            const fontBase64 = customFont.split(',')[1];
            doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
            doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
            doc.setFont(fontName);
        } catch(e) {
            console.error("Could not add custom font to PDF", e);
        }
    }
    
    const canvas = await html2canvas(pdfCardRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth - 28;
    const finalImgHeight = finalImgWidth / ratio;
    
    doc.addImage(imgData, 'PNG', 14, 14, finalImgWidth, finalImgHeight);
    
    const head = [t('model'), t('quantity'), t('notes')];
    const body = items.map(item => [item.model, item.quantity, item.notes || '']);

    autoTable(doc, {
      startY: finalImgHeight + 30,
      head: [head],
      body: body,
      theme: 'grid',
      styles: { font: (customFont && useKurdish) ? 'CustomFont' : 'helvetica', halign: useKurdish ? 'right' : 'left' },
      headStyles: { fillColor: pdfGenSettings.themeColor || '#3b82f6', textColor: 255, fontStyle: 'bold' },
      didParseCell: (data) => {
        if (useKurdish && customFont) {
          data.cell.styles.font = "CustomFont";
          data.cell.styles.halign = 'right';
        }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(10);
    doc.text(`${t('driver')}: ${transfer.driverName}`, useKurdish ? doc.internal.pageSize.width - 14 : 14, finalY, { align: useKurdish ? 'right' : 'left' });
    doc.text(`${t('warehouse_manager')}: ${transfer.warehouseManagerName}`, useKurdish ? doc.internal.pageSize.width - 14 : 14, finalY + 15, { align: useKurdish ? 'right' : 'left' });
    
    finalY += 40;
    const pageHeight = doc.internal.pageSize.height;
    if (finalY > pageHeight - 30) {
        doc.addPage();
    }
    const signatureY = finalY > pageHeight - 50 ? 40 : finalY;
    doc.setFontSize(10);
    doc.text("...................................", doc.internal.pageSize.width - 120, signatureY, { align: 'center' });
    doc.text(t('warehouse_manager_signature'), doc.internal.pageSize.width - 120, signatureY + 10, { align: 'center' });
    
    doc.save(`${transfer.cargoName}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    {transfer && (
       <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', background: 'white', color: 'black' }}>
          <div ref={pdfCardRef} style={{ width: '700px' }}>
              <TransferPdfCard
                  transfer={transfer}
                  logoSrc={pdfSettings.invoice?.logo ?? null}
                  totalItems={transfer.itemIds.length}
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
                                    <TableHead>{t('notes')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.model}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
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
