
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ListPlus, FileDown, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';


const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

export default function StagedItemsPage() {
  const { t, language } = useTranslation();
  const { transferItems, settings } = useAppContext();
  const { customFont } = settings;
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);


  const isLoadingItems = !transferItems;
  const stagedItems = useMemo(() => transferItems.filter(item => !item.transferId), [transferItems]);


  const itemsForSelectedDestination = useMemo(() => {
    if (!stagedItems || !selectedDestination) return [];
    return stagedItems
      .filter(item => item.destination === selectedDestination)
      .sort((a,b) => a.model.localeCompare(b.model));
  }, [stagedItems, selectedDestination]);
  
  const handleDownloadPdf = () => {
    if (!itemsForSelectedDestination || itemsForSelectedDestination.length === 0 || !selectedDestination) return;
    const doc = new jsPDF();
    const useKurdish = language === 'ku';

    if (customFont && useKurdish) {
      const fontName = "CustomFont";
      const fontStyle = "normal";
      try {
        const fontBase64 = customFont.split(',')[1];
        doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
        doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
        doc.setFont(fontName);
      } catch (e) {
        console.error("Failed to load custom font for PDF:", e);
      }
    }

    doc.setFontSize(18);
    doc.text(`${t('staged_items_for')} ${selectedDestination}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('report_date')}: ${format(new Date(), 'PPP')}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    
    const head = [t('model'), t('quantity'), t('notes')];
    const body = itemsForSelectedDestination.map(item => [item.model, item.quantity, item.notes || '']);

    autoTable(doc, {
        startY: 40,
        head: [head],
        body: body,
        styles: { font: (customFont && useKurdish) ? 'CustomFont' : 'helvetica', halign: useKurdish ? 'right' : 'left' },
         didParseCell: (data) => {
            if (useKurdish && customFont) {
              data.cell.styles.font = "CustomFont";
              data.cell.styles.halign = 'right';
            }
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
    doc.text(t('warehouse_manager_signature'), doc.internal.pageSize.width - 120, signatureY + 10, { align: 'center' });

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
                                    <TableHead className="w-24">{t('quantity')}</TableHead>
                                    <TableHead>{t('notes')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemsForSelectedDestination.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.model}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
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
