
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileText, CheckCircle, Save, Calendar, Trash2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, formatISO } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import type { Item, ExcelFile } from '@/lib/types';
import { parsePdfInventory, type ExtractedItem } from '@/ai/flows/parse-pdf-inventory-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as pdfjsLib from 'pdfjs-dist';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Configure PDF.js worker using a reliable CDN that supports ESM (.mjs)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const sources = ["Showroom", "Ashley Store", "Huana Store"];

export default function ImportPdfPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { employees, locations, setExcelFiles, setItems } = useAppContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [storekeeperId, setStorekeeperId] = useState('');
  const [source, setSource] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Extracted Data
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a PDF file.' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const handleProcessPdf = async () => {
    if (!file || !storekeeperId || !source || !date || !categoryName) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields and select a file.' });
      return;
    }
    
    setIsProcessing(true);

    try {
      const rawText = await extractTextFromPdf(file);
      const result = await parsePdfInventory({ text: rawText });
      
      if (result.items && result.items.length > 0) {
        setExtractedItems(result.items);
        setStep('review');
        toast({ title: 'AI Extraction Complete', description: 'Please review the extracted data before saving.' });
      } else {
        toast({ variant: 'destructive', title: 'Extraction Failed', description: 'AI could not find any items in the provided PDF text.' });
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not process the PDF. It might be encrypted or formatted incorrectly.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSave = () => {
    const fileId = crypto.randomUUID();
    
    const fileData: ExcelFile = {
      id: fileId,
      storekeeperId,
      storageName: file?.name || 'Imported PDF',
      categoryName,
      date: formatISO(date!),
      source,
      type: 'imported'
    };
    
    // De-duplicate items by model within this import session
    const uniqueItemsMap = new Map<string, ExtractedItem>();
    extractedItems.forEach(item => {
        if (!uniqueItemsMap.has(item.model)) {
            uniqueItemsMap.set(item.model, item);
        }
    });

    const newItems: Item[] = Array.from(uniqueItemsMap.values()).map(item => {
      // Try to match location string to existing location ID
      const matchedLocation = locations.find(l => l.name.toLowerCase() === item.location.toLowerCase());
      
      return {
        id: crypto.randomUUID(),
        fileId: fileId,
        model: item.model,
        quantity: item.quantity,
        notes: item.notes,
        locationId: matchedLocation?.id,
        // Map status/warehouse_status to existing schema
        modelCondition: (item.status === 'Wrapped' || item.status === 'Damaged') ? item.status : '',
        storageStatus: (item.warehouse_status === 'Correct' || item.warehouse_status === 'Less' || item.warehouse_status === 'More') ? item.warehouse_status : ''
      } as Item;
    });

    setExcelFiles(prev => [...prev, fileData]);
    setItems(prev => [...prev, ...newItems]);

    toast({ title: 'Import Successful', description: 'The PDF data has been applied to the inventory.' });
    router.push(`/archive/${fileId}`);
  };

  const removeExtractedItem = (index: number) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => step === 'review' ? setStep('upload') : router.push('/items')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Import PDF Data / هاوردەکردنی PDF</h1>
        </div>
      </header>

      {step === 'upload' ? (
        <Card className="max-w-2xl mx-auto border-2 border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl">
          <div className="bg-primary/5 p-6 border-b">
            <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Source Document Protocol</CardTitle>
            <CardDescription className="text-xs">Upload a warehouse report. Our AI will perform structured extraction across all pages.</CardDescription>
          </div>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">1. Select Document</Label>
              <div className="border-2 border-dashed rounded-2xl p-8 text-center bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer relative group">
                <input type="file" onChange={handleFileChange} accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20 group-hover:opacity-40 transition-opacity" />
                <p className="text-[11px] font-bold uppercase tracking-widest">
                  {file ? file.name : "Drop PDF here or click to browse"}
                </p>
                {file && <CheckCircle className="w-5 h-5 text-green-500 absolute top-4 right-4" />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">2. Staff Anchor</Label>
                    <Select onValueChange={setStorekeeperId} value={storekeeperId}>
                        <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Select member" /></SelectTrigger>
                        <SelectContent>
                        {employees?.filter(e => e.isActive !== false).map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">3. Target Warehouse</Label>
                    <Select onValueChange={setSource} value={source}>
                        <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Select location" /></SelectTrigger>
                        <SelectContent>
                        {sources.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">4. Report Category</Label>
              <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Monthly Inventory Audit" className="h-11 rounded-xl bg-white" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">5. Filing Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-11 justify-start text-left font-normal rounded-xl bg-white">
                    <Calendar className="mr-2 h-4 w-4 opacity-40" />
                    {date ? format(date, 'dd/MM/yyyy') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl">
                  <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button onClick={handleProcessPdf} disabled={isProcessing || !file || !storekeeperId || !source || !date || !categoryName} className="w-full h-12 font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20">
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              Initiate Extraction / دەستپێکردن
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-primary/5 p-6 border-b">
            <div>
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Audit Sector: Review Extracted Data</CardTitle>
              <CardDescription className="text-xs">Identified {extractedItems.length} unique data clusters. Please verify the mapping before committing to ERP.</CardDescription>
            </div>
            <Button onClick={handleFinalSave} size="lg" className="bg-primary shadow-xl font-black uppercase tracking-widest rounded-xl px-8 h-12">
              <Save className="mr-2 h-4 w-4" /> Commit to Inventory
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-tighter h-12 px-6">Model ID</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-tighter h-12 text-center">QTY</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-tighter h-12 text-center">Item Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-tighter h-12 text-center">Warehouse Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-tighter h-12">Location</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-tighter h-12">Remarks</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedItems.map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50 transition-colors border-slate-100 h-14">
                      <TableCell className="font-bold text-[12px] text-slate-900 px-6">{item.model}</TableCell>
                      <TableCell className="text-center font-black text-[13px] text-primary">{item.quantity}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">
                            {item.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase border-slate-200",
                            item.warehouse_status === 'Correct' && "bg-green-50 text-green-700 border-green-100",
                            (item.warehouse_status === 'Less' || item.warehouse_status === 'More') && "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                            {item.warehouse_status || 'not set'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{item.location}</TableCell>
                      <TableCell className="text-[11px] text-slate-500 max-w-[250px] truncate" dir="rtl">{item.notes}</TableCell>
                      <TableCell className="pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeExtractedItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
