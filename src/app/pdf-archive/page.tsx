'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { FilePdfCard } from '@/components/archive/file-pdf-card';
import { Skeleton } from '@/components/ui/skeleton';
import withAuth from '@/hooks/withAuth';

function PdfArchivePage() {
  const { t } = useTranslation();
  const { excelFiles, items, employees, locations, settings, isLoading } = useAppContext();
  const { appLogo, pdfSettings } = settings;

  const sortedFiles = useMemo(() => {
    if (!excelFiles) return [];
    return [...excelFiles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [excelFiles]);

  const getEmployeeForFile = (fileId: string) => {
    const file = excelFiles.find(f => f.id === fileId);
    if (!file) return undefined;
    return employees.find(e => e.id === file.storekeeperId);
  }

  const getItemsForFile = (fileId: string) => {
    return items.filter(i => i.fileId === fileId);
  }

  const handlePrint = () => {
    window.print();
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon"><ArrowLeft /></Button>
                <h1 className="text-2xl md:text-3xl"><Skeleton className="h-8 w-48" /></h1>
            </div>
        </header>
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/items"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl">{t('pdf_archive')}</h1>
          </div>
          <div className='flex items-center gap-2'>
              <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> {t('print')}</Button>
          </div>
        </header>
        <div className="space-y-12">
            {sortedFiles.map(file => {
            const fileItems = getItemsForFile(file.id);
            const employee = getEmployeeForFile(file.id);
            if (!employee) return null;

            return (
                <div key={file.id} className="break-after-page">
                <FilePdfCard
                    file={file}
                    items={fileItems}
                    employee={employee}
                    locations={locations}
                    logoSrc={appLogo}
                    themeColor={pdfSettings.report.reportColors?.general || '#22c55e'}
                />
                </div>
            )
            })}
            {sortedFiles.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <p>{t('no_archived_files')}</p>
            </div>
            )}
        </div>
      </div>
    </>
  )
}

export default withAuth(PdfArchivePage);
