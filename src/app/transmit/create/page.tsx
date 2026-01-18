
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Truck, FileDown, User, Warehouse, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, formatISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TransferPdfCard } from '@/components/transmit/transfer-pdf-card';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/app-provider';
import type { Transfer, ItemForTransfer, AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';


const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

export default function CreateTransferPage() {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { transferItems, setTransferItems, transfers, setTransfers, settings } = useAppContext();
  const { pdfSettings, customFont } = settings;

  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [destinationCity, setDestinationCity] = useState('');
  const [driverName, setDriverName] = useState('');
  const [warehouseManagerName, setWarehouseManagerName] = useState('');
  const [transferDate, setTransferDate] = useState<Date | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    // Only set the date on the client-side
    setTransferDate(new Date());
  }, []);

  const [lastTransfer, setLastTransfer] = useState<Transfer | null>(null);
  const [lastTransferItems, setLastTransferItems] = useState<ItemForTransfer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const pdfCardRef = useRef<HTMLDivElement>(null);
  
  const stagedItems = useMemo(() => transferItems.filter(item => !item.transferId), [transferItems]);
  const isLoadingItems = !transferItems;

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

    if (!destinationCity || !driverName || !warehouseManagerName || !transferDate || selectedItemIds.length === 0) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('create_transfer_validation') });
      return;
    }
    setIsSaving(true);
    
    try {
        const transferId = crypto.randomUUID();
        const cargoName = `Transfer to ${destinationCity} - ${format(transferDate, 'yyyy-MM-dd')}`;
        
        const transferData: Transfer = {
            id: transferId,
            transferDate: formatISO(transferDate),
            cargoName,
            destinationCity,
            driverName,
            warehouseManagerName,
            itemIds: selectedItemIds
        };
        
        const itemsForThisTransfer = stagedItems?.filter(item => selectedItemIds.includes(item.id)) || [];

        setTransfers([...transfers, transferData]);
        setTransferItems(transferItems.map(item => selectedItemIds.includes(item.id) ? { ...item, transferId } : item));
        
        setLastTransfer(transferData);
        setLastTransferItems(itemsForThisTransfer);
        setIsModalOpen(true);
        toast({ title: t('success'), description: t('transfer_slip_created') });

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

  const handleDownloadPdf = async () => {
    if (!pdfCardRef.current || !lastTransfer || !lastTransferItems) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pdfGenSettings = pdfSettings.invoice || {};
    const useKurdish = language === 'ku';

    if (customFont && useKurdish) {
        const fontName = "CustomFont";
        const fontStyle = "normal";
        try {
            const fontBase64 = customFont.split(',')[1];
            doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
            doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
            doc.setFont(fontName);
        } catch(e) {
            console.error("Could not add custom font to PDF", e);
        }
    }
    
    const canvas = await html2canvas(pdfCardRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth - 28;
    const finalImgHeight = finalImgWidth / ratio;
    
    doc.addImage(imgData, 'PNG', 14, 14, finalImgWidth, finalImgHeight);
    
    const head = [t('model'), t('quantity'), t('notes')];
    const body = lastTransferItems.map(item => [item.model, item.quantity, item.notes || '']);

    autoTable(doc, {
      startY: finalImgHeight + 30,
      head: [head],
      body: body,
      theme: 'grid',
      styles: { font: (customFont && useKurdish) ? 'CustomFont' : 'helvetica', halign: useKurdish ? 'right' : 'left' },
      headStyles: { fillColor: pdfGenSettings.themeColor || '#3b82f6', textColor: 255, fontStyle: 'bold' },
      didParseCell: (data) => {
        if (useKurdish && customFont) {
          data.cell.styles.font = "CustomFont";
          data.cell.styles.halign = 'right';
        }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(10);
    doc.text(`${t('driver')}: ${lastTransfer.driverName}`, useKurdish ? doc.internal.pageSize.width - 14 : 14, finalY, { align: useKurdish ? 'right' : 'left' });
    doc.text(`${t('warehouse_manager')}: ${lastTransfer.warehouseManagerName}`, useKurdish ? doc.internal.pageSize.width - 14 : 14, finalY + 15, { align: useKurdish ? 'right' : 'left' });

    finalY += 40;
    const pageHeight = doc.internal.pageSize.height;
    if (finalY > pageHeight - 30) {
        doc.addPage();
        finalY = 40; // Reset Y for new page
    }
    const signatureY = finalY;
    doc.setFontSize(10);
    doc.text("...................................", doc.internal.pageSize.width - 120, signatureY, { align: 'center' });
    doc.text(t('warehouse_manager_signature'), doc.internal.pageSize.width - 120, signatureY + 10, { align: 'center' });

    doc.save(`${lastTransfer.cargoName}.pdf`);
  };

  return (
    <>
    {lastTransfer && (
       <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', background: 'white', color: 'black' }}>
          <div ref={pdfCardRef} style={{ width: '700px' }}>
              <TransferPdfCard
                  transfer={lastTransfer}
                  logoSrc={pdfSettings.invoice?.logo ?? null}
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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !transferDate && "text-muted-foreground")}>
                                    <CalendarComponent className="mr-2 h-4 w-4" />
                                    {transferDate ? format(transferDate, 'PPP') : <span>{t('pick_a_date')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={transferDate} onSelect={setTransferDate} initialFocus /></PopoverContent>
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
                                          checked={isAllSelected}
                                          onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                          aria-label="Select all"
                                          disabled={!destinationCity}
                                        />
                                    </TableHead>
                                    <TableHead>{t('model')}</TableHead>
                                    <TableHead>{t('quantity')}</TableHead>
                                    <TableHead>{t('destination')}</TableHead>
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
      
      {lastTransfer && (
         <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('transfer_slip_created_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('transfer_slip_created_desc', {cargoName: lastTransfer.cargoName})}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                   <h3 className="text-lg font-semibold mb-2">{t('transfer_summary')}</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <p className="flex gap-2"><Truck className="w-4 h-4 text-primary"/> <strong>{t('destination')}:</strong> {lastTransfer.destinationCity}</p>
                        <p className="flex gap-2"><Calendar className="w-4 h-4 text-primary"/> <strong>{t('date')}:</strong> {format(parseISO(lastTransfer.transferDate), 'PPP')}</p>
                        <p className="flex gap-2"><User className="w-4 h-4 text-primary"/> <strong>{t('driver')}:</strong> {lastTransfer.driverName}</p>
                        <p className="flex gap-2"><Warehouse className="w-4 h-4 text-primary"/> <strong>{t('manager')}:</strong> {lastTransfer.warehouseManagerName}</p>
                   </div>
                   <h3 className="text-lg font-semibold mb-2">{t('transferred_items')} ({lastTransfer.itemIds.length})</h3>
                   <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('model')}</TableHead>
                                    <TableHead>{t('quantity')}</TableHead>
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
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('close')}</Button>
                    <Button onClick={handleDownloadPdf}><FileDown className="mr-2"/> {t('download_pdf')}</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      )}
    </div>
    </>
  );
}
