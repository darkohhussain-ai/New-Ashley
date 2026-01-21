
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit, Save, X, Loader2, ListPlus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import type { ItemForTransfer } from '@/lib/types';
import { format, formatISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];
const storageOptions = ["Ashley", "Huana", "Showroom"];

export default function AddItemsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { transferItems, setTransferItems } = useAppContext();

  const [isSaving, setIsSaving] = useState(false);
  
  // Form State for new item
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [destination, setDestination] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [storage, setStorage] = useState('');
  const [notes, setNotes] = useState('');
  const [requestDate, setRequestDate] = useState<Date | undefined>(new Date());

  // Editing state
  const [editingItem, setEditingItem] = useState<ItemForTransfer | null>(null);
  
  const isLoadingItems = !transferItems;

  const stagedItems = useMemo(() => {
      return transferItems.filter(item => !item.transferId);
  }, [transferItems]);

  const sortedItems = useMemo(() => {
    if (!stagedItems) return [];
    return [...stagedItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stagedItems]);
  
  const resetForm = () => {
      setModel('');
      setQuantity(1);
      setDestination('');
      setInvoiceNo('');
      setStorage('');
      setNotes('');
      setRequestDate(new Date());
  }

  const handleAddItem = () => {
    if (!model.trim() || !destination) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('provide_model_destination') });
      return;
    }
    
    setIsSaving(true);
    const newItemData: ItemForTransfer = {
        id: crypto.randomUUID(),
        model: model.trim(),
        quantity,
        destination,
        invoiceNo,
        storage,
        notes,
        requestDate: requestDate ? formatISO(requestDate) : undefined,
        transferId: null,
        createdAt: formatISO(new Date())
    };
    
    setTransferItems([...transferItems, newItemData]);
    toast({ title: t('item_added'), description: t('item_added_to_transfer_list', {model}) });
    resetForm();
    setIsSaving(false);
  };
  
  const handleUpdateItem = () => {
    if (!editingItem || !editingItem.model.trim()) return;

    setIsSaving(true);
    setTransferItems(transferItems.map(item => item.id === editingItem.id ? editingItem : item));
    toast({ title: t('item_updated'), description: t('item_changes_saved') });
    setEditingItem(null);
    setIsSaving(false);
  };

  const handleDeleteItem = (itemToDelete: ItemForTransfer) => {
    setTransferItems(transferItems.filter(item => item.id !== itemToDelete.id));
    toast({ title: t('item_removed'), description: t('item_removed_from_list', {model: itemToDelete.model}) });
  };
  
  const startEditing = (item: ItemForTransfer) => {
    setEditingItem(JSON.parse(JSON.stringify(item))); // Deep copy
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/transmit">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">{t('add_manage_items')}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>{editingItem ? t('edit_item') : t('add_new_item')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="model">{t('model_name')}</Label>
                        <Input id="model" value={editingItem ? editingItem.model : model} onChange={(e) => editingItem ? setEditingItem({...editingItem, model: e.target.value}) : setModel(e.target.value)} placeholder="e.g., Sofa 123" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('request_date')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !requestDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {requestDate ? format(requestDate, 'PPP') : <span>{t('pick_a_date')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={editingItem ? (editingItem.requestDate ? new Date(editingItem.requestDate) : new Date()) : requestDate} onSelect={(date) => editingItem ? setEditingItem({...editingItem, requestDate: date ? formatISO(date) : undefined}) : setRequestDate(date)} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">{t('quantity')}</Label>
                            <Input id="quantity" type="number" value={editingItem ? editingItem.quantity : quantity} onChange={(e) => editingItem ? setEditingItem({...editingItem, quantity: e.target.valueAsNumber}) : setQuantity(e.target.valueAsNumber)} min="1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="destination">{t('destination')}</Label>
                             <Select value={editingItem ? editingItem.destination : destination} onValueChange={(val) => editingItem ? setEditingItem({...editingItem, destination: val}) : setDestination(val)}>
                                <SelectTrigger id="destination"><SelectValue placeholder={t('select_branch')} /></SelectTrigger>
                                <SelectContent>
                                    {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNo">{t('invoice_no')}</Label>
                            <Input id="invoiceNo" value={editingItem ? editingItem.invoiceNo : invoiceNo} onChange={(e) => editingItem ? setEditingItem({...editingItem, invoiceNo: e.target.value}) : setInvoiceNo(e.target.value)} placeholder="e.g., INV-001" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storage">{t('storage')}</Label>
                             <Select value={editingItem ? editingItem.storage : storage} onValueChange={(val) => editingItem ? setEditingItem({...editingItem, storage: val}) : setStorage(val)}>
                                <SelectTrigger id="storage"><SelectValue placeholder={t('select_a_source')} /></SelectTrigger>
                                <SelectContent>
                                    {storageOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes">{t('notes')}</Label>
                        <Textarea id="notes" value={editingItem ? editingItem.notes || '' : notes} onChange={(e) => editingItem ? setEditingItem({...editingItem, notes: e.target.value}) : setNotes(e.target.value)} placeholder={t('optional_notes_about_item')} />
                    </div>
                     <div className="flex gap-2 pt-2">
                        {editingItem ? (
                            <>
                                <Button onClick={handleUpdateItem} disabled={isSaving} className="w-full">
                                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                                    {t('update_item')}
                                </Button>
                                <Button variant="outline" onClick={() => setEditingItem(null)}>{t('cancel')}</Button>
                            </>
                        ) : (
                            <Button onClick={handleAddItem} disabled={isSaving} className="w-full">
                                {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Plus className="mr-2"/>}
                                {t('add_to_list')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t('items_staged_for_transfer')}</CardTitle>
                    <CardDescription>{t('items_staged_for_transfer_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('model')}</TableHead>
                                    <TableHead>{t('quantity')}</TableHead>
                                    <TableHead>{t('destination')}</TableHead>
                                    <TableHead>{t('invoice_no')}</TableHead>
                                    <TableHead>{t('storage')}</TableHead>
                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingItems ? (
                                    <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="mx-auto animate-spin"/></TableCell></TableRow>
                                ) : sortedItems.length > 0 ? sortedItems.map((item) => (
                                    <TableRow key={item.id} className={cn(editingItem?.id === item.id && "bg-muted")}>
                                        <TableCell className="font-medium">{item.model}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.destination}</TableCell>
                                        <TableCell>{item.invoiceNo || 'N/A'}</TableCell>
                                        <TableCell>{item.storage || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => startEditing(item)}><Edit className="w-4 h-4"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            <ListPlus className="mx-auto h-12 w-12 text-muted-foreground mb-2"/>
                                            {t('no_items_staged_yet')}
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
  );
}
