
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit, Save, X, Loader2, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import type { ItemForTransfer } from '@/lib/types';
import { formatISO } from 'date-fns';

const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

export default function AddItemsPage() {
  const { toast } = useToast();
  const { transferItems, setTransferItems } = useAppContext();

  const [isSaving, setIsSaving] = useState(false);
  
  // Form State for new item
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

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
      setNotes('');
  }

  const handleAddItem = () => {
    if (!model.trim() || !destination) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a model and destination.' });
      return;
    }
    
    setIsSaving(true);
    const newItemData: ItemForTransfer = {
        id: crypto.randomUUID(),
        model: model.trim(),
        quantity,
        destination,
        notes,
        transferId: null,
        createdAt: formatISO(new Date())
    };
    
    setTransferItems([...transferItems, newItemData]);
    toast({ title: 'Item Added', description: `${model} has been added to the transfer list.` });
    resetForm();
    setIsSaving(false);
  };
  
  const handleUpdateItem = () => {
    if (!editingItem || !editingItem.model.trim()) return;

    setIsSaving(true);
    setTransferItems(transferItems.map(item => item.id === editingItem.id ? editingItem : item));
    toast({ title: 'Item Updated', description: 'Your changes have been saved.' });
    setEditingItem(null);
    setIsSaving(false);
  };

  const handleDeleteItem = (itemToDelete: ItemForTransfer) => {
    setTransferItems(transferItems.filter(item => item.id !== itemToDelete.id));
    toast({ title: 'Item Removed', description: `${itemToDelete.model} has been removed.` });
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
        <h1 className="text-2xl md:text-3xl font-bold">Add & Manage Transfer Items</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="model">Model Name</Label>
                        <Input id="model" value={editingItem ? editingItem.model : model} onChange={(e) => editingItem ? setEditingItem({...editingItem, model: e.target.value}) : setModel(e.target.value)} placeholder="e.g., Sofa 123" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" type="number" value={editingItem ? editingItem.quantity : quantity} onChange={(e) => editingItem ? setEditingItem({...editingItem, quantity: e.target.valueAsNumber}) : setQuantity(e.target.valueAsNumber)} min="1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="destination">Destination</Label>
                             <Select value={editingItem ? editingItem.destination : destination} onValueChange={(val) => editingItem ? setEditingItem({...editingItem, destination: val}) : setDestination(val)}>
                                <SelectTrigger id="destination"><SelectValue placeholder="Select branch" /></SelectTrigger>
                                <SelectContent>
                                    {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={editingItem ? editingItem.notes || '' : notes} onChange={(e) => editingItem ? setEditingItem({...editingItem, notes: e.target.value}) : setNotes(e.target.value)} placeholder="Optional notes about the item" />
                    </div>
                     <div className="flex gap-2 pt-2">
                        {editingItem ? (
                            <>
                                <Button onClick={handleUpdateItem} disabled={isSaving} className="w-full">
                                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                                    Update Item
                                </Button>
                                <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                            </>
                        ) : (
                            <Button onClick={handleAddItem} disabled={isSaving} className="w-full">
                                {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Plus className="mr-2"/>}
                                Add to List
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Items Staged for Transfer</CardTitle>
                    <CardDescription>This is the current list of items waiting to be shipped.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Destination</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingItems ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="mx-auto animate-spin"/></TableCell></TableRow>
                                ) : sortedItems.length > 0 ? sortedItems.map((item) => (
                                    <TableRow key={item.id} className={cn(editingItem?.id === item.id && "bg-muted")}>
                                        <TableCell className="font-medium">{item.model}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.destination}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.notes || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => startEditing(item)}><Edit className="w-4 h-4"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <ListPlus className="mx-auto h-12 w-12 text-muted-foreground mb-2"/>
                                            No items staged for transfer yet.
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
