
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Calendar as CalendarIcon, Building, FileText, MapPin, Edit, Trash2, Save, X, ArrowUpDown, ArrowDown, ArrowUp, FileSpreadsheet, ChevronLeft, ChevronRight, Download, Search, Upload, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import html2canvas from 'html2canvas';
import { FilePdfCard } from '@/components/archive/file-pdf-card';
import useLocalStorage from '@/hooks/use-local-storage';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useAppContext } from '@/context/app-provider';
import type { ExcelFile, Item, Employee, StorageLocation } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { shapeText } from '@/lib/pdf-utils';


type SortableKeys = keyof Item;

const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
  const handlePrevious = () => onPageChange(currentPage - 1);
  const handleNext = () => onPageChange(currentPage + 1);

  const pageNumbers = [];
  const maxPagesToShow = 5;
  let startPage, endPage;

  if (totalPages <= maxPagesToShow) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - Math.floor(maxPagesToShow / 2);
      endPage = currentPage + Math.floor(maxPagesToShow / 2);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 my-4">
      <Button variant="outline" size="icon" onClick={handlePrevious} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {startPage > 1 && (
         <>
          <Button variant="ghost" size="icon" onClick={() => onPageChange(1)}>1</Button>
          {startPage > 2 && <span className='text-muted-foreground'>...</span>}
         </>
      )}
      {pageNumbers.map(number => (
        <Button key={number} variant={currentPage === number ? "default" : "outline"} size="icon" onClick={() => onPageChange(number)}>
          {number}
        </Button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages -1 && <span className='text-muted-foreground'>...</span>}
          <Button variant="ghost" size="icon" onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
        </>
      )}
      <Button variant="outline" size="icon" onClick={handleNext} disabled={currentPage === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

const statusChartConfig = {
  'Not Checked': { label: 'Not Checked', color: 'hsl(var(--muted-foreground))' },
  Correct: { label: 'Correct', color: 'hsl(var(--chart-2))' },
  Less: { label: 'Less', color: 'hsl(var(--chart-4))' },
  More: { label: 'More', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

const conditionChartConfig = {
  'Not Damaged': { label: 'Not Damaged', color: 'hsl(var(--chart-2))' },
  Wrapped: { label: 'Wrapped', color: 'hsl(var(--chart-4))' },
  Damaged: { label: 'Damaged', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;


export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const fileId = params.id as string;
  const { 
    excelFiles, setExcelFiles, 
    items, setItems: setAllItems, 
    employees, 
    locations 
  } = useAppContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState<Item[]>([]);
  const [editableFile, setEditableFile] = useState<Partial<ExcelFile>>({});
  const [originalQuantities, setOriginalQuantities] = useState<Record<string, number>>({});
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'model', direction: 'ascending' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  // Filter states for location dropdown
  const [filterHuanaWarehouse, setFilterHuanaWarehouse] = useState('All');
  const [filterHuanaFloor, setFilterHuanaFloor] = useState('All');
  const [filterAshleyFloor, setFilterAshleyFloor] = useState('All');
  const [filterAshleyArea, setFilterAshleyArea] = useState('All');

  const defaultLogo = "https://picsum.photos/seed/1/300/100";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);

  
  const updateFileInputRef = useRef<HTMLInputElement>(null);
  const pdfCardRef = useRef<HTMLDivElement>(null);
  
  const file = useMemo(() => excelFiles.find(f => f.id === fileId), [excelFiles, fileId]);
  const fileItems = useMemo(() => items.filter(i => i.fileId === fileId), [items, fileId]);

  useEffect(() => {
    if (file) {
      setEditableFile(JSON.parse(JSON.stringify(file))); // Deep copy
      setEditableItems(JSON.parse(JSON.stringify(fileItems.map(item => ({...item, updateStatus: ''}))))); // Deep copy
      setIsLoading(false);
    } else if (excelFiles.length > 0){
        // If files are loaded but this one isn't found
        setIsLoading(false);
    }
  }, [file, fileItems, excelFiles]);
  

  useEffect(() => {
    if (isEditing) {
        setEditableItems(current => current.map(item => ({ ...item, updateStatus: '' })));
        const qtyMap: Record<string, number> = {};
        fileItems?.forEach(item => { qtyMap[item.id] = item.quantity; });
        setOriginalQuantities(qtyMap);
    } else {
        setOriginalQuantities({});
        if(file) setEditableFile(JSON.parse(JSON.stringify(file))); // Reset on cancel
    }
  }, [isEditing, fileItems, file]);

  const { statusChartData, conditionChartData } = useMemo(() => {
    if (!fileItems) return { statusChartData: [], conditionChartData: [] };

    const totalItems = fileItems.length;
    if (totalItems === 0) return { statusChartData: [], conditionChartData: [] };
    
    const statusCounts: Record<string, number> = { 'Not Checked': 0, Correct: 0, Less: 0, More: 0 };
    fileItems.forEach(item => {
        const status = item.storageStatus || 'Not Checked';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      fill: statusChartConfig[name as keyof typeof statusChartConfig]?.color || '#ccc'
    })).filter(d => d.value > 0);
    
    const conditionCounts: Record<string, number> = { 'Not Damaged': 0, Wrapped: 0, Damaged: 0 };
    fileItems.forEach(item => {
      if (item.modelCondition === 'Damaged') {
        conditionCounts.Damaged++;
      } else if (item.modelCondition === 'Wrapped') {
        conditionCounts.Wrapped++;
      } else {
        conditionCounts['Not Damaged']++;
      }
    });

    const conditionChartData = Object.entries(conditionCounts).map(([name, value]) => ({
      name,
      value,
      fill: conditionChartConfig[name as keyof typeof conditionChartConfig]?.color || '#ccc'
    })).filter(d => d.value > 0);

    return { statusChartData, conditionChartData };
  }, [fileItems]);

  const sortedItems = useMemo(() => {
    let itemsToProcess = isEditing ? editableItems : (fileItems || []);
    
    if (searchQuery) {
      itemsToProcess = itemsToProcess.filter(item => 
        item.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    let sortableItems = [...itemsToProcess];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [isEditing, editableItems, fileItems, sortConfig, searchQuery]);

  const paginatedItems = useMemo(() => {
      return sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 ml-2 opacity-20" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="w-4 h-4 ml-2" />;
    }
    return <ArrowDown className="w-4 h-4 ml-2" />;
  };

  const handleItemChange = (itemId: string, field: keyof Item, value: any) => {
    setEditableItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };
  
  const handleSave = async () => {
    if (!fileId) return;

    // Update file details
    setExcelFiles(excelFiles.map(f => f.id === fileId ? { ...f, ...editableFile } : f));
    
    // Update items
    const originalItemIds = new Set(fileItems.map(i => i.id));
    const finalItemIds = new Set<string>();

    const updatedItems: Item[] = [];
    const newItems: Item[] = [];

    editableItems.forEach(item => {
        finalItemIds.add(item.id);
        const { updateStatus, ...itemData } = item;
        if (updateStatus === 'NEW') {
            const newItem = {...itemData, id: crypto.randomUUID(), fileId};
            newItems.push(newItem);
        } else if (originalItemIds.has(item.id)) {
            updatedItems.push(itemData as Item);
        }
    });

    const deletedItemIds = Array.from(originalItemIds).filter(id => !finalItemIds.has(id));

    setAllItems(prevAllItems => [
      // Items that are not part of this file
      ...prevAllItems.filter(item => item.fileId !== fileId),
      // Items that are not deleted
      ...prevAllItems.filter(item => item.fileId === fileId && !deletedItemIds.includes(item.id))
                     .map(oldItem => updatedItems.find(upd => upd.id === oldItem.id) || oldItem),
      // New items
      ...newItems
    ]);

    toast({ title: "Success", description: "All changes have been saved." });
    setIsEditing(false);
  };


  const handleDeleteFile = () => {
    setExcelFiles(excelFiles.filter(f => f.id !== fileId));
    setAllItems(items.filter(i => i.fileId !== fileId));
    toast({ title: "File Deleted", description: `The Excel file has been removed.` });
    router.push('/archive');
  }
  
  const handleFileUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (!newFile) return;

    try {
      const data = await newFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const importedItemsRaw = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];

      const importedItems = new Map<string, { model: string, quantity: number }>();
      importedItemsRaw.forEach(row => {
          const model = String(row.Model || row.model || '').trim();
          if (model) {
            importedItems.set(model, {
                model,
                quantity: Number(row.Quantity || row.quantity || row.Qty || row.qty || 0),
            });
          }
      });
      
      const currentItems = editableItems || [];
      const updatedItems: Item[] = [];
      const existingModelsInNewFile = new Set<string>();

      currentItems.forEach(item => {
          const newItemData = importedItems.get(item.model);
          if (newItemData) {
              if (item.quantity !== newItemData.quantity) {
                  updatedItems.push({ ...item, quantity: newItemData.quantity, updateStatus: 'UPDATED' });
              } else {
                  updatedItems.push(item);
              }
              existingModelsInNewFile.add(item.model);
          }
      });
      
      importedItems.forEach((newItemData, model) => {
        if (!existingModelsInNewFile.has(model)) {
            updatedItems.push({
                id: `new_${Date.now()}_${model}`, // Temp ID
                fileId: fileId,
                model: newItemData.model,
                quantity: newItemData.quantity,
                notes: '',
                storageStatus: '',
                modelCondition: '',
                locationId: '',
                updateStatus: 'NEW'
            });
        }
      });
      
      setEditableItems(updatedItems);
      toast({ title: "File Ready for Review", description: "Review the changes and click 'Save Changes' to confirm." });

    } catch (error) {
      console.error("Error processing update file:", error);
      toast({ variant: "destructive", title: "File Error", description: "Could not process the uploaded file." });
    } finally {
        if(updateFileInputRef.current) updateFileInputRef.current.value = "";
    }
  };


  const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.name || '...';
  const getLocationName = (id?: string) => locations?.find(l => l.id === id)?.name || '...';
  
  const getWarehouseTypeFromSource = (source?: string) => {
      if (source === 'Ashley Store') return 'Ashley';
      if (source === 'Huana Store') return 'Huana';
      return null;
  }
  const warehouseType = getWarehouseTypeFromSource(file?.source);
  
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
        if(filterAshleyArea !== 'All' && filterAshleyFloor === '3') { // Area filter is only for floor 3
            filtered = filtered.filter(l => l.name.startsWith(`A-3-${filterAshleyArea}-`));
        }
    }
    
    return filtered.sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  }, [locations, warehouseType, filterHuanaWarehouse, filterHuanaFloor, filterAshleyFloor, filterAshleyArea]);


  const getRowClass = (item: Item) => {
    if (isEditing) {
        switch (item.updateStatus) {
            case 'NEW': return 'bg-status-new';
            case 'UPDATED': return 'bg-status-updated';
            default: // fall through
        }
    }
    switch (item.storageStatus) {
      case 'Correct': return 'bg-status-correct';
      case 'Less': return 'bg-status-less';
      case 'More': return 'bg-status-more';
      default: return '';
    }
  };
  
  const getConditionCellClass = (condition?: 'Wrapped' | 'Damaged' | '') => {
    if (!isEditing) return '';
    switch (condition) {
      case 'Wrapped':
        return 'bg-status-wrapped';
      case 'Damaged':
        return 'bg-status-damaged';
      default:
        return '';
    }
  };

  const handleDownloadPdf = async () => {
    if (!file || !sortedItems || !pdfCardRef.current) return;
    
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const useKurdish = language === 'ku';

     if (customFontBase64 && useKurdish) {
        try {
            const fontName = "CustomFont";
            pdf.addFileToVFS(`${fontName}.ttf`, customFontBase64.split(',')[1]);
            pdf.addFont(`${fontName}.ttf`, fontName, "normal");
            pdf.setFont(fontName);
        } catch (e) {
            console.error("Could not add custom font to PDF", e);
        }
    } else {
        pdf.setFont('helvetica');
    }
    
    const canvas = await html2canvas(pdfCardRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: null,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth - 28; // with some margin
    const finalImgHeight = finalImgWidth / ratio;
    
    pdf.addImage(imgData, 'PNG', 14, 14, finalImgWidth, finalImgHeight);
    
    autoTable(pdf, {
      startY: finalImgHeight + 30,
      head: [[shapeText(t('model')), t('quantity'), shapeText(t('storage_status')), shapeText(t('condition')), t('qty_per_condition'), shapeText(t('location')), shapeText(t('notes'))]],
      body: sortedItems.map(item => [
        shapeText(item.model),
        item.quantity,
        shapeText(t(item.storageStatus?.toLowerCase() || '') || item.storageStatus || ''),
        shapeText(t(item.modelCondition?.toLowerCase() || '') || item.modelCondition || ''),
        item.quantityPerCondition ?? '',
        shapeText(item.locationId ? getLocationName(item.locationId) : ''),
        shapeText(item.notes || '')
      ]),
      theme: 'grid',
      styles: {
          font: (useKurdish && customFontBase64) ? 'CustomFont' : 'helvetica',
          halign: useKurdish ? 'right' : 'left',
          fontSize: 8,
          cellPadding: 2,
      },
      headStyles: {
          fillColor: [34, 197, 94], // Tailwind green-500
          textColor: 255,
          fontStyle: 'bold',
      },
    });

    const finalY = (pdf as any).lastAutoTable.finalY + 40;
    const pageHeight = pdf.internal.pageSize.height;
    if (finalY > pageHeight - 30) {
        pdf.addPage();
    }
    const signatureY = finalY > pageHeight - 50 ? 40 : finalY;
    if (useKurdish && customFontBase64) pdf.setFont("CustomFont");
    pdf.setFontSize(10);
    pdf.text("...................................", pdf.internal.pageSize.width - 120, signatureY, { align: 'center' });
    pdf.text(shapeText(t('warehouse_manager_signature')), pdf.internal.pageSize.width - 120, signatureY + 10, { align: 'center' });

    pdf.save(`${file.storageName}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!file || !sortedItems) return;
    const dataToExport = sortedItems.map(item => ({
      'Model': item.model,
      'Quantity': item.quantity,
      'Storage Status': item.storageStatus || '',
      'Condition': item.modelCondition || '',
      'Quantity Per Condition': item.quantityPerCondition ?? '',
      'Location': item.locationId ? getLocationName(item.locationId) : '',
      'Notes': item.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
    XLSX.writeFile(workbook, `${editableFile.storageName || file.storageName}.xlsx`);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
        <div className="p-8 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-8"></div>
            <Card className="mb-8">
                <CardHeader>
                    <div className="h-7 w-3/4 bg-muted rounded"></div>
                    <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <div className="h-6 w-40 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-40 w-full bg-muted rounded"></div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
        <FileText className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('file_not_found')}</h2>
        <p className="text-muted-foreground mb-6">{t('file_not_found_desc')}</p>
        <Button asChild>
          <Link href="/archive">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back_to_archive')}
          </Link>
        </Button>
      </div>
    );
  }
  
  const employeeForFile = employees?.find(e => e.id === file.storekeeperId)

  return (
    <div className='bg-background min-h-screen'>
     <input
        type="file"
        ref={updateFileInputRef}
        onChange={handleFileUpdate}
        className="hidden"
        accept=".xlsx,.xls"
      />
     <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', background: 'white', color: 'black' }}>
          {file && employeeForFile && fileItems && (
            <div ref={pdfCardRef} style={{ width: '700px' }}>
                <FilePdfCard
                    file={{...(file || {}), ...editableFile} as ExcelFile}
                    employee={employeeForFile}
                    logoSrc={logoSrc}
                    statusData={statusChartData}
                    conditionData={conditionChartData}
                />
            </div>
          )}
      </div>
      <header className="bg-card border-b p-4 print:hidden">
        <div className="container mx-auto flex items-center justify-between gap-4">
            <div className='flex items-center gap-4'>
                <Button variant="outline" size="icon" asChild>
                    <Link href="/archive">
                    <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">{t('file_details')}</h1>
            </div>
            <div className='flex items-center gap-2 flex-wrap justify-end'>
                {isEditing ? (
                    <>
                    <Button variant="outline" onClick={() => updateFileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> {t('update_with_new_file')}
                    </Button>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/> {t('save_changes')}</Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4"/> {t('cancel')}</Button>
                    </>
                ) : (
                    <>
                    <Button onClick={() => setIsEditing(true)}><Edit className="mr-2"/>{t('edit')}</Button>
                    <Button variant="outline" onClick={handleDownloadPdf}><FileText className="mr-2 h-4 w-4" /> {t('download_pdf')}</Button>
                    <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> {t('print')}</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2"/>{t('delete')}</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('confirm_delete_file', {fileName: file.storageName})}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteFile}>{t('delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </>
                )}
            </div>
        </div>
      </header>
      <main className="p-4 md:p-8 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className='flex-1 min-w-[250px]'>
                            <div className="flex justify-between items-start">
                                <div>
                                    {isEditing ? (
                                        <Input 
                                            value={editableFile.storageName || ''} 
                                            onChange={(e) => setEditableFile(prev => ({...prev, storageName: e.target.value}))}
                                            className="text-2xl md:text-3xl font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0"
                                            placeholder={t('enter_file_name')}
                                        />
                                    ) : (
                                        <CardTitle className="text-2xl md:text-3xl font-bold">{file.storageName}</CardTitle>
                                    )}
                                    <CardDescription className="font-semibold text-primary">{file.categoryName}</CardDescription>
                                </div>
                                <Badge variant={file.type === 'imported' ? 'default' : 'secondary'}>{file.type}</Badge>
                            </div>
                            <CardDescription className="grid grid-cols-2 md:flex md:items-center gap-x-6 gap-y-2 text-sm pt-2">
                                <span className="flex items-center gap-2"><User className="w-4 h-4"/>{getEmployeeName(file.storekeeperId)}</span>
                                <span className="flex items-center gap-2"><Building className="w-4 h-4"/>{file.source}</span>
                                <span className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4"/>
                                  {file.date ? format(parseISO(file.date), 'PPP') : t('invalid_date')}
                                </span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
              </Card>

              {isEditing && warehouseType && (
                <Card className="print:hidden">
                    <CardHeader>
                        <CardTitle>{t('location_filters')}</CardTitle>
                        <CardDescription>{t('location_filters_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-4">
                        {warehouseType === 'Huana' && (
                            <>
                                <Select value={filterHuanaWarehouse} onValueChange={setFilterHuanaWarehouse}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_huana_warehouse')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">{t('all_huana_warehouses')}</SelectItem>
                                        {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{t('warehouse')} {n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {filterHuanaWarehouse !== 'All' && (
                                    <Select value={filterHuanaFloor} onValueChange={setFilterHuanaFloor}>
                                        <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_floor')} /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">{t('all_floors')}</SelectItem>
                                            {[1, 2].map(n => <SelectItem key={n} value={String(n)}>{t('floor')} {n}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            </>
                        )}
                        {warehouseType === 'Ashley' && (
                            <>
                                <Select value={filterAshleyFloor} onValueChange={setFilterAshleyFloor}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_ashley_floor')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">{t('all_floors')}</SelectItem>
                                        <SelectItem value="4">{t('floor')} 4</SelectItem>
                                        <SelectItem value="3">{t('floor')} 3</SelectItem>
                                    </SelectContent>
                                </Select>
                                {filterAshleyFloor === '3' && (
                                    <Select value={filterAshleyArea} onValueChange={setFilterAshleyArea}>
                                        <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_area')} /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">{t('all_areas_on_floor_3')}</SelectItem>
                                            <SelectItem value="1">{t('area')} 1</SelectItem>
                                            <SelectItem value="O">{t('area')} 2 ({t('office')})</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
              )}
               <div className='flex gap-4 items-center justify-center flex-wrap'>
                    {statusChartData.length > 0 && (
                      <ChartContainer config={statusChartConfig} className="min-h-[120px] w-full max-w-[300px]">
                        <ResponsiveContainer>
                          <PieChart>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const { name, value } = payload[0].payload;
                                  const total = statusChartData.reduce((acc, curr) => acc + curr.value, 0);
                                  return (
                                    <div className="p-2 text-sm bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
                                      <p className="font-bold">{`${name}: ${((value / total) * 100).toFixed(0)}% (${value})`}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} strokeWidth={2}>
                              {statusChartData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Legend content={() => (
                                <div className="text-center text-xs text-muted-foreground -mt-2">{t('inventory_status')}</div>
                            )} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                    {conditionChartData.length > 0 && (
                      <ChartContainer config={conditionChartConfig} className="min-h-[120px] w-full max-w-[300px]">
                        <ResponsiveContainer>
                          <PieChart>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const { name, value } = payload[0].payload;
                                  const total = conditionChartData.reduce((acc, curr) => acc + curr.value, 0);
                                  return (
                                    <div className="p-2 text-sm bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
                                      <p className="font-bold">{`${name}: ${((value / total) * 100).toFixed(0)}% (${value})`}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Pie data={conditionChartData} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} strokeWidth={2}>
                              {conditionChartData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Legend content={() => (
                                <div className="text-center text-xs text-muted-foreground -mt-2">{t('condition_status')}</div>
                            )} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </div>
          </div>
        
          <Card className="lg:col-span-2">
            <CardHeader className="print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>{t('items_count', { count: sortedItems.length })}</CardTitle>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('search_by_model')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead onClick={() => requestSort('model')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">{t('model')} {getSortIcon('model')}</div></TableHead>
                            <TableHead onClick={() => requestSort('quantity')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">{t('quantity')} {getSortIcon('quantity')}</div></TableHead>
                            {isEditing && <TableHead>{t('update_status')}</TableHead>}
                            <TableHead onClick={() => requestSort('storageStatus')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">{t('storage_status')} {getSortIcon('storageStatus')}</div></TableHead>
                            <TableHead onClick={() => requestSort('modelCondition')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">{t('condition')} {getSortIcon('modelCondition')}</div></TableHead>
                            <TableHead onClick={() => requestSort('quantityPerCondition')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">{t('qty_per_condition')} {getSortIcon('quantityPerCondition')}</div></TableHead>
                            <TableHead onClick={() => requestSort('locationId')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">{t('location')} {getSortIcon('locationId')}</div></TableHead>
                            <TableHead onClick={() => requestSort('notes')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">{t('notes')} {getSortIcon('notes')}</div></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.map((item) => (
                            <TableRow id={item.id} key={item.id} className={cn("transition-colors target:bg-primary/20 target:duration-500", getRowClass(item))}>
                                <TableCell className="font-medium">
                                    {isEditing ? <span className='text-muted-foreground'>{item.model}</span> : item.model}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {isEditing ? <span className='text-muted-foreground font-semibold'>{item.quantity}</span> : <span className="font-semibold">{item.quantity}</span>}
                                        {isEditing && originalQuantities[item.id] !== undefined && originalQuantities[item.id] !== item.quantity && (
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">(was {originalQuantities[item.id]})</span>
                                        )}
                                    </div>
                                </TableCell>
                                {isEditing && <TableCell>
                                  {item.updateStatus && <Badge variant={item.updateStatus === 'NEW' ? 'default' : 'secondary'}>{item.updateStatus}</Badge>}
                                </TableCell>}
                                <TableCell>{isEditing ? (
                                    <Select value={item.storageStatus || ''} onValueChange={v => handleItemChange(item.id, 'storageStatus', v === 'none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('none')}</SelectItem>
                                            <SelectItem value="Correct">{t('correct')}</SelectItem>
                                            <SelectItem value="Less">{t('less')}</SelectItem>
                                            <SelectItem value="More">{t('more')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="flex items-center gap-2">{item.storageStatus || t('na')}</span>
                                )}</TableCell>
                                <TableCell className={cn("transition-colors", getConditionCellClass(item.modelCondition))}>{isEditing ? (
                                    <Select value={item.modelCondition || ''} onValueChange={v => handleItemChange(item.id, 'modelCondition', v === 'none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('none')}</SelectItem>
                                            <SelectItem value="Wrapped">{t('wrapped')}</SelectItem>
                                            <SelectItem value="Damaged">{t('damaged')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : item.modelCondition || t('na')}</TableCell>
                                <TableCell>{isEditing ? 
                                    <Input type="number" value={item.quantityPerCondition ?? ''} onChange={e => handleItemChange(item.id, 'quantityPerCondition', e.target.valueAsNumber)} className="w-24" />
                                    : item.quantityPerCondition ?? t('na')
                                }</TableCell>
                                <TableCell>{isEditing ? (
                                    <Select value={item.locationId || ''} onValueChange={v => handleItemChange(item.id, 'locationId', v === 'none' ? '' : v)} disabled={!warehouseType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={warehouseType ? t('select') : t('na')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">{t('none')}</SelectItem>
                                          {filteredLocations.map(loc => (
                                              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {item.locationId && <MapPin className="w-4 h-4 text-muted-foreground"/>}
                                        {item.locationId ? getLocationName(item.locationId) : t('na')}
                                    </span>
                                )}</TableCell>
                                <TableCell>{isEditing ?
                                    <Textarea value={item.notes ?? ''} onChange={e => handleItemChange(item.id, 'notes', e.target.value)} />
                                    : item.notes || t('na')
                                }</TableCell>
                            </TableRow>
                        ))}
                        {paginatedItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isEditing ? 8 : 7} className="text-center h-24">{t('no_items_found')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
            {totalPages > 1 && <CardContent className="print:hidden"><PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></CardContent>}
          </Card>
        </div>
      </main>
    </div>
  );
}
