
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Truck, Calendar as CalendarIcon, Printer, ArrowRight, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, formatISO, parseISO, getYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAppContext } from '@/context/app-provider';
import type { Transfer, ItemForTransfer } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { TransmitReportPdf } from '@/components/transmit/TransmitReportPdf';

const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

type TransferDetails = {
    destinationCity: string;
    driverName: string;
    warehouseManagerName: string;
    transferDate: Date;
    invoiceNumber: number;
}

export default function CreateTransferPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const { transferItems, setTransferItems, transfers, setTransfers, isLoading: isAppLoading } = useAppContext();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [transferDetails, setTransferDetails] = useState<Partial<TransferDetails>>({
      transferDate: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [itemsToTransfer, setItemsToTransfer] = useState< (ItemForTransfer & { transferQuantity: number })[] >([]);
  
  const [lastTransfer, setLastTransfer] = useState<Transfer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const nextInvoiceNumber = () => {
        const currentYear = getYear(new Date());
        const yearlyTransfers = transfers.filter(t => t.transferDate && getYear(parseISO(t.transferDate)) === currentYear);
        return yearlyTransfers.length + 1;
    };
    setTransferDetails(prev => ({...prev, invoiceNumber: nextInvoiceNumber()}));
  }, [transfers]);


  const handleNextStep = () => {
      if (!transferDetails.destinationCity || !transferDetails.driverName || !transferDetails.warehouseManagerName || !transferDetails.transferDate || !transferDetails.invoiceNumber) {
        toast({ variant: 'destructive', title: t('missing_information'), description: t('create_transfer_validation_step1') });
        return;
      }
      
      const stagedItems = transferItems.filter(item => !item.transferId && item.destination === transferDetails.destinationCity);
      setItemsToTransfer(stagedItems.map(item => ({ ...item, transferQuantity: item.quantity })));
      setStep(2);
  };
  
  const handleItemQuantityChange = (itemId: string, newQuantity: number) => {
      setItemsToTransfer(currentItems =>
          currentItems.map(item => {
              if (item.id === itemId) {
                  const maxQuantity = transferItems.find(i => i.id === itemId)?.quantity || 0;
                  const validatedQuantity = Math.max(0, Math.min(newQuantity, maxQuantity));
                  return { ...item, transferQuantity: validatedQuantity };
              }
              return item;
          })
      );
  };
  

  const handleCreateTransfer = async () => {
    const selectedItems = itemsToTransfer.filter(item => item.transferQuantity > 0);

    if (selectedItems.length === 0) {
        toast({ variant: 'destructive', title: t('no_items_to_transfer'), description: "Please select at least one item or set a quantity greater than zero." });
        return;
    }
    
    if (!transferDetails.destinationCity || !transferDetails.driverName || !transferDetails.warehouseManagerName || !transferDetails.transferDate || !transferDetails.invoiceNumber) {
        toast({ variant: 'destructive', title: t('missing_information'), description: t('create_transfer_validation_step1') });
        setStep(1);
        return;
    }
    
    setIsSaving(true);
    
    try {
        const transferId = crypto.randomUUID();
        const cargoName = `Transfer to ${transferDetails.destinationCity} - ${format(transferDetails.transferDate, 'yyyy-MM-dd')}`;
        
        const newTransfer: Transfer = {
            id: transferId,
            transferDate: formatISO(transferDetails.transferDate),
            cargoName,
            destinationCity: transferDetails.destinationCity,
            driverName: transferDetails.driverName,
            warehouseManagerName: transferDetails.warehouseManagerName,
            itemIds: selectedItems.map(item => item.id),
            invoiceNumber: transferDetails.invoiceNumber,
        };

        const updatedItems: ItemForTransfer[] = [];
        const newStagedItems: ItemForTransfer[] = [];

        transferItems.forEach(originalItem => {
            const transferItem = selectedItems.find(i => i.id === originalItem.id);
            if (transferItem) {
                if (transferItem.transferQuantity < originalItem.quantity) {
                    // Partial transfer
                    const remainingItem: ItemForTransfer = {
                        ...originalItem,
                        id: crypto.randomUUID(),
                        quantity: originalItem.quantity - transferItem.transferQuantity,
                        transferId: null,
                    };
                    newStagedItems.push(remainingItem);
                    
                    const itemBeingTransferred: ItemForTransfer = {
                        ...originalItem,
                        quantity: transferItem.transferQuantity,
                        transferId: transferId,
                    };
                    updatedItems.push(itemBeingTransferred);

                } else {
                    // Full transfer
                    updatedItems.push({ ...originalItem, transferId: transferId });
                }
            } else {
                // Item not in this transfer, keep it as is
                updatedItems.push(originalItem);
            }
        });
        
        setTransfers(prev => [...prev, newTransfer]);
        setTransferItems([...updatedItems, ...newStagedItems]);
        
        setLastTransfer(newTransfer);
        setIsModalOpen(true);
        toast({ title: t('transfer_slip_created_title'), description: t('transfer_slip_created_desc', { cargoName }) });
        
        // Reset state for next transfer
        setStep(1);
        setTransferDetails({ transferDate: new Date() });
        setItemsToTransfer([]);

    } catch (error) {
        console.error("Error creating transfer:", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to create transfer slip." });
    } finally {
        setIsSaving(false);
    }
  };


  if (isAppLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('transfer_slip_created_title')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('transfer_slip_created_desc', { cargoName: lastTransfer?.cargoName })}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    {t('close')}
                </Button>
                <Button onClick={() => router.push(`/transmit/archive/${lastTransfer?.id}`)}>
                    {t('view_transfer')}
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/transmit"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">{t('create_transfer_slip')}</h1>
            </div>
            {step === 2 && (
                 <Button onClick={handleCreateTransfer} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" />}
                    {t('create_transfer_generate_report')}
                </Button>
            )}
        </header>

        {step === 1 && (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>{t('step_1_title')}</CardTitle>
                    <CardDescription>{t('step_1_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination">{t('destination_city')}</Label>
                        <Select onValueChange={(val) => setTransferDetails(prev => ({...prev, destinationCity: val}))} value={transferDetails.destinationCity}>
                            <SelectTrigger id="destination"><SelectValue placeholder={t('filter_items_by_city')} /></SelectTrigger>
                            <SelectContent>
                                {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="driver-name">{t('driver_name')}</Label>
                            <Input id="driver-name" value={transferDetails.driverName || ''} onChange={e => setTransferDetails(prev => ({...prev, driverName: e.target.value}))} placeholder={t('enter_driver_name')} />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="manager-name">{t('warehouse_manager')}</Label>
                           <Input id="manager-name" value={transferDetails.warehouseManagerName || ''} onChange={e => setTransferDetails(prev => ({...prev, warehouseManagerName: e.target.value}))} placeholder={t('enter_manager_name')} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('transfer_date')}</Label>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !transferDetails.transferDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {transferDetails.transferDate ? format(transferDetails.transferDate, 'PPP') : <span>{t('pick_a_date')}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={transferDetails.transferDate} onSelect={(d) => {if(d) setTransferDetails(p=>({...p, transferDate: d})); setIsCalendarOpen(false);}} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-number">{t('invoice_no')}</Label>
                            <Input id="invoice-number" type="number" value={transferDetails.invoiceNumber || ''} onChange={e => setTransferDetails(prev => ({...prev, invoiceNumber: parseInt(e.target.value) || 0}))} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNextStep} className="w-full">
                        {t('next_step')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        )}

        {step === 2 && (
             <Card>
                <CardHeader>
                    <CardTitle>{t('step_2_title')}</CardTitle>
                    <CardDescription>{t('step_2_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('model')}</TableHead>
                                    <TableHead className="w-48">{t('transfer_quantity')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemsToTransfer.length > 0 ? itemsToTransfer.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <p className="font-medium">{item.model}</p>
                                            <p className="text-xs text-muted-foreground">{t('available_quantity', {qty: item.quantity})}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={item.transferQuantity}
                                                onChange={e => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                                                max={item.quantity}
                                                min={0}
                                                className="w-24"
                                            />
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                            {t('no_items_for_destination')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => setStep(1)} variant="outline">{t('back')}</Button>
                </CardFooter>
            </Card>
        )}

    </div>
    </>
  );
}
