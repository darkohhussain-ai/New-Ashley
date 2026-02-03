
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar as CalendarIcon, User, Building, Clock, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import type { Employee, ExcelFile } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';


export default function ArchivePage() {
  const { excelFiles, employees } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    // Only set loading to false on the client side after data is available
    if (excelFiles && employees) {
      setIsLoading(false);
    }
  }, [excelFiles, employees]);

  const getEmployeeName = (id: string) => {
    return employees?.find(e => e.id === id)?.name || 'Unknown';
  };

  const sortedFiles = useMemo(() => {
    if (!excelFiles) return [];
    return [...excelFiles].sort((a, b) => {
      const dateA = a.date ? parseISO(a.date).getTime() : 0;
      const dateB = b.date ? parseISO(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [excelFiles]);

  const handleExportAll = () => {
    if (!sortedFiles || sortedFiles.length === 0) {
        toast({ title: t('no_data_to_export') });
        return;
    }

    const dataToExport = sortedFiles.map(file => ({
        [t('file_name')]: file.storageName,
        [t('category')]: file.categoryName,
        [t('storekeeper')]: getEmployeeName(file.storekeeperId),
        [t('source')]: file.source,
        [t('date')]: file.date ? format(parseISO(file.date), 'yyyy-MM-dd') : 'N/A',
        [t('type')]: file.type,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('excel_archive'));
    XLSX.writeFile(workbook, `Excel_Archive_Summary_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col">
        <header className="bg-card border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                  <Link href="/items">
                    <ArrowLeft />
                    <span className="sr-only">{t('back_to_placement_storage')}</span>
                  </Link>
                </Button>
                <h1 className="text-xl">{t('excel_archive')}</h1>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled>
                    <FileDown className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-8 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/items">
                  <ArrowLeft />
                  <span className="sr-only">{t('back_to_placement_storage')}</span>
                </Link>
              </Button>
              <h1 className="text-xl">{t('excel_archive')}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleExportAll} variant="outline" size="icon">
                    <FileDown className="h-4 w-4" />
                    <span className="sr-only">Export All to Excel</span>
                </Button>
            </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8 flex-1 overflow-y-auto">
        {sortedFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFiles.map(file => (
              <Card key={file.id} className="hover:border-primary hover:shadow-xl transition-all h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg leading-tight">
                        <Link href={`/archive/${file.id}`} className="hover:underline">
                          {file.storageName}
                        </Link>
                      </CardTitle>
                      <Badge variant={file.type === 'imported' ? 'default' : 'secondary'}>{file.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {getEmployeeName(file.storekeeperId)}</p>
                  <p className="flex items-center gap-2"><Building className="w-4 h-4 text-primary" /> {file.source}</p>
                  <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-primary" /> {file.date ? format(parseISO(file.date), 'PPP') : 'Invalid Date'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('no_archived_files')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_archived_files_desc')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
