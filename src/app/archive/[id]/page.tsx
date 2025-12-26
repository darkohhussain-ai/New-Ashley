
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, Timestamp, writeBatch } from 'firebase/firestore';
import { ArrowLeft, User, Calendar as CalendarIcon, Building, FileText, MapPin, Edit, Trash2, Save, X, ArrowUpDown, ArrowDown, ArrowUp, FileSpreadsheet, ChevronLeft, ChevronRight, Download, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
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


type ExcelFile = {
  id: string;
  storekeeperId: string;
  storageName: string;
  categoryName: string;
  date: Timestamp;
  source: string;
  type: 'new' | 'imported';
};

type Item = {
  id: string;
  fileId: string;
  model: string;
  quantity: number;
  notes?: string;
  storageStatus?: 'Correct' | 'Less' | 'More' | '';
  modelCondition?: 'Wrapped' | 'Damaged' | '';
  quantityPerCondition?: number;
  locationId?: string;
  updateStatus?: 'NEW' | 'UPDATED' | 'ZEROED' | '';
};

type Employee = { id: string; name: string; };
type StorageLocation = { id: string; name: string; warehouseType: 'Ashley' | 'Huana'; };
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
  const { toast } = useToast();
  const fileId = params.id as string;
  const firestore = useFirestore();

  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState<Item[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'model', direction: 'ascending' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  // Filter states for location dropdown
  const [filterHuanaWarehouse, setFilterHuanaWarehouse] = useState('All');
  const [filterHuanaFloor, setFilterHuanaFloor] = useState('All');
  const [filterAshleyFloor, setFilterAshleyFloor] = useState('All');
  const [filterAshleyArea, setFilterAshleyArea] = useState('All');

  const defaultLogo = "https://i.ibb.co/68RvM01/ashley-logo.png";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
  
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  const fileRef = useMemoFirebase(() => (firestore && fileId ? doc(firestore, 'excel_files', fileId) : null), [firestore, fileId]);
  const { data: file, isLoading: isLoadingFile } = useDoc<ExcelFile>(fileRef);

  const itemsRef = useMemoFirebase(() => (firestore && fileId ? collection(firestore, `excel_files/${fileId}/items`) : null), [firestore, fileId]);
  const { data: items, isLoading: isLoadingItems } = useCollection<Item>(itemsRef);
  
  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);
  
  const locationsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'storage_locations') : null), [firestore]);
  const { data: locations, isLoading: isLoadingLocations } = useCollection<StorageLocation>(locationsRef);

  const pdfCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items) {
      setEditableItems(JSON.parse(JSON.stringify(items.map(item => ({...item, updateStatus: ''}))))); // Deep copy
    }
  }, [items]);
  
  useEffect(() => {
    // When entering edit mode, clear previous update statuses
    if (isEditing) {
        setEditableItems(current => current.map(item => ({ ...item, updateStatus: '' })));
    }
  }, [isEditing]);

  const { statusChartData, conditionChartData } = useMemo(() => {
    if (!items) return { statusChartData: [], conditionChartData: [] };

    const totalItems = items.length;
    if (totalItems === 0) return { statusChartData: [], conditionChartData: [] };
    
    // Status data
    const statusCounts: Record<string, number> = { 'Not Checked': 0, Correct: 0, Less: 0, More: 0 };
    items.forEach(item => {
        const status = item.storageStatus || 'Not Checked';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      fill: statusChartConfig[name as keyof typeof statusChartConfig]?.color || '#ccc'
    })).filter(d => d.value > 0);
    
    // Condition data
    const conditionCounts: Record<string, number> = { 'Not Damaged': 0, Wrapped: 0, Damaged: 0 };
    items.forEach(item => {
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
  }, [items]);

  const sortedItems = useMemo(() => {
    let itemsToProcess = isEditing ? editableItems : (items || []);
    
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
  }, [isEditing, editableItems, items, sortConfig, searchQuery]);

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
    if (!firestore || !fileId) return;
    const batch = writeBatch(firestore);
    
    editableItems.forEach(item => {
      const { id, fileId: fId, updateStatus, ...itemData } = item;
      const itemRef = doc(firestore, `excel_files/${fileId}/items`, id);
      // For new items, their ID is a temporary one, so we need to create a new doc
      if (item.updateStatus === 'NEW') {
         const newItemRef = doc(collection(firestore, `excel_files/${fileId}/items`));
         batch.set(newItemRef, {...itemData, id: newItemRef.id, fileId });
      } else {
         batch.update(itemRef, { ...itemData });
      }
    });

    try {
        await batch.commit();
        toast({ title: "Success", description: "All changes have been saved." });
        setIsEditing(false);
    } catch(e) {
        console.error("Save error: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not save changes." });
    }
  };


  const handleDeleteFile = () => {
    if(!firestore || !fileId) return;
    const docRef = doc(firestore, 'excel_files', fileId);
    // Note: This doesn't delete subcollections in Firestore. For a full cleanup, a Cloud Function would be needed.
    deleteDocumentNonBlocking(docRef);
    toast({ title: "File Deleted", description: `"${file?.storageName}" has been removed.` });
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
      
      let updatedItems = [...editableItems];
      const existingModels = new Set(updatedItems.map(item => item.model));

      // Rule A & B: Update existing or zero-out missing
      updatedItems = updatedItems.map(item => {
        const newItemData = importedItems.get(item.model);
        if (newItemData) { // Rule A: Model exists in new file
            if (item.quantity !== newItemData.quantity) {
                return { ...item, quantity: newItemData.quantity, updateStatus: 'UPDATED' as const };
            }
            return item; // No change
        } else { // Rule B: Model missing from new file
            return { ...item, quantity: 0, updateStatus: 'ZEROED' as const };
        }
      });
      
      // Rule C: Add new models
      importedItems.forEach((newItemData, model) => {
        if (!existingModels.has(model)) {
            updatedItems.push({
                id: `new_${Date.now()}_${model}`, // Temp ID
                fileId: fileId,
                model: newItemData.model,
                quantity: newItemData.quantity,
                notes: '',
                storageStatus: '',
                modelCondition: '',
                locationId: '',
                updateStatus: 'NEW' as const
            });
        }
      });
      
      setEditableItems(updatedItems);
      toast({ title: "File Ready for Review", description: "Review the changes and click 'Save Changes' to confirm." });

    } catch (error) {
      console.error("Error processing update file:", error);
      toast({ variant: "destructive", title: "File Error", description: "Could not process the uploaded file." });
    } finally {
        // Reset the input value to allow uploading the same file again
        if(updateFileInputRef.current) updateFileInputRef.current.value = "";
    }
  };


  const isLoading = isLoadingFile || isLoadingItems || isLoadingEmployees || isLoadingLocations;

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
            case 'ZEROED': return 'bg-status-zeroed';
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
    
    const canvas = await html2canvas(pdfCardRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: null,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth - 28; // with some margin
    const finalImgHeight = finalImgWidth / ratio;
    
    pdf.addImage(imgData, 'PNG', 14, 14, finalImgWidth, finalImgHeight);
    
    autoTable(pdf, {
      startY: finalImgHeight + 30,
      head: [['Model', 'Qty', 'Storage Status', 'Condition', 'Qty/Cond', 'Location', 'Notes']],
      body: sortedItems.map(item => [
        item.model,
        item.quantity,
        item.storageStatus || '',
        item.modelCondition || '',
        item.quantityPerCondition ?? '',
        item.locationId ? getLocationName(item.locationId) : '',
        item.notes || ''
      ]),
      theme: 'grid',
      styles: {
          fontSize: 8,
          cellPadding: 2,
      },
      headStyles: {
          fillColor: [22, 163, 74], // green-600
          textColor: 255,
          fontStyle: 'bold',
      },
    });
    
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
    XLSX.writeFile(workbook, `${file.storageName}.xlsx`);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


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
        <h2 className="text-2xl font-bold mb-2">File Not Found</h2>
        <p className="text-muted-foreground mb-6">The archived file you're looking for doesn't seem to exist.</p>
        <Button asChild>
          <Link href="/archive">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Archive
          </Link>
        </Button>
      </div>
    );
  }
  
  const employeeForFile = employees?.find(e => e.id === file.storekeeperId)

  return (
    <>
     <input
        type="file"
        ref={updateFileInputRef}
        onChange={handleFileUpdate}
        className="hidden"
        accept=".xlsx,.xls"
      />
     <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', background: 'white', color: 'black' }}>
          {file && employeeForFile && items && (
            <div ref={pdfCardRef} style={{ width: '700px' }}>
                <FilePdfCard
                    file={file}
                    employee={employeeForFile}
                    logoSrc={logoSrc}
                    statusData={statusChartData}
                    conditionData={conditionChartData}
                />
            </div>
          )}
      </div>
      <div className="p-4 md:p-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/archive">
              <ArrowLeft />
            </Link>
          </Button>
          <div className='flex items-center gap-2 flex-wrap justify-end'>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => updateFileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Update with New File
                  </Button>
                  <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/> Save Changes</Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4"/> Cancel</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)}><Edit className="mr-2"/>Edit</Button>
                  <Button variant="outline" onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button>
                  <Button variant="outline" onClick={handleDownloadExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
                  <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2"/>Delete</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This will permanently delete the file "{file.storageName}". This action cannot be undone.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteFile}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className='flex-1 min-w-[250px]'>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl md:text-3xl font-bold">{file.storageName}</CardTitle>
                                    <CardDescription className="font-semibold text-primary">{file.categoryName}</CardDescription>
                                </div>
                                <Badge variant={file.type === 'imported' ? 'default' : 'secondary'}>{file.type}</Badge>
                            </div>
                            <CardDescription className="grid grid-cols-2 md:flex md:items-center gap-x-6 gap-y-2 text-sm pt-2">
                                <span className="flex items-center gap-2"><User className="w-4 h-4"/>{getEmployeeName(file.storekeeperId)}</span>
                                <span className="flex items-center gap-2"><Building className="w-4 h-4"/>{file.source}</span>
                                <span className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4"/>
                                  {file.date && typeof file.date.toDate === 'function' ? format(file.date.toDate(), 'PPP') : 'Invalid Date'}
                                </span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
              </Card>

              {isEditing && warehouseType && (
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
                                <div className="text-center text-xs text-muted-foreground -mt-2">Inventory Status</div>
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
                                <div className="text-center text-xs text-muted-foreground -mt-2">Condition Status</div>
                            )} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </div>
          </div>
        
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>Items ({sortedItems.length})</CardTitle>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by model..."
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
                            <TableHead onClick={() => requestSort('model')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Model {getSortIcon('model')}</div></TableHead>
                            <TableHead onClick={() => requestSort('quantity')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Qty {getSortIcon('quantity')}</div></TableHead>
                            {isEditing && <TableHead>Update Status</TableHead>}
                            <TableHead onClick={() => requestSort('storageStatus')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Storage Status {getSortIcon('storageStatus')}</div></TableHead>
                            <TableHead onClick={() => requestSort('modelCondition')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Condition {getSortIcon('modelCondition')}</div></TableHead>
                            <TableHead onClick={() => requestSort('quantityPerCondition')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Qty / Cond. {getSortIcon('quantityPerCondition')}</div></TableHead>
                            <TableHead onClick={() => requestSort('locationId')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Location {getSortIcon('locationId')}</div></TableHead>
                            <TableHead onClick={() => requestSort('notes')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Notes {getSortIcon('notes')}</div></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.map((item) => (
                            <TableRow id={item.id} key={item.id} className={cn("transition-colors target:bg-primary/20 target:duration-500", getRowClass(item))}>
                                <TableCell className="font-medium">{item.model}</TableCell>
                                <TableCell>{isEditing ? 
                                    <Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.valueAsNumber)} className="w-20" /> 
                                    : item.quantity
                                }</TableCell>
                                {isEditing && <TableCell>
                                  {item.updateStatus && <Badge variant={item.updateStatus === 'NEW' || item.updateStatus === 'ZEROED' ? 'destructive' : 'default'}>{item.updateStatus}</Badge>}
                                </TableCell>}
                                <TableCell>{isEditing ? (
                                    <Select value={item.storageStatus || ''} onValueChange={v => handleItemChange(item.id, 'storageStatus', v === 'none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="Correct">Correct</SelectItem>
                                            <SelectItem value="Less">Less</SelectItem>
                                            <SelectItem value="More">More</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="flex items-center gap-2">{item.storageStatus || 'N/A'}</span>
                                )}</TableCell>
                                <TableCell className={cn("transition-colors", getConditionCellClass(item.modelCondition))}>{isEditing ? (
                                    <Select value={item.modelCondition || ''} onValueChange={v => handleItemChange(item.id, 'modelCondition', v === 'none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="Wrapped">Wrapped</SelectItem>
                                            <SelectItem value="Damaged">Damaged</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : item.modelCondition || 'N/A'}</TableCell>
                                <TableCell>{isEditing ? 
                                    <Input type="number" value={item.quantityPerCondition ?? ''} onChange={e => handleItemChange(item.id, 'quantityPerCondition', e.target.valueAsNumber)} className="w-24" />
                                    : item.quantityPerCondition ?? 'N/A'
                                }</TableCell>
                                <TableCell>{isEditing ? (
                                    <Select value={item.locationId || ''} onValueChange={v => handleItemChange(item.id, 'locationId', v === 'none' ? '' : v)} disabled={!warehouseType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={warehouseType ? "Select..." : "N/A"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">None</SelectItem>
                                          {filteredLocations.map(loc => (
                                              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {item.locationId && <MapPin className="w-4 h-4 text-muted-foreground"/>}
                                        {item.locationId ? getLocationName(item.locationId) : 'N/A'}
                                    </span>
                                )}</TableCell>
                                <TableCell>{isEditing ?
                                    <Textarea value={item.notes ?? ''} onChange={e => handleItemChange(item.id, 'notes', e.target.value)} />
                                    : item.notes || 'N/A'
                                }</TableCell>
                            </TableRow>
                        ))}
                        {paginatedItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isEditing ? 8 : 7} className="text-center h-24">No items found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
            {totalPages > 1 && <CardContent><PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></CardContent>}
          </Card>
        </div>
      </div>
    </>
  );
}
