
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Loader2, ListPlus, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type Item = {
  id: string;
  model: string;
  quantity: number;
  destination: string;
  notes?: string;
  transferId?: string | null;
  createdAt: Timestamp;
};

export default function StagedItemsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const itemsRef = useMemoFirebase(() => (
    (firestore && user) ? query(collection(firestore, 'items'), where('transferId', '==', null)) : null
  ), [firestore, user]);
  const { data: stagedItems, isLoading: isLoadingItems } = useCollection<Item>(itemsRef);

  const itemsByDestination = useMemo(() => {
    if (!stagedItems) return new Map<string, Item[]>();

    const grouped = stagedItems.reduce((acc, item) => {
      const { destination } = item;
      if (!acc.has(destination)) {
        acc.set(destination, []);
      }
      acc.get(destination)!.push(item);
      return acc;
    }, new Map<string, Item[]>());

    // Sort items within each destination group
    grouped.forEach(items => items.sort((a,b) => a.model.localeCompare(b.model)));

    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [stagedItems]);
  
  const handleDownloadPdf = () => {
    if (!stagedItems || stagedItems.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Staged Items for Transfer', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on: ${format(new Date(), 'PPP')}`, 14, 30);
    
    let startY = 40;

    itemsByDestination.forEach((items, destination) => {
        if(startY > 250) { // Add new page if not enough space
            doc.addPage();
            startY = 20;
        }
        
        autoTable(doc, {
            startY: startY,
            head: [['Model', 'Quantity', 'Notes']],
            body: items.map(item => [item.model, item.quantity, item.notes || '']),
            didDrawPage: (data) => {
                // Add header to each page
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Destination: ${destination}`, data.settings.margin.left, startY - 5);
            }
        });
        
        startY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`staged-items-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const isLoading = isLoadingItems || isUserLoading;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/transmit"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Staged Items List</h1>
        </div>
        <Button onClick={handleDownloadPdf} disabled={!stagedItems || stagedItems.length === 0}>
            <FileDown className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </header>

      <main className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>
        ) : itemsByDestination.size > 0 ? (
          Array.from(itemsByDestination.entries()).map(([destination, items]) => (
            <Card key={destination}>
              <CardHeader>
                <CardTitle>{destination}</CardTitle>
                <CardDescription>{items.length} item(s) staged for this destination.</CardDescription>
              </CardHeader>
              <CardContent>
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
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.model}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.notes || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <ListPlus className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Items Staged for Transfer</h3>
            <p className="mt-2 text-sm text-muted-foreground">Add items to the transfer list to see them here.</p>
            <Button asChild className="mt-4">
                <Link href="/transmit/add">Add Items</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
