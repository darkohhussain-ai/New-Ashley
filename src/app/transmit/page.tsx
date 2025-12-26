
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Save, Loader2, Calendar, Truck, FileDown, User, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransferPdfCard } from '@/components/transmit/transfer-pdf-card';
import useLocalStorage from '@/hooks/use-local-storage';
import html2canvas from 'html2canvas';


type Item = {
  id: string;
  fileId: string;
  model: string;
  quantity: number;
  locationId?: string;
  transferId?: string;
  destinationCity?: string;
};

type ExcelFile = {
  id: string;
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

export default function TransmitPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // Form State
  const [destinationCity, setDestinationCity] = useState('');
  const [driverName, setDriverName] = useState('');
  const [warehouseManagerName, setWarehouseManagerName] = useState('');
  const [transferDate, setTransferDate] = useState<Date | undefined>(new Date());
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  
  const [lastTransfer, setLastTransfer] = useState<Transfer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const defaultLogo = "https://i.ibb.co/68RvM01/ashley-logo.png";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
  const pdfCardRef = useRef<HTMLDivElement>(null);


  const excelFilesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'excel_files') : null), [firestore]);
  const { data: excelFiles, isLoading: isLoadingExcelFiles } = useCollection<ExcelFile>(excelFilesRef);

  useEffect(() => {
    const fetchAllItems = async () => {
      if (!firestore || !excelFiles || excelFiles.length === 0) {
        if (!isLoadingExcelFiles) setIsLoadingItems(false);
        return;
      }
      setIsLoadingItems(true);
      let allItemsData: Item[] = [];
      for (const file of excelFiles) {
        const itemsCollectionRef = collection(firestore, `excel_files/${file.id}/items`);
        // We only want items that are not yet transferred
        const q = query(itemsCollectionRef, where('transferId', '==', null));
        const itemsSnapshot = await getDocs(q);
        const fileItems = itemsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Item));
        allItemsData = [...allItemsData, ...fileItems];
      }
      setAllItems(allItemsData);
      setIsLoadingItems(false);
    };

    fetchAllItems();
  }, [firestore, excelFiles, isLoadingExcelFiles]);
  
  const itemsAvailableForTransfer = useMemo(() => {
    return allItems.filter(item => !item.transferId);
  }, [allItems]);

  const handleSelectAll = (checked: boolean) => {
    const newSelectedItems: Record<string, boolean> = {};
    if(checked) {
      itemsAvailableForTransfer.forEach(item => {
        newSelectedItems[item.id] = true;
      });
    }
    setSelectedItems(newSelectedItems);
  }

  const handleCreateTransfer = async () => {
    const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id]);

    if (!firestore || !destinationCity || !driverName || !warehouseManagerName || !transferDate || selectedItemIds.length === 0) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all transfer details and select at least one item.' });
      return;
    }
    setIsSaving(true);

    const transferId = doc(collection(firestore, 'dummy')).id;
    
    try {
        const batch = writeBatch(firestore);

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
        const transferRef = doc(firestore, 'transfers', transferId);
        batch.set(transferRef, transferData);

        selectedItemIds.forEach(itemId => {
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                const itemRef = doc(firestore, `excel_files/${item.fileId}/items`, itemId);
                batch.update(itemRef, {
                    transferId: transferId,
                    destinationCity: destinationCity
                });
            }
        });

        await batch.commit();
        
        setLastTransfer(transferData);
        setIsModalOpen(true);
        toast({ title: 'Success!', description: 'Transfer slip created successfully.' });

        // Reset form
        setDestinationCity('');
        setDriverName('');
        setWarehouseManagerName('');
        setTransferDate(new Date());
        setSelectedItems({});
        
        // Refresh items list
        setAllItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));

    } catch (error) {
        console.error("Error creating transfer:", error);
        toast({ variant: 'destructive', title: 'Save Error', description: 'Could not create the transfer slip.' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const selectedItemsDetails = useMemo(() => {
    if (!lastTransfer) return [];
    return allItems.filter(item => lastTransfer.itemIds.includes(item.id));
  }, [lastTransfer, allItems]);


  const handleDownloadPdf = async () => {
    if (!pdfCardRef.current || !lastTransfer) return;
    
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
    
    const itemsForTable = allItems.filter(item => lastTransfer.itemIds.includes(item.id));

    autoTable(pdf, {
      startY: finalImgHeight + 30,
      head: [['Model', 'Quantity', 'Notes']],
      body: itemsForTable.map(item => [item.model, item.quantity, item.notes || '']),
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
  
  const isAllSelected = itemsAvailableForTransfer.length > 0 && Object.keys(selectedItems).length === itemsAvailableForTransfer.length;

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
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Transmit Cargo</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Transfer Slip</CardTitle>
                    <CardDescription>Select items from the list and fill out the details below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination">Destination City</Label>
                        <Select onValueChange={setDestinationCity} value={destinationCity}>
                            <SelectTrigger id="destination"><SelectValue placeholder="Select a city" /></SelectTrigger>
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
                    <CardTitle>Items Available for Transfer ({itemsAvailableForTransfer.length})</CardTitle>
                    <CardDescription>These items are located in Sulaymaniyah and have not been transferred yet.</CardDescription>
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
                                        />
                                    </TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="w-[100px]">Quantity</TableHead>
                                    <TableHead>Current Location</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingItems ? (
                                  [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                      <TableCell colSpan={4}><Loader2 className="animate-spin" /></TableCell>
                                    </TableRow>
                                  ))
                                ) : itemsAvailableForTransfer.length > 0 ? itemsAvailableForTransfer.map((item) => (
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
                                        <TableCell>{item.locationId || 'N/A'}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No items available for transfer.
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
                        <p className="flex gap.2"><Warehouse className="w-4 h-4 text-primary"/> <strong>Manager:</strong> {lastTransfer.warehouseManagerName}</p>
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
                               {allItems.filter(i => lastTransfer.itemIds.includes(i.id)).map(item => (
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

    