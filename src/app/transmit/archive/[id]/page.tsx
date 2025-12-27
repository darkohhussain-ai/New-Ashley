
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Calendar, Truck, FileDown, User, Warehouse, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransferPdfCard } from '@/components/transmit/transfer-pdf-card';
import useLocalStorage from '@/hooks/use-local-storage';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Skeleton } from '@/components/ui/skeleton';

type Item = {
  id: string;
  model: string;
  quantity: number;
  destination: string;
  notes?: string;
  transferId?: string | null;
  createdAt: Timestamp;
};

type Transfer = {
  id: string;
  transferDate: Timestamp;
  cargoName: string;
  destinationCity: string;
  driverName: string;
  warehouseManagerName: string;
  itemIds: string[];
};

export default function ViewTransferPage() {
  const { id: transferId } = useParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [isSaving, setIsSaving] = useState(false);
  
  const defaultLogo = "https://i.ibb.co/68RvM01/ashley-logo.png";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
  const pdfCardRef = useRef<HTMLDivElement>(null);
  
  const transferRef = useMemoFirebase(() => (firestore && user && transferId ? doc(firestore, 'transfers', transferId as string) : null), [firestore, user, transferId]);
  const { data: transfer, isLoading: isLoadingTransfer } = useDoc<Transfer>(transferRef);

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !transferId) return null;
    return query(collection(firestore, 'items'), where('transferId', '==', transferId));
  }, [firestore, user, transferId]);
  const { data: items, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

  const isLoading = isLoadingTransfer || isLoadingItems || isUserLoading;

  const handleDownloadPdf = async () => {
    if (!pdfCardRef.current || !transfer || !items) return;
    
    const canvas = await html2canvas(pdfCardRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth - 28;
    const finalImgHeight = finalImgWidth / ratio;
    
    pdf.addImage(imgData, 'PNG', 14, 14, finalImgWidth, finalImgHeight);
    
    autoTable(pdf, {
      startY: finalImgHeight + 30,
      head: [['Model', 'Quantity', 'Notes']],
      body: items.map(item => [item.model, item.quantity, item.notes || '']),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
    });

    const finalY = (pdf as any).lastAutoTable.finalY;
    pdf.setFontSize(10);
    pdf.text(`Driver: ${transfer.driverName}`, 14, finalY + 20);
    pdf.text(`Warehouse Manager: ${transfer.warehouseManagerName}`, 14, finalY + 30);
    
    pdf.save(`${transfer.cargoName}.pdf`);
  };

  return (
    <>
    {transfer && (
       <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', background: 'white', color: 'black' }}>
          <div ref={pdfCardRef} style={{ width: '700px' }}>
              <TransferPdfCard
                  transfer={transfer}
                  logoSrc={logoSrc}
                  totalItems={transfer.itemIds.length}
              />
          </div>
       </div>
    )}
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/transmit/archive"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Transfer Details</h1>
          </div>
          <Button onClick={handleDownloadPdf} disabled={!transfer || !items}>
              <FileDown className="mr-2"/> Download PDF
          </Button>
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
                    <p className="flex gap-2 items-center"><Truck className="w-4 h-4 text-primary"/> <strong>Destination:</strong> {transfer.destinationCity}</p>
                    <p className="flex gap-2 items-center"><Calendar className="w-4 h-4 text-primary"/> <strong>Date:</strong> {format(transfer.transferDate.toDate(), 'PPP')}</p>
                    <p className="flex gap-2 items-center"><User className="w-4 h-4 text-primary"/> <strong>Driver:</strong> {transfer.driverName}</p>
                    <p className="flex gap-2 items-center"><Warehouse className="w-4 h-4 text-primary"/> <strong>Manager:</strong> {transfer.warehouseManagerName}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Transferred Items ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
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
        </div>
      ) : (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold">Transfer Not Found</h2>
            <p className="text-muted-foreground">The transfer you are looking for does not exist.</p>
        </div>
      )}
    </div>
    </>
  );
}
