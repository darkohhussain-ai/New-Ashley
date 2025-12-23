
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, Timestamp, writeBatch } from 'firebase/firestore';
import { ArrowLeft, User, Calendar as CalendarIcon, Building, FileText, MapPin, Edit, Trash2, Save, X, ArrowUpDown, ArrowDown, ArrowUp, FileSpreadsheet } from 'lucide-react';
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
  storageStatus?: 'Correct' | 'Less' | 'More';
  modelCondition?: 'Wrapped' | 'Damaged';
  quantityPerCondition?: number;
  locationId?: string;
};

type Employee = { id: string; name: string; };
type StorageLocation = { id: string; name: string; warehouseType: 'Ashley' | 'Huana'; };
type SortableKeys = keyof Item;

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const fileId = params.id as string;
  const firestore = useFirestore();

  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState<Item[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'model', direction: 'ascending' });

  const fileRef = useMemoFirebase(() => (firestore && fileId ? doc(firestore, 'excel_files', fileId) : null), [firestore, fileId]);
  const { data: file, isLoading: isLoadingFile } = useDoc<ExcelFile>(fileRef);

  const itemsRef = useMemoFirebase(() => (firestore && fileId ? collection(firestore, `excel_files/${fileId}/items`) : null), [firestore, fileId]);
  const { data: items, isLoading: isLoadingItems } = useCollection<Item>(itemsRef);
  
  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);
  
  const locationsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'storage_locations') : null), [firestore]);
  const { data: locations, isLoading: isLoadingLocations } = useCollection<StorageLocation>(locationsRef);

  useEffect(() => {
    if (items) {
      setEditableItems(JSON.parse(JSON.stringify(items))); // Deep copy for editing
    }
  }, [items]);

  const sortedItems = useMemo(() => {
    const itemsToProcess = isEditing ? editableItems : (items || []);
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
  }, [editableItems, items, isEditing, sortConfig]);

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
    if (!firestore) return;
    const batch = writeBatch(firestore);
    sortedItems.forEach(item => {
      const itemRef = doc(firestore, `excel_files/${fileId}/items`, item.id);
      const { id, ...itemData } = item;
      batch.update(itemRef, { ...itemData });
    });
    try {
        await batch.commit();
        toast({ title: "Success", description: "All changes have been saved." });
        setIsEditing(false);
    } catch(e) {
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

  const isLoading = isLoadingFile || isLoadingItems || isLoadingEmployees || isLoadingLocations;

  const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.name || '...';
  const getLocationName = (id: string) => locations?.find(l => l.id === id)?.name || '...';
  
  const getWarehouseTypeFromSource = (source?: string) => {
      if (source === 'Ashley Store') return 'Ashley';
      if (source === 'Huana Store') return 'Huana';
      return null;
  }
  const warehouseType = getWarehouseTypeFromSource(file?.source);
  const filteredLocations = (type: 'Ashley' | 'Huana') => locations?.filter(l => l.warehouseType === type) ?? [];

  const getRowClass = (status?: 'Correct' | 'Less' | 'More') => {
    switch (status) {
      case 'Correct':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'Less':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'More':
        return 'bg-blue-100 dark:bg-blue-900/30';
      default:
        return '';
    }
  };
  
  const handleDownloadPdf = () => {
    if (!file || !sortedItems) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(file.storageName, 14, 22);
    doc.setFontSize(11);
    doc.text(file.categoryName, 14, 30);
    const fileDate = file.date && typeof file.date.toDate === 'function' ? format(file.date.toDate(), 'PPP') : 'Invalid Date';
    doc.text(`Date: ${fileDate}`, 14, 36);

    autoTable(doc, {
      startY: 45,
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
    });
    
    doc.save(`${file.storageName}.pdf`);
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

  return (
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
                <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/> Save Changes</Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4"/> Cancel</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)}><Edit className="mr-2"/>Edit</Button>
                <Button variant="outline" onClick={handleDownloadPdf}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
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

      <Card className="mb-8">
        <CardHeader>
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
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead onClick={() => requestSort('model')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Model {getSortIcon('model')}</div></TableHead>
                        <TableHead onClick={() => requestSort('quantity')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Qty {getSortIcon('quantity')}</div></TableHead>
                        <TableHead onClick={() => requestSort('storageStatus')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Storage Status {getSortIcon('storageStatus')}</div></TableHead>
                        <TableHead onClick={() => requestSort('modelCondition')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Condition {getSortIcon('modelCondition')}</div></TableHead>
                        <TableHead onClick={() => requestSort('quantityPerCondition')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Qty / Cond. {getSortIcon('quantityPerCondition')}</div></TableHead>
                        <TableHead onClick={() => requestSort('locationId')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Location {getSortIcon('locationId')}</div></TableHead>
                        <TableHead onClick={() => requestSort('notes')} className="cursor-pointer hover:bg-muted"><div className="flex items-center">Notes {getSortIcon('notes')}</div></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedItems.map((item) => (
                        <TableRow key={item.id} className={cn("transition-colors", getRowClass(item.storageStatus))}>
                            <TableCell className="font-medium">{item.model}</TableCell>
                            <TableCell>{isEditing ? 
                                <Input type="number" value={item.quantity} disabled className="w-20 bg-muted/50 border-none" /> 
                                : item.quantity
                            }</TableCell>
                             <TableCell>{isEditing ? (
                                <Select value={item.storageStatus} onValueChange={v => handleItemChange(item.id, 'storageStatus', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Correct">Correct</SelectItem>
                                        <SelectItem value="Less">Less</SelectItem>
                                        <SelectItem value="More">More</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="flex items-center gap-2">{item.storageStatus || 'N/A'}</span>
                            )}</TableCell>
                            <TableCell>{isEditing ? (
                                <Select value={item.modelCondition} onValueChange={v => handleItemChange(item.id, 'modelCondition', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
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
                                <Select value={item.locationId} onValueChange={v => handleItemChange(item.id, 'locationId', v)} disabled={!warehouseType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={warehouseType ? "Select..." : "N/A"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {warehouseType && filteredLocations(warehouseType).map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {item.locationId && <MapPin className="w-4 h-4 text-muted-foreground"/>}
                                    {item.locationId ? getLocationName(item.id) : 'N/A'}
                                </span>
                            )}</TableCell>
                            <TableCell>{isEditing ?
                                <Textarea value={item.notes ?? ''} onChange={e => handleItemChange(item.id, 'notes', e.target.value)} />
                                : item.notes || 'N/A'
                            }</TableCell>
                        </TableRow>
                    ))}
                     {items && items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">No items found in this file.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
