
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, File, User, Calendar as CalendarIcon, Building, Loader2, CheckCircle, AlertTriangle, ChevronRight, Save, SortAlphaDown, SortAlphaUp, SortNumericDown, SortNumericUp } from 'lucide-react';
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
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Employee = { id: string; name: string; };
type StorageLocation = { id: string; name: string; warehouseType: 'Ashley' | 'Huana'; };

type ImportedItem = {
  model: string;
  quantity: number;
  notes?: string;
  storageStatus?: 'Correct' | 'Less' | 'More';
  modelCondition?: 'Wrapped' | 'Damaged';
  quantityPerCondition?: number;
  locationId?: string;
};

type SortDirection = 'asc' | 'desc';
type SortType = 'alpha' | 'numeric';

const sources = ["Showroom", "Ashley Store", "Huana Store"];

export default function ImportPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1 State
  const [file, setFile] = useState<File | null>(null);
  const [storekeeperId, setStorekeeperId] = useState('');
  const [source, setSource] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Step 2 State
  const [items, setItems] = useState<ImportedItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortType, setSortType] = useState<SortType>('alpha');

  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);
  
  const locationsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'storage_locations') : null), [firestore]);
  const { data: locations, isLoading: isLoadingLocations } = useCollection<StorageLocation>(locationsRef);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && selectedFile.type !== 'application/vnd.ms-excel') {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload an XLSX or XLS file.' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleNextStep = async () => {
    if (!file || !storekeeperId || !source || !date || !categoryName) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields and select a file.' });
      return;
    }
    
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const parsedItems: ImportedItem[] = json
          .map(row => ({
            model: String(row.Model || row.model || ''),
            quantity: Number(row.Quantity || row.quantity || 0),
            notes: String(row.Notes || row.notes || ''),
          }))
          .filter(item => item.model && item.quantity > 0);

        if (parsedItems.length === 0) {
          toast({ variant: 'destructive', title: 'No Data Found', description: 'The Excel file seems to be empty or not formatted correctly. Ensure it has "Model" and "Quantity" columns with data.' });
          setIsProcessing(false);
          return;
        }

        setItems(parsedItems);
        setStep(2);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not read the Excel file. Please check the format.' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };
  
  const handleItemChange = (index: number, field: keyof ImportedItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  }
  
  const filteredLocations = (warehouseType: 'Ashley' | 'Huana') => {
      return locations?.filter(l => l.warehouseType === warehouseType) ?? [];
  }
  
  const getWarehouseTypeFromSource = (source: string) => {
      if (source === 'Ashley Store') return 'Ashley';
      if (source === 'Huana Store') return 'Huana';
      return null;
  }

  const handleSave = async () => {
      if (!firestore) return;
      setIsProcessing(true);
      
      const fileId = doc(collection(firestore, 'dummy')).id;

      try {
        const batch = writeBatch(firestore);
        
        const fileData = {
          id: fileId,
          storekeeperId,
          storageName: fileName,
          categoryName,
          date: Timestamp.fromDate(date!),
          source,
          type: 'imported'
        };
        const fileRef = doc(firestore, 'excel_files', fileId);
        batch.set(fileRef, fileData);

        sortedItems.forEach(item => {
            const itemId = doc(collection(firestore, 'dummy')).id;
            const itemRef = doc(firestore, `excel_files/${fileId}/items`, itemId);
            const itemData = { ...item, id: itemId, fileId };
            batch.set(itemRef, itemData);
        });

        await batch.commit();

        toast({ title: 'Success!', description: 'The imported file and its items have been saved.' });
        router.push('/archive');
      } catch (error) {
          console.error("Error saving data:", error);
          toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save the data to the database.' });
          setIsProcessing(false);
      }
  };
  
  const warehouseType = getWarehouseTypeFromSource(source);

  const sortedItems = useMemo(() => {
    const itemsCopy = [...items];
    itemsCopy.sort((a, b) => {
        if (sortType === 'alpha') {
            return sortDirection === 'asc' ? a.model.localeCompare(b.model) : b.model.localeCompare(a.model);
        } else { // numeric
            const numA = parseInt(a.model.replace(/[^0-9]/g, ''), 10) || 0;
            const numB = parseInt(b.model.replace(/[^0-9]/g, ''), 10) || 0;
            return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
    });
    return itemsCopy;
  }, [items, sortDirection, sortType]);

  const toggleSort = (type: SortType) => {
      if (sortType === type) {
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortType(type);
          setSortDirection('asc');
      }
  }

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
          <h1 className="text-2xl md:text-3xl font-bold">Import Excel File</h1>
        </div>
      </header>

      {step === 1 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Step 1: Upload Details</CardTitle>
            <CardDescription>Provide the file and initial details for the import.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Excel File (.xlsx, .xls)</Label>
              <Input id="file-upload" type="file" onChange={handleFileChange} accept=".xlsx,.xls" />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <File className="w-4 h-4" />
                  <span>{file.name}</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="storekeeper">Storekeeper / Placement Employee</Label>
                    <Select onValueChange={setStorekeeperId} value={storekeeperId}>
                        <SelectTrigger id="storekeeper">
                        <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                        {isLoadingEmployees ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                            employees?.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))
                        )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="source">Source / Location</Label>
                    <Select onValueChange={setSource} value={source}>
                        <SelectTrigger id="source">
                        <SelectValue placeholder="Select a source" />
                        </SelectTrigger>
                        <SelectContent>
                        {sources.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Living Room Furniture" />
            </div>
            
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button onClick={handleNextStep} disabled={isProcessing || !file || !storekeeperId || !source || !date || !categoryName} className="w-full">
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <ChevronRight className="mr-2" />}
              Next
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Step 2: Review and Complete Data</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                        <span>File: <span className="font-semibold text-primary">{fileName}</span></span>
                        <span>Storekeeper: <span className="font-semibold text-primary">{employees?.find(e => e.id === storekeeperId)?.name}</span></span> 
                        <span>Category: <span className="font-semibold text-primary">{categoryName}</span></span> 
                        <span>Date: <span className="font-semibold text-primary">{date ? format(date, 'PPP') : ''}</span></span>
                    </CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle>Review Items ({items.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleSort('alpha')}>
                                {sortType === 'alpha' && sortDirection === 'asc' ? <SortAlphaDown className="w-4 h-4 mr-2" /> : <SortAlphaUp className="w-4 h-4 mr-2" />}
                                Sort A-Z
                            </Button>
                             <Button variant="outline" size="sm" onClick={() => toggleSort('numeric')}>
                                {sortType === 'numeric' && sortDirection === 'asc' ? <SortNumericDown className="w-4 h-4 mr-2" /> : <SortNumericUp className="w-4 h-4 mr-2" />}
                                Sort 1-9
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Model</TableHead>
                                    <TableHead className="w-[80px]">Qty</TableHead>
                                    <TableHead className="w-[150px]">Storage Status</TableHead>
                                    <TableHead className="w-[150px]">Model Condition</TableHead>
                                    <TableHead className="w-[100px]">Qty / Condition</TableHead>
                                    <TableHead className="w-[180px]">Location</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.model}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                            <Select value={item.storageStatus} onValueChange={v => handleItemChange(index, 'storageStatus', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Correct">Correct</SelectItem>
                                                    <SelectItem value="Less">Less</SelectItem>
                                                    <SelectItem value="More">More</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={item.modelCondition} onValueChange={v => handleItemChange(index, 'modelCondition', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Wrapped">Wrapped</SelectItem>
                                                    <SelectItem value="Damaged">Damaged</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.quantityPerCondition ?? ''} onChange={e => handleItemChange(index, 'quantityPerCondition', e.target.valueAsNumber)} />
                                        </TableCell>
                                        <TableCell>
                                            <Select value={item.locationId} onValueChange={v => handleItemChange(index, 'locationId', v)} disabled={!warehouseType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={warehouseType ? "Select location..." : "Select source first"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                {warehouseType && filteredLocations(warehouseType).map(loc => (
                                                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input value={item.notes ?? ''} onChange={e => handleItemChange(index, 'notes', e.target.value)} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <div className="mt-8 flex justify-end gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleSave} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                  Save & Archive
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
