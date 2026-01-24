'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit, Save, X, Loader2, FileDown, Printer, Tag, CircleHelp, Settings, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/app-provider';
import type { SoldItemReceipt, ItemCategory, WaitingList, WaitingListItem } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import withAuth from '@/hooks/withAuth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ReceiptsManager() {
  const { t } = useTranslation();
  const { 
    receipts, setReceipts,
    itemCategories, setItemCategories,
    isLoading
  } = useAppContext();
  const { toast } = useToast();

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<SoldItemReceipt | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');

  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState<Date | undefined>(new Date());
  const [customerName, setCustomerName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');


  const sortedReceipts = useMemo(() => {
    if (!receipts) return [];
    return [...receipts].sort((a, b) => {
        const dateA = a.receiptDate ? parseISO(a.receiptDate).getTime() : 0;
        const dateB = b.receiptDate ? parseISO(b.receiptDate).getTime() : 0;
        return dateB - dateA;
    });
  }, [receipts]);

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) return;
    if (itemCategories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
        toast({ title: "Duplicate Category", description: "This category already exists.", variant: 'destructive' });
        return;
    }
    const newCategory: ItemCategory = { id: crypto.randomUUID(), name: newCategoryName.trim() };
    setItemCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setItemCategories(prev => prev.filter(c => c.id !== categoryId));
  };
  
  const handleSaveReceipt = () => {
    if (receiptNumber.length !== 4 || !/^\d{4}$/.test(receiptNumber)) {
      toast({ variant: 'destructive', title: t('invalid_receipt_number'), description: t('invalid_receipt_number_desc') });
      return;
    }
    if (selectedCategories.length === 0) {
      toast({ variant: 'destructive', title: t('no_categories'), description: t('no_categories_desc') });
      return;
    }
    
    if (editingReceipt) {
      const updatedReceipt: SoldItemReceipt = {
        ...editingReceipt,
        receiptNumber,
        receiptDate: receiptDate?.toISOString(),
        customerName,
        itemCategories: selectedCategories,
      };
      setReceipts(prev => prev.map(r => r.id === editingReceipt.id ? updatedReceipt : r));
      toast({ title: "Receipt Updated", description: `Receipt #${receiptNumber} has been updated.` });
    } else {
      const newReceipt: SoldItemReceipt = {
        id: crypto.randomUUID(),
        receiptNumber,
        receiptDate: receiptDate?.toISOString(),
        customerName,
        itemCategories: selectedCategories,
      };
      setReceipts(prev => [...prev, newReceipt]);
      toast({ title: t('receipt_saved'), description: t('receipt_saved_desc', {receiptNumber}) });
    }

    setIsReceiptDialogOpen(false);
    setEditingReceipt(null);
    resetReceiptForm();
  };

  const handleDeleteReceipt = (receiptId: string) => {
    setReceipts(prev => prev.filter(r => r.id !== receiptId));
    toast({ title: "Receipt Deleted", description: "The receipt has been removed." });
  };
  
  const resetReceiptForm = () => {
    setReceiptNumber('');
    setReceiptDate(new Date());
    setCustomerName('');
    setSelectedCategories([]);
    setNewTag('');
  };
  
  const handleOpenReceiptDialog = (receipt: SoldItemReceipt | null) => {
    if (receipt) {
      setEditingReceipt(receipt);
      setReceiptNumber(receipt.receiptNumber);
      setReceiptDate(receipt.receiptDate ? parseISO(receipt.receiptDate) : new Date());
      setCustomerName(receipt.customerName || '');
      setSelectedCategories(receipt.itemCategories);
    } else {
      setEditingReceipt(null);
      resetReceiptForm();
    }
    setIsReceiptDialogOpen(true);
  };
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!selectedCategories.includes(newTag.trim())) {
        setSelectedCategories([...selectedCategories, newTag.trim()]);
      }
      setNewTag('');
    }
  };
  
  const removeCategoryFromSelection = (catToRemove: string) => {
    setSelectedCategories(selectedCategories.filter(cat => cat !== catToRemove));
  };
  
  const getCategoryName = (categoryId: string) => {
      return itemCategories.find(c => c.id === categoryId)?.name || categoryId;
  };

  return (
    <>
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('manage_categories')}</DialogTitle>
                <DialogDescription>Add or remove item categories used for receipts.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="flex gap-2">
                    <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder={t('new_category_name')} />
                    <Button onClick={handleSaveCategory}>{t('add')}</Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {itemCategories.length > 0 ? itemCategories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                            <span>{cat.name}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    )) : <p className="text-sm text-center text-muted-foreground py-4">{t('no_categories_yet')}</p>}
                </div>
            </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isReceiptDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingReceipt(null); setIsReceiptDialogOpen(isOpen); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReceipt ? "Edit Receipt" : t('new_receipt')}</DialogTitle>
              <DialogDescription>{editingReceipt ? `Editing receipt #${editingReceipt.receiptNumber}`: t('new_receipt_desc')}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt-num">{t('receipt_number')}</Label>
                    <Input id="receipt-num" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} placeholder="e.g., 1234" maxLength={4} />
                  </div>
                  <div className="space-y-2">
                      <Label>{t('receipt_date_optional')}</Label>
                      <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{receiptDate ? format(receiptDate, 'PPP') : <span>{t('pick_a_date')}</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={receiptDate} onSelect={setReceiptDate} initialFocus /></PopoverContent></Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-name">{t('customer_name_optional')}</Label>
                  <Input id="customer-name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t('enter_customer_name')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('item_categories')}</Label>
                  <div className="p-2 border rounded-md min-h-[40px] space-x-1 space-y-1">
                      {selectedCategories.map(cat => (
                          <Badge key={cat} variant="secondary" className="text-base">
                              {getCategoryName(cat)}
                              <button onClick={() => removeCategoryFromSelection(cat)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </button>
                          </Badge>
                      ))}
                      <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={handleAddTag} placeholder={t('item_categories_placeholder')} className="inline-flex w-auto bg-transparent border-none focus-visible:ring-0 shadow-none h-6 p-1"/>
                  </div>
                   <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground"><CircleHelp className="w-4 h-4 mr-1"/>Show available categories</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <h4 className="font-medium text-sm mb-2">{t('available_categories')}</h4>
                            <div className="space-x-1 space-y-1">
                                {itemCategories.map(cat => (
                                    <Badge key={cat.id} variant="outline" onClick={() => !selectedCategories.includes(cat.id) && setSelectedCategories([...selectedCategories, cat.id])} className="cursor-pointer">
                                        {cat.name}
                                    </Badge>
                                ))}
                            </div>
                        </PopoverContent>
                   </Popover>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">{t('cancel')}</Button></DialogClose>
                <Button onClick={handleSaveReceipt}>{t('save_receipt')}</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}><Settings className="mr-2 h-4 w-4"/> {t('manage_categories')}</Button>
        <Button onClick={() => handleOpenReceiptDialog(null)}><Plus className="mr-2 h-4 w-4"/> {t('new_receipt')}</Button>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>{t('recently_saved_receipts')}</CardTitle>
          </CardHeader>
          <CardContent>
              {isLoading ? <Loader2 className="mx-auto animate-spin" /> : (
                <div className="space-y-4">
                  {sortedReceipts.length > 0 ? sortedReceipts.map(receipt => (
                    <div key={receipt.id} className="p-4 border rounded-lg flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-primary flex items-center gap-2"><Receipt className="w-5 h-5"/> #{receipt.receiptNumber}</p>
                            <p className="text-sm text-muted-foreground">{receipt.receiptDate ? format(parseISO(receipt.receiptDate), 'PPP') : ''}</p>
                            <p className="text-sm mt-1">{receipt.customerName}</p>
                            <div className="mt-2 space-x-1 space-y-1">
                                {receipt.itemCategories.map(catId => <Badge key={catId} variant="secondary">{getCategoryName(catId)}</Badge>)}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenReceiptDialog(receipt)}><Edit className="h-4 w-4"/></Button>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete receipt #{receipt.receiptNumber}.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteReceipt(receipt.id)}>{t('delete')}</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                  )) : (
                      <div className="text-center py-16 border-2 border-dashed rounded-lg">
                          <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-medium">{t('no_receipts_found')}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{t('no_receipts_found_desc')}</p>
                      </div>
                  )}
                </div>
              )}
          </CardContent>
      </Card>
    </>
  );
}

