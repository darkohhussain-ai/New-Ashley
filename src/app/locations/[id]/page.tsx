
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { ArrowLeft, Box, Building, Calendar, FileText, MapPin, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type StorageLocation = {
  id: string;
  name: string;
  warehouseType: 'Ashley' | 'Huana';
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

type ExcelFile = {
    id: string;
    storageName: string;
    categoryName: string;
    date: any; 
};

export default function LocationDetailPage() {
  const params = useParams();
  const locationId = params.id as string;
  const firestore = useFirestore();

  // Fetch the current location's details
  const locationRef = useMemoFirebase(() => (firestore && locationId ? doc(firestore, 'storage_locations', locationId) : null), [firestore, locationId]);
  const { data: location, isLoading: isLoadingLocation } = useDoc<StorageLocation>(locationRef);

  // Query for items that have this locationId
  const itemsQuery = useMemoFirebase(() => (firestore && locationId ? query(collection(firestore, 'items'), where('locationId', '==', locationId)) : null), [firestore, locationId]);
  const { data: items, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);
  
  // Fetch all excel files to map fileId to file details
  const filesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'excel_files') : null), [firestore]);
  const { data: excelFiles, isLoading: isLoadingFiles } = useCollection<ExcelFile>(filesRef);

  const fileMap = useMemo(() => {
    if (!excelFiles) return new Map();
    return new Map(excelFiles.map(file => [file.id, file]));
  }, [excelFiles]);


  const isLoading = isLoadingLocation || isLoadingItems || isLoadingFiles;

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded mb-8"></div>
        <Card>
          <CardHeader>
            <div className="h-7 w-1/2 bg-muted rounded"></div>
            <div className="h-4 w-1/3 bg-muted rounded mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-40 w-full bg-muted rounded mt-4"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
        <MapPin className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Location Not Found</h2>
        <p className="text-muted-foreground mb-6">The location you're looking for doesn't seem to exist.</p>
        <Button asChild>
          <Link href="/locations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Locations
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/locations">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <MapPin className="w-8 h-8 text-primary"/>
                {location.name}
            </h1>
            <p className="text-muted-foreground font-semibold flex items-center gap-2 mt-1">
                <Warehouse className="w-5 h-5" /> {location.warehouseType} Warehouse
            </p>
        </div>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Items in this Location</CardTitle>
          <CardDescription>A list of all items currently assigned to "{location.name}".</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Source File</TableHead>
                  <TableHead>File Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items && items.length > 0 ? (
                  items.map(item => {
                    const parentFile = fileMap.get(item.fileId);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.model}</TableCell>
                        <TableCell>
                          <Badge variant={item.modelCondition === 'Damaged' ? 'destructive' : 'secondary'}>
                            {item.modelCondition || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                            <Link href={`/archive/${item.fileId}`} className="hover:underline text-primary flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {parentFile?.storageName || '...'}
                            </Link>
                        </TableCell>
                        <TableCell>
                            {parentFile && parentFile.date && typeof parentFile.date.toDate === 'function' ? (
                                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground"/>{format(parentFile.date.toDate(), 'PPP')}</span>
                            ) : 'N/A'}
                        </TableCell>
                        <TableCell>{item.notes || <span className="text-muted-foreground/50">No notes</span>}</TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No items are currently stored in this location.
                    </TableCell>
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
