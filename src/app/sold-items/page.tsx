
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit, Save, X, Loader2, FileDown, Printer, Tag, CircleHelp, Settings, Receipt, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/app-provider';
import type { SoldItemReceipt, ItemCategory, WaitingList, WaitingListItem, Item } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import withAuth from '@/hooks/withAuth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const initialNewReceipt = {
    receiptNumber: '',
    customerName: '',
    receiptDate: new Date().toISOString(),
    itemCategories: []
};

function ReceiptsManager() {
  const { t } = useTranslation();
  const { 
    receipts, setReceipts,
    isLoading
  } = useAppContext();
  const { toast } = useToast();

  const [editingReceipt, setEditingReceipt] = useState<SoldItemReceipt | null>(null);
  const [newReceipt, setNewReceipt] = useState<{receiptNumber: string, customerName: string, receiptDate: string, itemCategories: string[]}>({
      receiptNumber: '',
      customerName: '',
      receiptDate: new Date().toISOString(),
      itemCategories: []
  });
  const [categoryInput, setCategoryInput] = useState('');

  const sortedReceipts = useMemo(() => {
    if (!receipts) return [];
    return [...receipts].sort((a, b) => {
        const dateA = a.receiptDate ? parseISO(a.receiptDate).getTime() : 0;
        const dateB = b.receiptDate ? parseISO(b.receiptDate).getTime() : 0;
        return dateB - dateA;
    });
  }, [receipts]);

  const handleAddNewReceipt = () => {
    if (newReceipt.receiptNumber.length !== 4 || !/^\d{4}$/.test(newReceipt.receiptNumber)) {
      toast({ variant: 'destructive', title: t('invalid_receipt_number'), description: t('invalid_receipt_number_desc') });
      return;
    }

    const categories = categoryInput.split(',').map(c => c.trim()).filter(Boolean);
    if (categories.length === 0) {
      toast({ variant: 'destructive', title: t('no_categories'), description: t('no_categories_desc') });
      return;
    }
    
    const finalReceipt: SoldItemReceipt = {
      id: crypto.randomUUID(),
      receiptNumber: newReceipt.receiptNumber,
      receiptDate: newReceipt.receiptDate,
      customerName: newReceipt.customerName,
      itemCategories: categories,
    };

    setReceipts(prev => [...prev, finalReceipt]);
    toast({ title: t('receipt_saved'), description: t('receipt_saved_desc', {receiptNumber: newReceipt.receiptNumber}) });
    setNewReceipt(initialNewReceipt);
    setCategoryInput('');
  };
  
  const handleUpdateReceipt = () => {
      if (!editingReceipt) return;
       if (editingReceipt.receiptNumber.length !== 4 || !/^\d{4}$/.test(editingReceipt.receiptNumber)) {
          toast({ variant: 'destructive', title: t('invalid_receipt_number'), description: t('invalid_receipt_number_desc') });
          return;
      }
      if (editingReceipt.itemCategories.length === 0) {
          toast({ variant: 'destructive', title: t('no_categories'), description: t('no_categories_desc') });
          return;
      }
      setReceipts(prev => prev.map(r => r.id === editingReceipt.id ? editingReceipt : r));
      toast({ title: "Receipt Updated", description: `Receipt #${editingReceipt.receiptNumber} has been updated.` });
      setEditingReceipt(null);
  }

  const handleDeleteReceipt = (receiptId: string) => {
    setReceipts(prev => prev.filter(r => r.id !== receiptId));
    toast({ title: "Receipt Deleted", description: "The receipt has been removed." });
  };
  
  const startEditing = (receipt: SoldItemReceipt) => {
    setEditingReceipt(JSON.parse(JSON.stringify(receipt)));
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>{t('recently_saved_receipts')}</CardTitle>
            <CardDescription>Enter receipt details directly into the table below.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Loader2 className="mx-auto animate-spin" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('receipt_number')}</TableHead>
                      <TableHead>{t('receipt_date_optional')}</TableHead>
                      <TableHead>{t('customer_name_optional')}</TableHead>
                      <TableHead>{t('item_categories')}</TableHead>
                      <TableHead className="text-right w-32">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedReceipts.map(receipt => (
                      editingReceipt?.id === receipt.id ? (
                        <TableRow key={receipt.id}>
                          <TableCell><Input value={editingReceipt.receiptNumber} onChange={e => setEditingReceipt({...editingReceipt, receiptNumber: e.target.value})} maxLength={4} /></TableCell>
                          <TableCell>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        {editingReceipt.receiptDate ? format(parseISO(editingReceipt.receiptDate), 'PPP') : <span>{t('pick_a_date')}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editingReceipt.receiptDate ? parseISO(editingReceipt.receiptDate) : new Date()} onSelect={date => setEditingReceipt({...editingReceipt, receiptDate: date?.toISOString()})} initialFocus /></PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell><Input value={editingReceipt.customerName} onChange={e => setEditingReceipt({...editingReceipt, customerName: e.target.value})} /></TableCell>
                          <TableCell><Input value={editingReceipt.itemCategories.join(', ')} onChange={e => setEditingReceipt({...editingReceipt, itemCategories: e.target.value.split(',').map(c => c.trim())})} /></TableCell>
                          <TableCell className="text-right">
                              <Button size="sm" onClick={handleUpdateReceipt}><Save className="h-4 w-4 mr-2" />{t('save')}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingReceipt(null)}><X className="h-4 w-4 mr-2" />{t('cancel')}</Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={receipt.id}>
                          <TableCell className="font-semibold text-primary">#{receipt.receiptNumber}</TableCell>
                          <TableCell>{receipt.receiptDate ? format(parseISO(receipt.receiptDate), 'PPP') : 'N/A'}</TableCell>
                          <TableCell>{receipt.customerName || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {receipt.itemCategories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => startEditing(receipt)}><Edit className="h-4 w-4"/></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle><AlertDialogDescription>This will permanently delete receipt #{receipt.receiptNumber}.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteReceipt(receipt.id)}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      )
                    ))}
                  </TableBody>
                   <TableFooter>
                    <TableRow>
                      <TableCell><Input value={newReceipt.receiptNumber} onChange={e => setNewReceipt({...newReceipt, receiptNumber: e.target.value})} placeholder={t('receipt_number')} maxLength={4} dir="rtl" /></TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{newReceipt.receiptDate ? format(parseISO(newReceipt.receiptDate), 'PPP') : <span>{t('pick_a_date')}</span>}</Button></PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={parseISO(newReceipt.receiptDate)} onSelect={date => setNewReceipt({...newReceipt, receiptDate: date?.toISOString() || ''})} initialFocus /></PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell><Input value={newReceipt.customerName} onChange={e => setNewReceipt({...newReceipt, customerName: e.target.value})} placeholder={t('customer_name_optional')} dir="rtl" /></TableCell>
                      <TableCell><Input value={categoryInput} onChange={e => setCategoryInput(e.target.value)} placeholder={t('item_categories_placeholder')} dir="rtl" /></TableCell>
                      <TableCell className="text-right"><Button size="sm" onClick={handleAddNewReceipt}><Plus className="h-4 w-4 mr-2" />{t('add')}</Button></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
        </CardContent>
    </Card>
  );
}

