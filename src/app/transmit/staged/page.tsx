
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
import { ItemForTransfer } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';


const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

export default function StagedItemsPage() {
  const { transferItems } = useAppContext();
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);


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
    if (customFontBase64) {
      const fontName = "CustomFont";
      const fontStyle = "normal";
      const fontBase64 = customFontBase64.split(',')[1];
      doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
      doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
      doc.setFont(fontName);
    }

    doc.setFontSize(18);
    doc.text(`Staged Items for ${selectedDestination}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on: ${format(new Date(), 'PPP')}`, 14, 30);
    
    autoTable(doc, {
        startY: 40,
        head: [['Model', 'Quantity', 'Notes']],
        body: itemsForSelectedDestination.map(item => [item.model, item.quantity, item.notes || '']),
        didParseCell: function (data) {
          if (customFontBase64) {
              data.cell.styles.font = "CustomFont";
          }
        }
    });

    doc.save(`staged-items-${selectedDestination}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoadingItems) {
      return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/transmit"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">Staged Items List</h1>
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
                    <h1 className="text-2xl md:text-3xl font-bold">Staged Items for {selectedDestination}</h1>
                </div>
                <Button onClick={handleDownloadPdf} disabled={itemsForSelectedDestination.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </header>
             <Card>
              <CardContent className="pt-6">
                {itemsForSelectedDestination.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="w-24">Quantity</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemsForSelectedDestination.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.model}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.notes || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <ListPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No Items Staged</h3>
                        <p className="mt-2 text-sm text-muted-foreground">There are no items currently staged for {selectedDestination}.</p>
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
            <h1 className="text-2xl md:text-3xl font-bold">View Staged Items</h1>
        </div>
      </header>

      <main>
        <Card>
            <CardHeader>
                <CardTitle>Select a Destination</CardTitle>
                <CardDescription>Choose a branch to view the list of items staged for transfer.</CardDescription>
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
