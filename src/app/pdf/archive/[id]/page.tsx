'use client';

import { useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { FilePdfCard } from '@/components/archive/file-pdf-card';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';


export default function PdfViewPage() {
  const params = useParams();
  const fileId = params.id as string;
  const { t, language } = useTranslation();
  const { excelFiles, items, employees, locations, settings } = useAppContext();
  const { appLogo, customFont, pdfSettings } = settings;


  const file = useMemo(() => excelFiles.find(f => f.id === fileId), [excelFiles, fileId]);
  const fileItems = useMemo(() => items.filter(i => i.fileId === fileId), [items, fileId]);
  
  const isLoading = !file || !fileItems || !employees || !locations;

  const getLocationName = (id?: string) => locations?.find(l => l.id === id)?.name || 'N/A';

  const handleDownloadExcel = () => {
    if (!file || !fileItems) return;
    const dataToExport = fileItems.map(item => ({
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
  
  const handlePrint = () => {
    window.print();
  }

  if (isLoading) {
    return <div className="p-8">{t('loading')}...</div>
  }

  if (!file) {
    return (
      <div className="p-8">{t('file_not_found')}</div>
    );
  }
  
  const employeeForFile = employees?.find(e => e.id === file.storekeeperId);

  return (
    <>
      <div className="p-4 md:p-8 print:hidden">
        <header className="flex items-center justify-between gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/pdf-archive"><ArrowLeft /></Link>
          </Button>
          <div className='flex items-center gap-2 flex-wrap justify-end'>
              <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> {t('print')}</Button>
              <Button variant="outline" onClick={handleDownloadExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          </div>
        </header>

        <div className="flex justify-center bg-gray-100 dark:bg-gray-900 p-8 rounded-lg">
            <div className="w-full max-w-4xl transform scale-100">
              {employeeForFile && (
                <div>
                  <FilePdfCard
                    file={file}
                    items={fileItems}
                    employee={employeeForFile}
                    locations={locations}
                    logoSrc={appLogo}
                    themeColor={pdfSettings.report.reportColors?.general || '#22c55e'}
                  />
                </div>
              )}
            </div>
        </div>
      </div>
       <div className="hidden print:block">
            {employeeForFile && (
                <FilePdfCard
                  file={file}
                  items={fileItems}
                  employee={employeeForFile}
                  locations={locations}
                  logoSrc={appLogo}
                  themeColor={pdfSettings.report.reportColors?.general || '#22c55e'}
                />
              )}
        </div>
    </>
  );
}