function StockCheckDialog({ item, results, open, onClose, onMarkAvailable }: {
  item: WaitingListItem | null;
  results: Item[];
  open: boolean;
  onClose: () => void;
  onMarkAvailable: () => void;
}) {
    const { t } = useTranslation();

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('stock_check')}</DialogTitle>
                    <DialogDescription>{t('inventory_search_results_for', {itemName: item.name})}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="space-y-2">
                           <p className="text-sm text-green-600">{t('items_found_in_inventory', {count: results.length})}</p>
                           <Table>
                               <TableHeader><TableRow><TableHead>{t('model')}</TableHead><TableHead>{t('quantity')}</TableHead><TableHead>{t('location')}</TableHead></TableRow></TableHeader>
                               <TableBody>
                                   {results.map(res => (
                                       <TableRow key={res.id}>
                                           <TableCell>{res.model}</TableCell>
                                           <TableCell>{res.quantity}</TableCell>
                                           <TableCell>{res.locationId || t('na')}</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                        </div>
                    ) : (
                        <p className="py-8 text-center text-muted-foreground">{t('no_matching_items_found')}</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{t('close')}</Button>
                    {results.length > 0 && <Button onClick={onMarkAvailable}>{t('mark_as_available')}</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const initialNewItem: Omit<WaitingListItem, 'id' | 'status'> = {
  name: '',
  quantity: 1,
  notes: '',
};

function WaitingListsManager() {
  const { t } = useTranslation();
  const { waitingLists, setWaitingLists, isLoading, items: allItems } = useAppContext();
  const { toast } = useToast();

  const [selectedList, setSelectedList] = useState<WaitingList | null>(null);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<WaitingList | null>(null);
  const [editingItem, setEditingItem] = useState<WaitingListItem | null>(null);
  const [newListName, setNewListName] = useState('');
  
  const [newItem, setNewItem] = useState(initialNewItem);
  
  const [stockCheckItem, setStockCheckItem] = useState<WaitingListItem | null>(null);
  const [stockCheckResults, setStockCheckResults] = useState<Item[]>([]);

  const sortedLists = useMemo(() => {
    if (!waitingLists) return [];
    return [...waitingLists].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [waitingLists]);
  
  useEffect(() => {
    if (selectedList) {
      const currentListState = waitingLists.find(l => l.id === selectedList.id);
      if (currentListState) {
        setSelectedList(currentListState);
      } else {
        setSelectedList(null);
      }
    } else if (sortedLists.length > 0) {
      setSelectedList(sortedLists[0]);
    }
  }, [waitingLists, selectedList?.id, sortedLists]);
  
  const handleSelectList = (list: WaitingList) => {
    setSelectedList(list);
  };

  const handleSaveList = () => {
    if (editingList) {
      setWaitingLists(prev => prev.map(l => l.id === editingList.id ? { ...l, name: newListName || l.name } : l));
      toast({ title: t('list_updated'), description: t('list_updated_desc', { listName: newListName }) });
    } else {
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
  
  const handleAddNewItem = () => {
    if (!selectedList || !newItem.name.trim()) return;
    const itemToAdd: WaitingListItem = {
      id: crypto.randomUUID(),
      name: newItem.name,
      quantity: newItem.quantity,
      notes: newItem.notes,
      status: 'Pending',
    };
    const updatedItems = [...selectedList.items, itemToAdd];
    setWaitingLists(prev => prev.map(l => l.id === selectedList.id ? { ...l, items: updatedItems } : l));
    setNewItem(initialNewItem);
  };

  const handleUpdateItem = () => {
    if (!selectedList || !editingItem) return;
    const updatedItems = selectedList.items.map(item => item.id === editingItem.id ? editingItem : item);
    setWaitingLists(prev => prev.map(l => l.id === selectedList.id ? { ...l, items: updatedItems } : l));
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedList) return;
    const updatedItems = selectedList.items.filter(item => item.id !== itemId);
    setWaitingLists(prev => prev.map(l => l.id === selectedList.id ? { ...l, items: updatedItems } : l));
  };
  
  const handleUpdateStatus = (itemId: string, status: WaitingListItem['status']) => {
    if (!selectedList) return;
    const updatedItems = selectedList.items.map(item => item.id === itemId ? { ...item, status } : item);
    setWaitingLists(prev => prev.map(l => l.id === selectedList.id ? { ...l, items: updatedItems } : l));
  };
  
  const handleCheckStock = (item: WaitingListItem) => {
    const results = allItems.filter(inventoryItem =>
      inventoryItem.model.toLowerCase().includes(item.name.toLowerCase())
    );
    setStockCheckItem(item);
    setStockCheckResults(results);
  };

  const handleExportPdf = () => {
    if (!selectedList) return;
    const doc = new jsPDF();
    doc.text(selectedList.name, 14, 16);
    doc.setFontSize(10);
    doc.text(format(parseISO(selectedList.date), 'PPP'), 14, 22);
    (doc as any).autoTable({
      startY: 30,
      head: [[t('item_name'), t('quantity'), t('status'), t('notes')]],
      body: selectedList.items.map(item => [item.name, item.quantity, t(item.status?.toLowerCase() || 'pending'), item.notes || '']),
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
      head: [[t('item_name'), t('quantity'), t('status'), t('notes')]],
      body: selectedList.items.map(item => [item.name, item.quantity, t(item.status?.toLowerCase() || 'pending'), item.notes || '']),
      styles: { halign: 'center', valign: 'middle' },
      headStyles: { halign: 'center', valign: 'middle' },
    });
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };
  
  const getStatusBadgeVariant = (status?: WaitingListItem['status']) => {
    switch (status) {
        case 'Available': return 'default';
        case 'Completed': return 'outline';
        case 'Pending': default: return 'secondary';
    }
  }

  return (
    <>
      <StockCheckDialog 
        item={stockCheckItem}
        results={stockCheckResults}
        open={!!stockCheckItem}
        onClose={() => setStockCheckItem(null)}
        onMarkAvailable={() => {
          if (stockCheckItem) handleUpdateStatus(stockCheckItem.id, 'Available');
          setStockCheckItem(null);
        }}
      />
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingList ? t('edit_list_name') : t('create_new_list')}</DialogTitle>
                <DialogDescription>{t('create_new_list_desc')}</DialogDescription>
            </DialogHeader>
            <div className="py-4"><Label htmlFor="list-name">{t('list_name')}</Label><Input id="list-name" value={newListName} onChange={e => setNewListName(e.target.value)} dir="rtl" /></div>
            <DialogFooter><DialogClose asChild><Button variant="outline">{t('cancel')}</Button></DialogClose><Button onClick={handleSaveList}>{t('save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><div className="flex justify-between items-center"><CardTitle>{t('all_lists')}</CardTitle><Button size="sm" onClick={() => { setEditingList(null); setNewListName(''); setIsListDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> {t('create_new_list')}</Button></div></CardHeader>
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
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle><AlertDialogDescription>{t('confirm_delete_list', {listName: list.name})}</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteList(list.id)}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
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
                        <div><CardTitle>{selectedList.name}</CardTitle><CardDescription>{t('items_in_list_count', {count: selectedList.items.length})}</CardDescription></div>
                        <div className="flex items-center gap-2"><Button variant="outline" onClick={handlePrint} disabled={!selectedList || selectedList.items.length === 0}>{t('print')}</Button><Button variant="outline" onClick={handleExportPdf} disabled={!selectedList || selectedList.items.length === 0}><FileDown className="mr-2 h-4 w-4" />{t('export_pdf')}</Button></div>
                      </div>
                    ) : <CardTitle>{t('select_a_list')}</CardTitle>}
                </CardHeader>
                <CardContent>
                  {selectedList ? (
                    <div className="overflow-x-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead>{t('item_name')}</TableHead><TableHead>{t('quantity')}</TableHead><TableHead>{t('status')}</TableHead><TableHead>{t('notes')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {selectedList.items.map(item => (
                              editingItem?.id === item.id ? (
                                <TableRow key={item.id}>
                                  <TableCell><Input value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} dir="rtl" /></TableCell>
                                  <TableCell><Input type="number" value={editingItem.quantity} onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})} /></TableCell>
                                  <TableCell>{/* Status not editable here */}</TableCell>
                                  <TableCell><Textarea value={editingItem.notes} onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})} dir="rtl"/></TableCell>
                                  <TableCell className="text-right"><Button size="sm" onClick={handleUpdateItem}><Save className="h-4 w-4 mr-2" />{t('save')}</Button><Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}><X className="h-4 w-4 mr-2" />{t('cancel')}</Button></TableCell>
                                </TableRow>
                              ) : (
                              <TableRow key={item.id}>
                                <TableCell dir="rtl">{item.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell><Select value={item.status || 'Pending'} onValueChange={(value: 'Pending' | 'Available' | 'Completed') => handleUpdateStatus(item.id, value)}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue><Badge variant={getStatusBadgeVariant(item.status)}>{t(item.status?.toLowerCase() || 'pending')}</Badge></SelectValue></SelectTrigger><SelectContent><SelectItem value="Pending">{t('pending')}</SelectItem><SelectItem value="Available">{t('available')}</SelectItem><SelectItem value="Completed">{t('completed')}</SelectItem></SelectContent></Select></TableCell>
                                <TableCell dir="rtl">{item.notes || t('na')}</TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleCheckStock(item)}><Search className="w-4 h-4 text-blue-500"/></Button><Button variant="ghost" size="icon" onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}><Edit className="w-4 h-4"/></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button></TableCell>
                              </TableRow>
                              )
                            ))}
                          </TableBody>
                           <TableFooter>
                                <TableRow>
                                    <TableCell><Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder={t('item_name')} dir="rtl" /></TableCell>
                                    <TableCell><Input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})} /></TableCell>
                                    <TableCell><Badge variant="secondary">{t('pending')}</Badge></TableCell>
                                    <TableCell><Textarea value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} placeholder={t('notes_optional')} dir="rtl" /></TableCell>
                                    <TableCell className="text-right"><Button size="sm" onClick={handleAddNewItem}><Plus className="h-4 w-4 mr-2" />{t('add')}</Button></TableCell>
                                </TableRow>
                           </TableFooter>
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
                <TabsTrigger value="waiting-lists">{t('backorders_waiting_list')}</TabsTrigger>
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
