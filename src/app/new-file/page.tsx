
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type Employee = { id: string; name: string; };

type NewItem = {
  tempId: number;
  model: string;
  quantity: number;
  notes: string;
};

const sources = ["Showroom", "Ashley Store", "Huana Store"];

export default function NewFilePage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [storageName, setStorageName] = useState('');
  const [storekeeperId, setStorekeeperId] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<NewItem[]>([]);

  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);

  const addNewItem = () => {
    setItems(prev => [...prev, { tempId: Date.now(), model: '', quantity: 1, notes: '' }]);
  };
  
  const handleItemChange = (index: number, field: keyof NewItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const removeItem = (tempId: number) => {
    setItems(prev => prev.filter(item => item.tempId !== tempId));
  };
  
  const handleSave = async () => {
      if (!firestore || !storageName || !storekeeperId || !source || !date || items.length === 0) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all file details and add at least one item.' });
        return;
      }
      setIsSaving(true);
      
      const fileId = doc(collection(firestore, 'dummy')).id;

      try {
        const batch = writeBatch(firestore);
        
        const fileData = {
          id: fileId,
          storekeeperId,
          storageName,
          date: Timestamp.fromDate(date!),
          source,
          type: 'new'
        };
        const fileRef = doc(firestore, 'excel_files', fileId);
        batch.set(fileRef, fileData);

        items.forEach(item => {
            const { tempId, ...itemData } = item;
            const itemId = doc(collection(firestore, 'dummy')).id;
            const itemRef = doc(firestore, `excel_files/${fileId}/items`, itemId);
            const finalItemData = { ...itemData, id: itemId, fileId };
            batch.set(itemRef, finalItemData);
        });

        await batch.commit();

        toast({ title: 'Success!', description: `File "${storageName}" and its items have been saved.` });
        router.push('/archive');
      } catch (error) {
          console.error("Error saving data:", error);
          toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save the data to the database.' });
          setIsSaving(false);
      }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/items">
              <ArrowLeft />
              <span className="sr-only">Back to Placement & Storage</span>
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">New Excel File</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" />}
            Save File
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>File Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="storage-name">Storage Name</Label>
                        <Input id="storage-name" value={storageName} onChange={(e) => setStorageName(e.target.value)} placeholder="e.g. Q1 Inventory Check" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="storekeeper">Storekeeper</Label>
                        <Select onValueChange={setStorekeeperId} value={storekeeperId}>
                            <SelectTrigger id="storekeeper"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                            <SelectContent>
                            {isLoadingEmployees ? (
                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                            ) : (
                                employees?.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)
                            )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="source">Source</Label>
                        <Select onValueChange={setSource} value={source}>
                            <SelectTrigger id="source"><SelectValue placeholder="Select a source" /></SelectTrigger>
                            <SelectContent>
                            {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <Calendar className="mr-2 h-4 w-4" />
                                {date ? format(date, 'PPP') : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Items</CardTitle>
                    <Button variant="outline" onClick={addNewItem}><Plus className="mr-2 h-4 w-4"/> Add Item</Button>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="w-[100px]">Quantity</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length > 0 ? items.map((item, index) => (
                                    <TableRow key={item.tempId}>
                                        <TableCell>
                                            <Input value={item.model} onChange={e => handleItemChange(index, 'model', e.target.value)} placeholder="Item model" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.valueAsNumber)} min="1" />
                                        </TableCell>
                                        <TableCell>
                                            <Textarea value={item.notes} onChange={e => handleItemChange(index, 'notes', e.target.value)} placeholder="Optional notes..."/>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.tempId)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No items added yet.
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