function WaitingListsManager() {
  const { t } = useTranslation();
  const { waitingLists, setWaitingLists, isLoading } = useAppContext();
  const { toast } = useToast();

  const [selectedList, setSelectedList] = useState<WaitingList | null>(null);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<WaitingList | null>(null);
  const [editingItem, setEditingItem] = useState<WaitingListItem | null>(null);
  const [newListName, setNewListName] = useState('');
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemNotes, setNewItemNotes] = useState('');

  const sortedLists = useMemo(() => {
    if (!waitingLists) return [];
    return [...waitingLists].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [waitingLists]);
  
  const handleSelectList = (list: WaitingList) => {
    setSelectedList(list);
  };

  const handleSaveList = () => {
    if (editingList) { // Update existing
      setWaitingLists(prev => prev.map(l => l.id === editingList.id ? { ...l, name: newListName || l.name } : l));
      toast({ title: t('list_updated'), description: t('list_updated_desc', { listName: newListName }) });
    } else { // Create new
      const newList: WaitingList = {
        id: crypto.randomUUID(),
        name: newListName,
        date: new Date().toISOString(),
        items: [],
      };
      setWaitingLists(prev => [...prev, newList]);
      toast({ title: t('list_created'), description: t('list_created_desc', { listName: newListName }) });
    }
    setIsListDialogOpen(false);
    setNewListName('');
    setEditingList(null);
  };

  const handleDeleteList = (listId: string) => {
    setWaitingLists(prev => prev.filter(l => l.id !== listId));
    if (selectedList?.id === listId) {
      setSelectedList(null);
    }
    toast({ title: t('list_deleted'), description: t('list_deleted_desc') });
  };
  
  const handleSaveItem = () => {
    if (!selectedList) return;

    if (editingItem) { // Update
      const updatedItems = selectedList.items.map(item => item.id === editingItem.id ? { ...item, name: newItemName, quantity: newItemQty, notes: newItemNotes } : item);
      setWaitingLists(prev => prev.map(l => l.id === selectedList.id ? { ...l, items: updatedItems } : l));
      setSelectedList(prev => prev ? { ...prev, items: updatedItems } : null);
    } else { // Add new
      const newItem: WaitingListItem = {
        id: crypto.randomUUID(),
        name: newItemName,
        quantity: newItemQty,
        notes: newItemNotes,
      };
      const updatedItems = [...selectedList.items, newItem];
      setWaitingLists(prev => prev.map(l => l.id === selectedList.id ? { ...l, items: updatedItems } : l));
      setSelectedList(prev => prev ? { ...prev, items: updatedItems } : null);
    }

    setIsItemDialogOpen(false);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemNotes('');
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedList) return;
    const updatedItems = selectedList.items.filter(item => item.id !== itemId);
    setWaitingLists(prev => prev.map(l => l.id === selectedList.id ? { ...l, items: updatedItems } : l));
    setSelectedList(prev => prev ? { ...prev, items: updatedItems } : null);
  };

  const handleExportPdf = () => {
    if (!selectedList) return;

    const doc = new jsPDF();
    doc.text(selectedList.name, 14, 16);
    doc.setFontSize(10);
    doc.text(format(parseISO(selectedList.date), 'PPP'), 14, 22);

    (doc as any).autoTable({
      startY: 30,
      head: [[t('item_name'), t('quantity'), t('notes')]],
      body: selectedList.items.map(item => [item.name, item.quantity, item.notes || '']),
      styles: { halign: 'center', valign: 'middle' },
      headStyles: { halign: 'center', valign: 'middle' },
    });

    doc.save(`${selectedList.name}.pdf`);
  };
  
  const handlePrint = () => {
    if (!selectedList) return;
    const doc = new jsPDF();
    doc.text(selectedList.name, 14, 16);
    doc.setFontSize(10);
    doc.text(format(parseISO(selectedList.date), 'PPP'), 14, 22);

    (doc as any).autoTable({
      startY: 30,
      head: [[t('item_name'), t('quantity'), t('notes')]],
      body: selectedList.items.map(item => [item.name, item.quantity, item.notes || '']),
      styles: { halign: 'center', valign: 'middle' },
      headStyles: { halign: 'center', valign: 'middle' },
    });
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <>
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingList ? t('edit_list_name') : t('create_new_list')}</DialogTitle>
                <DialogDescription>{t('create_new_list_desc')}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="list-name">{t('list_name')}</Label>
              <Input id="list-name" value={newListName} onChange={e => setNewListName(e.target.value)} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">{t('cancel')}</Button></DialogClose>
                <Button onClick={handleSaveList}>{t('save')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {selectedList && (
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingItem ? t('edit_item') : t('add_item_to_list', {listName: selectedList.name})}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="item-name">{t('item_name')}</Label>
                        <Input id="item-name" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="item-qty">{t('quantity')}</Label>
                        <Input id="item-qty" type="number" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value) || 1)} min="1" />
                    </div>
                    <div>
                        <Label htmlFor="item-notes">{t('notes')}</Label>
                        <Textarea id="item-notes" value={newItemNotes} onChange={e => setNewItemNotes(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">{t('cancel')}</Button></DialogClose>
                    <Button onClick={handleSaveItem}>{t('save_item')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('all_lists')}</CardTitle>
                 <Button size="sm" onClick={() => { setEditingList(null); setNewListName(''); setIsListDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> {t('create_new_list')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto">
              {isLoading ? <Loader2 className="mx-auto animate-spin" /> : (
                <div className="space-y-2">
                  {sortedLists.map(list => (
                    <div key={list.id} onClick={() => handleSelectList(list)} className={`p-3 rounded-lg cursor-pointer border ${selectedList?.id === list.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
                      <div className="flex justify-between items-center">
                        <p className="font-semibold">{list.name}</p>
                        <div className="flex items-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingList(list); setNewListName(list.name); setIsListDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                  <AlertDialogDescription>{t('confirm_delete_list', {listName: list.name})}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteList(list.id)}>{t('delete')}</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{format(parseISO(list.date), 'PPP')}</p>
                    </div>
                  ))}
                  {sortedLists.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_lists_created')}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    {selectedList ? (
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{selectedList.name}</CardTitle>
                          <CardDescription>{t('items_in_list_count', {count: selectedList.items.length})}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handlePrint} disabled={!selectedList || selectedList.items.length === 0}>{t('print')}</Button>
                            <Button variant="outline" onClick={handleExportPdf} disabled={!selectedList || selectedList.items.length === 0}><FileDown className="mr-2 h-4 w-4" />{t('export_pdf')}</Button>
                            <Button onClick={() => { setEditingItem(null); setNewItemName(''); setNewItemQty(1); setNewItemNotes(''); setIsItemDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" />{t('add_item')}
                            </Button>
                        </div>
                      </div>
                    ) : (
                      <CardTitle>{t('select_a_list')}</CardTitle>
                    )}
                </CardHeader>
                <CardContent>
                  {selectedList ? (
                    <div className="overflow-x-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead>{t('item_name')}</TableHead><TableHead>{t('quantity')}</TableHead><TableHead>{t('notes')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {selectedList.items.map(item => (
                              <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.notes || t('na')}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setNewItemName(item.name); setNewItemQty(item.quantity); setNewItemNotes(item.notes || ''); setIsItemDialogOpen(true); }}><Edit className="w-4 h-4"/></Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                         {selectedList.items.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_items_in_this_list')}</p>}
                    </div>
                  ) : <p className="text-center text-muted-foreground py-16">{t('select_list_to_view_items')}</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}

const SoldItemsCheckPage = () => {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/items"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">{t('sold_items_check')}</h1>
                </div>
            </header>

            <Tabs defaultValue="receipts" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="receipts">{t('receipts')}</TabsTrigger>
                <TabsTrigger value="waiting-lists">{t('waiting_lists')}</TabsTrigger>
                </TabsList>
                <TabsContent value="receipts" className="mt-6">
                    <ReceiptsManager />
                </TabsContent>
                <TabsContent value="waiting-lists" className="mt-6">
                    <WaitingListsManager />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default withAuth(SoldItemsCheckPage);
