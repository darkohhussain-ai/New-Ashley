
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { ArrowLeft, FileText, Calendar as CalendarIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type ExcelFile = {
  id: string;
  storekeeperId: string;
  storageName: string;
  categoryName: string;
  date: Timestamp;
  source: string;
  type: 'new' | 'imported';
};

type Employee = {
  id: string;
  name: string;
};

export default function PdfArchivePage() {
  const firestore = useFirestore();

  const filesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'excel_files') : null), [firestore]);
  const { data: files, isLoading: isLoadingFiles } = useCollection<ExcelFile>(filesRef);

  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);

  const getEmployeeName = (id: string) => {
    return employees?.find(e => e.id === id)?.name || 'Unknown';
  };

  const sortedFiles = useMemo(() => {
    if (!files) return [];
    return [...files].sort((a, b) => {
      const dateA = a.date && typeof a.date.toDate === 'function' ? a.date.toDate().getTime() : 0;
      const dateB = b.date && typeof b.date.toDate === 'function' ? b.date.toDate().getTime() : 0;
      return dateB - dateA;
    });
  }, [files]);
  
  const isLoading = isLoadingFiles || isLoadingEmployees;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/items">
            <ArrowLeft />
            <span className="sr-only">Back to Placement & Storage</span>
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">PDF Report Archive</h1>
      </header>
      <main>
        {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="items-center text-center">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="h-5 w-3/4 mt-4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent className="text-center">
                            <Skeleton className="h-4 w-2/3 mx-auto" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : sortedFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedFiles.map(file => (
              <Link key={file.id} href={`/pdf/${file.id}`} className="group">
                <Card className="hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col p-4 items-center text-center">
                  <FileText className="w-12 h-12 text-primary/70 group-hover:text-primary transition-colors" />
                  <CardHeader className="p-2">
                    <CardTitle className="text-base leading-tight">
                        {file.storageName}
                    </CardTitle>
                    <CardDescription className="text-xs">{file.categoryName}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 mt-auto text-xs text-muted-foreground w-full">
                     <p className="flex items-center justify-center gap-1.5"><User className="w-3 h-3"/> {getEmployeeName(file.storekeeperId)}</p>
                     <p className="flex items-center justify-center gap-1.5 mt-1"><CalendarIcon className="w-3 h-3"/> {file.date && typeof file.date.toDate === 'function' ? format(file.date.toDate(), 'PPP') : 'Invalid Date'}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Files Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Import or create your first Excel file to see it here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
