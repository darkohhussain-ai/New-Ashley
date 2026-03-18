
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileText, CheckCircle, Save, Calendar, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, formatISO, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-provider';
import type { Item, StorageLocation, ExcelFile } from '@/lib/types';
import { parsePdfInventory, type ExtractedItem } from '@/ai/flows/parse-pdf-inventory-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
    
    const newItems: Item[] = extractedItems.map(item => {
      // Try to match location string to existing location ID
      const matchedLocation = locations.find(l => l.name.toLowerCase() === item.location.toLowerCase());
      
      return {
        id: crypto.randomUUID(),
        fileId: fileId,
        name: item.name,
        model: item.model,
        quantity: item.quantity,
        notes: `${item.category ? `[${item.category}] ` : ''}${item.notes || ''}`.trim(),
        locationId: matchedLocation?.id || undefined
      };
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
          <h1 className="text-2xl md:text-3xl font-bold">Import PDF Data / هاوردەکردنی PDF</h1>
        </div>
      </header>

      {step === 'upload' ? (
        <Card className="max-w-2xl mx-auto border-2 border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle>Source Document Configuration</CardTitle>
            <CardDescription>Upload a warehouse list or invoice PDF. Our AI will analyze the text and extract operational data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select PDF File</Label>
              <div className="border-2 border-dashed rounded-2xl p-8 text-center bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer relative">
                <input type="file" onChange={handleFileChange} accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-60">
                  {file ? file.name : "Drop PDF here or click to browse"}
                </p>
                {file && <CheckCircle className="w-5 h-5 text-green-500 absolute top-4 right-4" />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>{t('storekeeper')}</Label>
                    <Select onValueChange={setStorekeeperId} value={storekeeperId}>
                        <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                        <SelectContent>
                        {employees?.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{t('source_location')}</Label>
                    <Select onValueChange={setSource} value={source}>
                        <SelectTrigger><SelectValue placeholder="Select target warehouse" /></SelectTrigger>
                        <SelectContent>
                        {sources.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
              <Label>Import Category Name</Label>
              <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. New Shipment Arrived" />
            </div>
            
            <div className="space-y-2">
              <Label>Filing Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button onClick={handleProcessPdf} disabled={isProcessing || !file || !storekeeperId || !source || !date || !categoryName} className="w-full h-12 font-black uppercase tracking-widest">
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : "Start AI Extraction / دەستپێکردن"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Extraction Review</CardTitle>
              <CardDescription>We found {extractedItems.length} items. Verify the data below before saving to inventory.</CardDescription>
            </div>
            <Button onClick={handleFinalSave} size="lg" className="bg-primary shadow-xl font-black uppercase tracking-widest">
              <Save className="mr-2 h-4 w-4" /> Apply to Inventory
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-2xl overflow-hidden bg-white/30">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">Item Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Model</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">QTY</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Location</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Modifications</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedItems.map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-bold text-[12px]">{item.name}</TableCell>
                      <TableCell className="font-mono text-[11px] text-primary">{item.model}</TableCell>
                      <TableCell className="font-black text-[13px]">{item.quantity}</TableCell>
                      <TableCell className="text-[11px] opacity-60 uppercase">{item.category}</TableCell>
                      <TableCell className="font-bold text-[11px] text-slate-600">{item.location}</TableCell>
                      <TableCell className="text-[11px] text-slate-500 italic max-w-[200px] truncate">{item.notes}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeExtractedItem(index)}>
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

function useTranslation() {
  const { t } = useAppContext();
  return { t };
}
