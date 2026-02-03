
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, ListPlus, FileDown, Building, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { StagedItemsPrintView } from '@/components/transmit/StagedItemsPrintView';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

export default function StagedItemsPage() {
  const { t, language } = useTranslation();
  const { transferItems, transfers, settings, isLoading: isAppLoading } = useAppContext();
  const { pdfSettings } = settings || {};
  const searchParams = useSearchParams();
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  useEffect(() => {
    const destinationParam = searchParams.get('destination');
    if (destinationParam) {
      setSelectedDestination(decodeURIComponent(destinationParam));
    }
  }, [searchParams]);

  const stagedItems = useMemo(() => transferItems.filter(item => !item.transferId), [transferItems]);


  const itemsForSelectedDestination = useMemo(() => {
    if (!stagedItems || !selectedDestination) return [];
    return stagedItems
      .filter(item => item.destination === selectedDestination)
      .sort((a,b) => a.model.localeCompare(b.model));
  }, [stagedItems, selectedDestination]);

  const destinationStats = useMemo(() => {
    return destinations.map(dest => {
        const itemsForDest = stagedItems.filter(item => item.destination === dest);
        const lastTransfer = transfers
            .filter(t => t.destinationCity === dest && t.transferDate && !isNaN(parseISO(t.transferDate).getTime()))
            .sort((a,b) => parseISO(b.transferDate).getTime() - parseISO(a.transferDate).getTime())[0];
        
        const color = pdfSettings?.invoice?.branchColors?.[dest as keyof typeof pdfSettings.invoice.branchColors] || '#cccccc';

        return {
            destination: dest,
            stagedItemCount: itemsForDest.length,
            lastTransferDate: lastTransfer ? lastTransfer.transferDate : null,
            color: color
        };
    });
  }, [stagedItems, transfers, pdfSettings]);
  
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!itemsForSelectedDestination || itemsForSelectedDestination.length === 0) return;
    const dataToExport = itemsForSelectedDestination.map(item => ({
        [t('model')]: item.model,
        [t('quantity')]: item.quantity,
        [t('invoice_no')]: item.invoiceNo || 'N/A',
        [t('storage')]: item.storage || 'N/A',
        [t('notes')]: item.notes || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Staged - ${selectedDestination}`);
    XLSX.writeFile(workbook, `staged-items-${selectedDestination}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (isAppLoading) {
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
            <div className="hidden print:block">
                <StagedItemsPrintView
                    destination={selectedDestination}
                    items={itemsForSelectedDestination}
                />
            </div>
            <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:hidden">
                <header className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setSelectedDestination(null)}>
                            <ArrowLeft />
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold">{t('staged_items_for')} {selectedDestination}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrint} variant="outline" size="icon" disabled={itemsForSelectedDestination.length === 0}><Printer className="h-4 w-4" /></Button>
                        <Button onClick={handleExportExcel} variant="outline" size="icon" disabled={itemsForSelectedDestination.length === 0}><FileSpreadsheet className="h-4 w-4" /></Button>
                    </div>
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
                {destinationStats.map(stat => (
                    <Card key={stat.destination} className="hover:bg-muted/50 cursor-pointer border-2" style={{borderColor: stat.color}} onClick={() => setSelectedDestination(stat.destination)}>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary"/>{stat.destination}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-1 text-sm">
                            <p><strong>{stat.stagedItemCount}</strong> {t('items_staged')}</p>
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {t('last_transfer')}: {stat.lastTransferDate ? format(parseISO(stat.lastTransferDate), 'PP') : t('na')}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
