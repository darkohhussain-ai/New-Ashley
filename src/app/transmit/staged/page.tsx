
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ListPlus, FileDown, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { TransmitReportPdf } from '@/components/transmit/TransmitReportPdf';
import html2canvas from 'html2canvas';

const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

export default function StagedItemsPage() {
  const { t, language } = useTranslation();
  const { transferItems, settings } = useAppContext();
  const { pdfSettings, customFont } = settings;
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);

  const isLoadingItems = !transferItems;
  const stagedItems = useMemo(() => transferItems.filter(item => !item.transferId), [transferItems]);


  const itemsForSelectedDestination = useMemo(() => {
    if (!stagedItems || !selectedDestination) return [];
    return stagedItems
      .filter(item => item.destination === selectedDestination)
      .sort((a,b) => a.model.localeCompare(b.model));
  }, [stagedItems, selectedDestination]);
  
  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !selectedDestination) return;

    const pdfContentEl = pdfRef.current;
    const scale = pdfSettings.invoice?.scale ?? 2;
    const contentWidth = pdfSettings.invoice?.width ?? 800;

    const originalWidth = pdfContentEl.style.width;
    pdfContentEl.style.width = `${contentWidth}px`;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    
    const canvas = await html2canvas(pdfContentEl, { 
      scale,
      useCORS: true, 
      backgroundColor: 'white',
      onclone: (document) => {
        if (customFont && language === 'ku') {
            const style = document.createElement('style');
            style.innerHTML = `@font-face { font-family: 'CustomPdfFont'; src: url(${customFont}); } body, table, div, p, h1, h2, h3 { font-family: 'CustomPdfFont' !important; }`;
            document.head.appendChild(style);
        }
      }
    });

    pdfContentEl.style.width = originalWidth;

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfWidth / (canvas.width / canvas.height));
    doc.save(`staged-items-${selectedDestination}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoadingItems) {
      return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/transmit"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">{t('view_staged_items')}</h1>
            </header>
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        </div>
      )
  }

  if (selectedDestination) {
    return (
        <>
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={pdfRef}>
                    <TransmitReportPdf
                        transfer={{ destinationCity: selectedDestination, transferDate: new Date().toISOString() }}
                        items={itemsForSelectedDestination}
                        settings={pdfSettings.invoice}
                    />
                </div>
            </div>
            <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
                <header className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setSelectedDestination(null)}>
                            <ArrowLeft />
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold">{t('staged_items_for')} {selectedDestination}</h1>
                    </div>
                    <Button onClick={handleDownloadPdf} disabled={itemsForSelectedDestination.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" /> {t('download_pdf')}
                    </Button>
                </header>
                <Card>
                <CardContent className="pt-6">
                    {itemsForSelectedDestination.length > 0 ? (
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
                                    {itemsForSelectedDestination.map(item => (
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
                    ) : (
                        <div className="text-center py-16">
                            <ListPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">{t('no_items_staged')}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{t('no_items_staged_for_destination', {destination: selectedDestination})}</p>
                        </div>
                    )}
                </CardContent>
                </Card>
            </div>
        </>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/transmit"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">{t('view_staged_items')}</h1>
        </div>
      </header>

      <main>
        <Card>
            <CardHeader>
                <CardTitle>{t('select_a_destination')}</CardTitle>
                <CardDescription>{t('select_destination_to_view_staged')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {destinations.map(destination => (
                    <Button 
                        key={destination} 
                        variant="outline" 
                        className="h-24 text-lg flex-col gap-2"
                        onClick={() => setSelectedDestination(destination)}
                    >
                        <Building className="w-6 h-6 text-primary"/>
                        {destination}
                    </Button>
                ))}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
