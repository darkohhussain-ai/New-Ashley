
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Truck, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, formatISO, parseISO } from 'date-fns';
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

export default function CreateTransferPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const { transferItems, setTransferItems, transfers, setTransfers, isLoading: isAppLoading, settings } = useAppContext();

  const [isSaving, setIsSaving] = useState(false);
  const [destinationCity, setDestinationCity] = useState('');
  const [driverName, setDriverName] = useState('');
  const [warehouseManagerName, setWarehouseManagerName] = useState('');
  const [transferDate, setTransferDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (!isAppLoading) {
        setTransferDate(new Date());
    }
  }, [isAppLoading]);

  const [lastTransfer, setLastTransfer] = useState<Transfer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const stagedItems = useMemo(() => transferItems.filter(item => !item.transferId), [transferItems]);

  const filteredItems = useMemo(() => {
    if (!stagedItems || !destinationCity) return [];
    return stagedItems.filter(item => item.destination === destinationCity);
  }, [stagedItems, destinationCity]);
  
  const selectedInFilterCount = useMemo(() => {
    return filteredItems.filter(item => selectedItems[item.id]).length;
  }, [filteredItems, selectedItems]);
  
  const isAllSelected = filteredItems.length > 0 && selectedInFilterCount === filteredItems.length;
  const isIndeterminate = selectedInFilterCount > 0 && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      filteredItems.forEach(item => {
        newSelected[item.id] = checked;
      });
      return newSelected;
    });
  };

  const handleCreateTransfer = async () => {
    const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id]);

    if (!destinationCity || !driverName || !warehouseManagerName || !transferDate || selectedItemIds.length === 0) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('create_transfer_validation') });
      return;
    }
    setIsSaving(true);
    
    try {
        const transferId = crypto.randomUUID();
        const cargoName = `Transfer to ${destinationCity} - ${format(transferDate, 'yyyy-MM-dd')}`;
        
        const currentYear = new Date().getFullYear();
        const yearlyTransfers = transfers.filter(t => t.transferDate && new Date(t.transferDate).getFullYear() === currentYear);
        const invoiceNumber = yearlyTransfers.length + 1;
        
        const transferData: Transfer = {
            id: transferId,
            transferDate: formatISO(transferDate),
            cargoName,
            destinationCity,
            driverName,
            warehouseManagerName,
            itemIds: selectedItemIds,
            invoiceNumber
        };

        setTransfers(prev => [...prev, transferData]);
        setTransferItems(prevItems => prevItems.map(item => selectedItemIds.includes(item.id) ? { ...item, transferId } : item));
        
        setLastTransfer(transferData);
        setIsModalOpen(true);
        toast({ title: t('transfer_slip_created_title'), description: t('transfer_slip_created_desc', { cargoName }) });

        setDestinationCity('');
        setDriverName('');
        setWarehouseManagerName('');
        setTransferDate(new Date());
        setSelectedItems({});
        
    } catch (error) {
        console.error("Error creating transfer:", error);
        toast({ variant: 'destructive', title: t('save_error'), description: t('create_transfer_error') });
    } finally {
        setIsSaving(false);
    }
  };

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
      <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/transmit"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{t('create_transfer_slip')}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('transfer_details')}</CardTitle>
                    <CardDescription>{t('transfer_details_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination">{t('destination_city')}</Label>
                        <Select onValueChange={setDestinationCity} value={destinationCity}>
                            <SelectTrigger id="destination"><SelectValue placeholder={t('filter_items_by_city')} /></SelectTrigger>
                            <SelectContent>
                                {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="driver-name">{t('driver_name')}</Label>
                        <Input id="driver-name" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder={t('enter_driver_name')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="manager-name">{t('warehouse_manager')}</Label>
                        <Input id="manager-name" value={warehouseManagerName} onChange={e => setWarehouseManagerName(e.target.value)} placeholder={t('enter_manager_name')} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('transfer_date')}</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !transferDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {transferDate ? format(transferDate, 'PPP') : <span>{t('pick_a_date')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={transferDate}
                                onSelect={(date) => {
                                  if (date) setTransferDate(date);
                                  setIsCalendarOpen(false);
                                }}
                                initialFocus
                              />
                              <div className="p-2 border-t">
                                <Input 
                                    type="text"
                                    placeholder="yyyy-mm-dd"
                                    value={transferDate ? format(transferDate, 'yyyy-MM-dd') : ''}
                                    onChange={(e) => {
                                        try {
                                            const newDate = parseISO(e.target.value);
                                            if (!isNaN(newDate.getTime())) {
                                                setTransferDate(newDate);
                                            }
                                        } catch {}
                                    }}
                                />
                              </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
                <CardContent>
                     <Button onClick={handleCreateTransfer} disabled={isSaving || Object.keys(selectedItems).filter(k => selectedItems[k]).length === 0} className="w-full">
                        {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Truck className="mr-2" />}
                        {t('create_transfer_generate_report')}
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t('items_ready_for_transfer')} ({filteredItems.length})</CardTitle>
                    <CardDescription>{t('items_ready_for_transfer_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox 
                                          checked={isIndeterminate ? 'indeterminate' : isAllSelected}
                                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                                          aria-label="Select all"
                                          disabled={!destinationCity || filteredItems.length === 0}
                                        />
                                    </TableHead>
                                    <TableHead>{t('model')}</TableHead>
                                    <TableHead>{t('quantity')}</TableHead>
                                    <TableHead>{t('destination')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length > 0 ? filteredItems.map((item) => (
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
                                            {destinationCity ? t('no_items_for_destination') : t('select_destination_to_see_items')}
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
    </div>
    </>
  );
}
