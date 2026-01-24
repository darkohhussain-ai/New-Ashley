
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit, Save, X, Loader2, FileDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/app-provider';
import type { WaitingList, WaitingListItem } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function SoldItemsCheckPage() {
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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
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

      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/items"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{t('sold_items_check')}</h1>
        </div>
        <Button onClick={() => { setEditingList(null); setNewListName(''); setIsListDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t('create_new_list')}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>{t('all_lists')}</CardTitle></CardHeader>
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
    </div>
  );
}
