
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, Timestamp } from 'firebase/firestore';
import { ArrowLeft, User, Calendar as CalendarIcon, Building, Loader2, FileText, MapPin, PackageCheck, PackageX, Package, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

type ExcelFile = {
  id: string;
  storekeeperId: string;
  storageName: string;
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
type StorageLocation = { id: string; name: string; };

export default function FileDetailPage() {
  const params = useParams();
  const fileId = params.id as string;
  const firestore = useFirestore();

  const fileRef = useMemoFirebase(() => (firestore && fileId ? doc(firestore, 'excel_files', fileId) : null), [firestore, fileId]);
  const { data: file, isLoading: isLoadingFile } = useDoc<ExcelFile>(fileRef);

  const itemsRef = useMemoFirebase(() => (firestore && fileId ? collection(firestore, `excel_files/${fileId}/items`) : null), [firestore, fileId]);
  const { data: items, isLoading: isLoadingItems } = useCollection<Item>(itemsRef);
  
  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);
  
  const locationsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'storage_locations') : null), [firestore]);
  const { data: locations, isLoading: isLoadingLocations } = useCollection<StorageLocation>(locationsRef);

  const isLoading = isLoadingFile || isLoadingItems || isLoadingEmployees || isLoadingLocations;

  const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.name || '...';
  const getLocationName = (id: string) => locations?.find(l => l.id === id)?.name || '...';
  
  const getStatusIcon = (status?: string) => {
    switch (status) {
        case 'Correct': return <PackageCheck className="w-4 h-4 text-green-500" />;
        case 'Less': return <PackageX className="w-4 h-4 text-orange-500" />;
        case 'More': return <Package className="w-4 h-4 text-blue-500" />;
        default: return null;
    }
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
            <Button variant="outline"><Edit className="mr-2"/>Edit</Button>
            <Button variant="destructive"><Trash2 className="mr-2"/>Delete</Button>
        </div>
      </header>

      <Card className="mb-8">
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle className="text-2xl md:text-3xl font-bold">{file.storageName}</CardTitle>
                <Badge variant={file.type === 'imported' ? 'default' : 'secondary'}>{file.type}</Badge>
            </div>
            <CardDescription className="grid grid-cols-2 md:flex md:items-center gap-x-6 gap-y-2 text-sm pt-2">
                <span className="flex items-center gap-2"><User className="w-4 h-4"/>{getEmployeeName(file.storekeeperId)}</span>
                <span className="flex items-center gap-2"><Building className="w-4 h-4"/>{file.source}</span>
                <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/>{format(file.date.toDate(), 'PPP')}</span>
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
                        <TableHead>Model</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Storage Status</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Qty / Condition</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items && items.length > 0 ? items.map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.model}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                                <span className="flex items-center gap-2">{getStatusIcon(item.storageStatus)} {item.storageStatus || 'N/A'}</span>
                            </TableCell>
                            <TableCell>{item.modelCondition || 'N/A'}</TableCell>
                            <TableCell>{item.quantityPerCondition ?? 'N/A'}</TableCell>
                            <TableCell>
                               <span className="flex items-center gap-2">
                                {item.locationId && <MapPin className="w-4 h-4 text-muted-foreground"/>}
                                {item.locationId ? getLocationName(item.locationId) : 'N/A'}
                               </span>
                            </TableCell>
                            <TableCell>{item.notes || 'N/A'}</TableCell>
                        </TableRow>
                    )) : (
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
