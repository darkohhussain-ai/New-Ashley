
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, File, CheckCircle, Save } from 'lucide-react';
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

type Employee = { id: string; name: string; };

type ImportedItem = {
  model: string;
  quantity: number;
  notes?: string;
};

const sources = ["Showroom", "Ashley Store", "Huana Store"];

export default function ImportPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [storekeeperId, setStorekeeperId] = useState('');
  const [source, setSource] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);
  
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

  const handleSaveAndContinue = async () => {
    if (!firestore || !file || !storekeeperId || !source || !date || !categoryName) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields and select a file.' });
      return;
    }
    
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];

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

      // Now save everything to Firestore in chunks
      const fileId = doc(collection(firestore, 'dummy')).id;
      
      const fileData = {
        id: fileId,
        storekeeperId,
        storageName: file.name,
        categoryName,
        date: Timestamp.fromDate(date!),
        source,
        type: 'imported' as const
      };
      const fileRef = doc(firestore, 'excel_files', fileId);
      
      // We can set the main file doc first
      await writeBatch(firestore).set(fileRef, fileData).commit();

      // Then batch the items
      const chunkSize = 400; // Firestore batch writes can have up to 500 operations
      for (let i = 0; i < parsedItems.length; i += chunkSize) {
          const chunk = parsedItems.slice(i, i + chunkSize);
          const batch = writeBatch(firestore);
          chunk.forEach(item => {
              const itemId = doc(collection(firestore, 'dummy')).id;
              const itemRef = doc(firestore, `excel_files/${fileId}/items`, itemId);
              const itemData = { ...item, id: itemId, fileId };
              batch.set(itemRef, itemData);
          });
          await batch.commit();
      }

      toast({ title: 'Success!', description: 'File imported. You can now edit the item details.' });
      router.push(`/archive/${fileId}`);
      
    } catch (error) {
      console.error("Error processing or saving file:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not process or save the Excel file. It might be too large or corrupted.' });
      setIsProcessing(false);
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
          <h1 className="text-2xl md:text-3xl font-bold">Import Excel File</h1>
        </div>
      </header>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Import Details</CardTitle>
          <CardDescription>Provide the file and details for the import. The file will be saved, and you'll be taken to the edit page.</CardDescription>
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
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button onClick={handleSaveAndContinue} disabled={isProcessing || !file || !storekeeperId || !source || !date || !categoryName} className="w-full">
            {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Save and Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
