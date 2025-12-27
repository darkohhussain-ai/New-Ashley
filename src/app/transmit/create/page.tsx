
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, writeBatch, Timestamp, query, where } from 'firebase/firestore';
import { ArrowLeft, Calendar, Truck, FileDown, User, Warehouse, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TransferPdfCard } from '@/components/transmit/transfer-pdf-card';
import useLocalStorage from '@/hooks/use-local-storage';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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

const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

export default function CreateTransferPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [destinationCity, setDestinationCity] = useState('');
  const [driverName, setDriverName] = useState('');
  const [warehouseManagerName, setWarehouseManagerName] = useState('');
  const [transferDate, setTransferDate] = useState<Date | undefined>(new Date());
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  
  const [lastTransfer, setLastTransfer] = useState<Transfer | null>(null);
  const [lastTransferItems, setLastTransferItems] = useState<Item[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const defaultLogo = "https://i.ibb.co/68RvM01/ashley-logo.png";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
  const pdfCardRef = useRef<HTMLDivElement>(null);
  
  const itemsRef = useMemoFirebase(() => (firestore && user ? query(collection(firestore, 'items'), where('transferId', '==', null)) : null), [firestore, user]);
  const { data: stagedItems, isLoading: isLoadingItems, setData: setStagedItems } = useCollection<Item>(itemsRef);

  const filteredItems = useMemo(() => {
    if (!stagedItems) return [];
    if (!destinationCity) return stagedItems;
    return stagedItems.filter(item => item.destination === destinationCity);
  }, [stagedItems, destinationCity]);

  const handleSelectAll = (checked: boolean) => {
    const newSelectedItems: Record<string, boolean> = {};
    if(checked) {
      filteredItems.forEach(item => {
        newSelectedItems[item.id] = true;
      });
    }
    setSelectedItems(newSelectedItems);
  };
  
  const isAllSelected = filteredItems.length > 0 && Object.keys(selectedItems).filter(id => selectedItems[id]).length === filteredItems.length;

  const handleCreateTransfer = async () => {
    const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id]);

    if (!firestore || !destinationCity || !driverName || !warehouseManagerName || !transferDate || selectedItemIds.length === 0) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all transfer details and select at least one item.' });
      return;
    }
    setIsSaving(true);
    
    try {
        const transferId = doc(collection(firestore, 'dummy')).id;
        const cargoName = `Transfer to ${destinationCity} - ${format(transferDate, 'yyyy-MM-dd')}`;
        
        const transferData: Transfer = {
            id: transferId,
            transferDate: Timestamp.fromDate(transferDate),
            cargoName,
            destinationCity,
            driverName,
            warehouseManagerName,
            itemIds: selectedItemIds
        };
        
        const itemsForThisTransfer = stagedItems?.filter(item => selectedItemIds.includes(item.id)) || [];

        const batch = writeBatch(firestore);
        const transferRef = doc(firestore, 'transfers', transferId);
        batch.set(transferRef, transferData);

        selectedItemIds.forEach(itemId => {
            const itemRef = doc(firestore, `items`, itemId);
            batch.update(itemRef, { transferId: transferId });
        });

        await batch.commit();
        
        setLastTransfer(transferData);
        setLastTransferItems(itemsForThisTransfer);
        setIsModalOpen(true);
        toast({ title: 'Success!', description: 'Transfer slip created successfully.' });

        setDestinationCity('');
        setDriverName('');
        setWarehouseManagerName('');
        setTransferDate(new Date());
        setSelectedItems({});
        
    } catch (error) {
        console.error("Error creating transfer:", error);
        toast({ variant: 'destructive', title: 'Save Error', description: 'Could not create the transfer slip.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfCardRef.current || !lastTransfer || !lastTransferItems) return;
    
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
      body: lastTransferItems.map(item => [item.model, item.quantity, item.notes || '']),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
    });

    const finalY = (pdf as any).lastAutoTable.finalY;
    pdf.setFontSize(10);
    pdf.text(`Driver: ${lastTransfer.driverName}`, 14, finalY + 20);
    pdf.text(`Warehouse Manager: ${lastTransfer.warehouseManagerName}`, 14, finalY + 30);
    
    pdf.save(`${lastTransfer.cargoName}.pdf`);
  };

  return (
    <>
    {lastTransfer && (
       <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', background: 'white', color: 'black' }}>
          <div ref={pdfCardRef} style={{ width: '700px' }}>
              <TransferPdfCard
                  transfer={lastTransfer}
                  logoSrc={logoSrc}
                  totalItems={lastTransfer.itemIds.length}
              />
          </div>
       </div>
    )}
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/transmit"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Create Transfer Slip</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Transfer Details</CardTitle>
                    <CardDescription>Select items from the list and fill out the details below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination">Destination City</Label>
                        <Select onValueChange={setDestinationCity} value={destinationCity}>
                            <SelectTrigger id="destination"><SelectValue placeholder="Filter items by city" /></SelectTrigger>
                            <SelectContent>
                                {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="driver-name">Driver Name</Label>
                        <Input id="driver-name" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Enter driver's name" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="manager-name">Warehouse Manager</Label>
                        <Input id="manager-name" value={warehouseManagerName} onChange={e => setWarehouseManagerName(e.target.value)} placeholder="Enter manager's name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Transfer Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !transferDate && "text-muted-foreground")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {transferDate ? format(transferDate, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={transferDate} onSelect={setTransferDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
                <CardContent>
                     <Button onClick={handleCreateTransfer} disabled={isSaving || Object.keys(selectedItems).filter(k => selectedItems[k]).length === 0} className="w-full">
                        {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Truck className="mr-2" />}
                        Create Transfer & Generate Report
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Items Ready for Transfer ({filteredItems.length})</CardTitle>
                    <CardDescription>Select items to include in this shipment. List is filtered by destination.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox 
                                          checked={isAllSelected}
                                          onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                          aria-label="Select all"
                                          disabled={!destinationCity}
                                        />
                                    </TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Destination</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingItems ? (
                                  [...Array(5)].map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={4} className="h-12 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                                  ))
                                ) : filteredItems.length > 0 ? filteredItems.map((item) => (
                                    <TableRow key={item.id} data-state={selectedItems[item.id] && "selected"}>
                                        <TableCell>
                                          <Checkbox
                                              checked={selectedItems[item.id] || false}
                                              onCheckedChange={(checked) => {
                                                  setSelectedItems(prev => ({...prev, [item.id]: !!checked}))
                                              }}
                                              aria-label={`Select ${item.model}`}
                                          />
                                        </TableCell>
                                        <TableCell className="font-medium">{item.model}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.destination}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            {destinationCity ? 'No items for this destination.' : 'Please select a destination city to see items.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      
      {lastTransfer && (
         <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Transfer Slip Created!</AlertDialogTitle>
                    <AlertDialogDescription>
                        The transfer slip for "{lastTransfer.cargoName}" has been successfully created.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                   <h3 className="text-lg font-semibold mb-2">Transfer Summary</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <p className="flex gap-2"><Truck className="w-4 h-4 text-primary"/> <strong>Destination:</strong> {lastTransfer.destinationCity}</p>
                        <p className="flex gap-2"><Calendar className="w-4 h-4 text-primary"/> <strong>Date:</strong> {format(lastTransfer.transferDate.toDate(), 'PPP')}</p>
                        <p className="flex gap-2"><User className="w-4 h-4 text-primary"/> <strong>Driver:</strong> {lastTransfer.driverName}</p>
                        <p className="flex gap-2"><Warehouse className="w-4 h-4 text-primary"/> <strong>Manager:</strong> {lastTransfer.warehouseManagerName}</p>
                   </div>
                   <h3 className="text-lg font-semibold mb-2">Transferred Items ({lastTransfer.itemIds.length})</h3>
                   <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Quantity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {lastTransferItems.map(item => (
                                   <TableRow key={item.id}>
                                       <TableCell>{item.model}</TableCell>
                                       <TableCell>{item.quantity}</TableCell>
                                   </TableRow>
                               ))}
                            </TableBody>
                        </Table>
                   </div>
                </div>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                    <Button onClick={handleDownloadPdf}><FileDown className="mr-2"/> Download PDF</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      )}
    </div>
    </>
  );
}
