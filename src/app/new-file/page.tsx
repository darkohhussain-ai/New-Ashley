'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, formatISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/app-provider';
import type { NewItem, StorageLocation } from '@/lib/types';


const sources = ["Showroom", "Ashley Store", "Huana Store"];

export default function NewFilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { employees, locations, setExcelFiles, setItems: setAllItems } = useAppContext();

  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [storageName, setStorageName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [storekeeperId, setStorekeeperId] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<NewItem[]>([]);
  
  // Filter states
  const [filterHuanaWarehouse, setFilterHuanaWarehouse] = useState('All');
  const [filterHuanaFloor, setFilterHuanaFloor] = useState('All');
  const [filterAshleyFloor, setFilterAshleyFloor] = useState('All');
  const [filterAshleyArea, setFilterAshleyArea] = useState('All');

  const addNewItem = () => {
    setItems(prev => [...prev, { tempId: Date.now(), model: '', quantity: 1, notes: '', locationId: '' }]);
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
      if (!storageName || !categoryName || !storekeeperId || !source || !date || items.length === 0) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all file details and add at least one item.' });
        return;
      }
      setIsSaving(true);
      
      const fileId = crypto.randomUUID();

      const fileData = {
        id: fileId,
        storekeeperId,
        storageName,
        categoryName,
        date: formatISO(date),
        source,
        type: 'new' as const
      };
      
      const newItems = items.map(item => {
          const { tempId, ...itemData } = item;
          return { ...itemData, id: crypto.randomUUID(), fileId: fileId };
      });

      setExcelFiles(prev => [...prev, fileData]);
      setAllItems(prev => [...prev, ...newItems]);

      toast({ title: 'Success!', description: `File "${storageName}" and its items have been saved.` });
      router.push('/archive');
      setIsSaving(false);
  };
  
  const getWarehouseTypeFromSource = (source?: string) => {
      if (source === 'Ashley Store') return 'Ashley';
      if (source === 'Huana Store') return 'Huana';
      return null;
  }
  const warehouseType = getWarehouseTypeFromSource(source);
  
  const filteredLocations = useMemo(() => {
    if (!locations || !warehouseType) return [];
    
    let filtered = locations.filter(l => l.warehouseType === warehouseType);

    if (warehouseType === 'Huana') {
        if(filterHuanaWarehouse !== 'All') {
            filtered = filtered.filter(l => l.name.startsWith(`H-${filterHuanaWarehouse}-`));
        }
        if(filterHuanaFloor !== 'All') {
            filtered = filtered.filter(l => l.name.startsWith(`H-${filterHuanaWarehouse}-${filterHuanaFloor}-`));
        }
    }
    
    if(warehouseType === 'Ashley') {
        if(filterAshleyFloor !== 'All') {
            filtered = filtered.filter(l => l.name.startsWith(`A-${filterAshleyFloor}-`));
        }
        if(filterAshleyArea !== 'All') {
            filtered = filtered.filter(l => l.name.startsWith(`A-3-${filterAshleyArea}-`));
        }
    }
    
    return filtered.sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  }, [locations, warehouseType, filterHuanaWarehouse, filterHuanaFloor, filterAshleyFloor, filterAshleyArea]);


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
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Living Room Furniture" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="storekeeper">Storekeeper</Label>
                        <Select onValueChange={setStorekeeperId} value={storekeeperId}>
                            <SelectTrigger id="storekeeper"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                            <SelectContent>
                            {
                                employees?.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)
                            }
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
                            <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

             {warehouseType && (
                <Card>
                    <CardHeader>
                        <CardTitle>Location Filters</CardTitle>
                        <CardDescription>Filter the locations available for items.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-4">
                        {warehouseType === 'Huana' && (
                            <>
                                <Select value={filterHuanaWarehouse} onValueChange={setFilterHuanaWarehouse}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Huana Warehouse..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Huana Warehouses</SelectItem>
                                        {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>Warehouse {n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {filterHuanaWarehouse !== 'All' && (
                                    <Select value={filterHuanaFloor} onValueChange={setFilterHuanaFloor}>
                                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Floor..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Floors</SelectItem>
                                            {[1, 2].map(n => <SelectItem key={n} value={String(n)}>Floor {n}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            </>
                        )}
                        {warehouseType === 'Ashley' && (
                            <>
                                <Select value={filterAshleyFloor} onValueChange={setFilterAshleyFloor}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Floor..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Floors</SelectItem>
                                        <SelectItem value="4">Floor 4</SelectItem>
                                        <SelectItem value="3">Floor 3</SelectItem>
                                    </SelectContent>
                                </Select>
                                {filterAshleyFloor === '3' && (
                                    <Select value={filterAshleyArea} onValueChange={setFilterAshleyArea}>
                                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Area..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Areas on Floor 3</SelectItem>
                                            <SelectItem value="1">Area 1</SelectItem>
                                            <SelectItem value="O">Area 2 (Office)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Items ({items.length})</CardTitle>
                    <Button variant="outline" onClick={addNewItem}><Plus className="mr-2 h-4 w-4"/> Add Item</Button>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="w-[100px]">Quantity</TableHead>
                                    <TableHead className="w-[200px]">Location</TableHead>
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
                                            <Select 
                                                value={item.locationId} 
                                                onValueChange={v => handleItemChange(index, 'locationId', v === 'none' ? '' : v)}
                                                disabled={!warehouseType}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={warehouseType ? "Select..." : "Set source"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {filteredLocations.map(loc => (
                                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
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
