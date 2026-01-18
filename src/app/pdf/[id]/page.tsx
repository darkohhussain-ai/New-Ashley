
'use client';

import { useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Calendar as CalendarIcon, Building, FileText, MapPin, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import html2canvas from 'html2canvas';
import { FilePdfCard } from '@/components/archive/file-pdf-card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useAppContext } from '@/context/app-provider';
import type { Employee, ExcelFile, Item, StorageLocation } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';


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


export default function PdfViewPage() {
  const params = useParams();
  const fileId = params.id as string;
  const { t, language } = useTranslation();
  const { excelFiles, items, employees, locations, settings } = useAppContext();
  const { appLogo: logoSrc, customFont } = settings;


  const file = useMemo(() => excelFiles.find(f => f.id === fileId), [excelFiles, fileId]);
  const fileItems = useMemo(() => items.filter(i => i.fileId === fileId), [items, fileId]);
  
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const { statusChartData, conditionChartData } = useMemo(() => {
    if (!fileItems) return { statusChartData: [], conditionChartData: [] };
    if (fileItems.length === 0) return { statusChartData: [], conditionChartData: [] };
    
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

  const isLoading = !file || !fileItems || !employees || !locations;

  const getEmployeeName = (id: string, useKurdish: boolean = false) => {
    const employee = employees?.find(e => e.id === id);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };
  const getLocationName = (id?: string) => locations?.find(l => l.id === id)?.name || 'N/A';

  const handleDownloadPdf = async () => {
    if (!file || !pdfContentRef.current) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    
    const canvas = await html2canvas(pdfContentRef.current, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: 'white',
      onclone: (document) => {
        if (customFont && language === 'ku') {
            const style = document.createElement('style');
            style.innerHTML = `@font-face { font-family: 'CustomPdfFont'; src: url(${customFont}); } body, table, div, p, h1, h2, h3 { font-family: 'CustomPdfFont' !important; }`;
            document.head.appendChild(style);
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    let finalImgWidth = pdfWidth;
    let finalImgHeight = finalImgWidth / ratio;
    
    if (finalImgHeight > pdfHeight) {
        finalImgHeight = pdfHeight;
        finalImgWidth = finalImgHeight * ratio;
    }

    const x = (pdfWidth - finalImgWidth) / 2;
    
    doc.addImage(imgData, 'PNG', x, 0, finalImgWidth, finalImgHeight);
    pdf.save(`${file.storageName}.pdf`);
  };

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

  if (isLoading) {
    return (
        <div className="p-8 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-8"></div>
            <Card className="mb-8">
                <CardHeader><div className="h-7 w-3/4 bg-muted rounded"></div></CardHeader>
            </Card>
            <Card><CardHeader><div className="h-6 w-40 bg-muted rounded"></div></CardHeader><CardContent><div className="h-40 w-full bg-muted rounded"></div></CardContent></Card>
        </div>
    );
  }

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
        <FileText className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('file_not_found')}</h2>
        <p className="text-muted-foreground mb-6">{t('file_not_found_desc')}</p>
        <Button asChild><Link href="/pdf-archive"><ArrowLeft className="mr-2 h-4 w-4" />{t('back_to_archive')}</Link></Button>
      </div>
    );
  }
  
  const employeeForFile = employees?.find(e => e.id === file.storekeeperId);

  return (
    <>
      <div className="p-4 md:p-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/pdf-archive"><ArrowLeft /></Link>
          </Button>
          <div className='flex items-center gap-2 flex-wrap justify-end'>
              <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button>
              <Button variant="outline" onClick={handleDownloadExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          </div>
        </header>

        <div ref={pdfContentRef} className="bg-white text-black p-4 rounded-lg shadow-lg">
            {employeeForFile && <FilePdfCard
                file={file}
                employee={employeeForFile}
                logoSrc={logoSrc}
                statusData={statusChartData}
                conditionData={conditionChartData}
            />}
             <div className="overflow-x-auto mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Storage Status</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Qty / Cond.</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fileItems?.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.model}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.storageStatus || 'N/A'}</TableCell>
                                <TableCell>{item.modelCondition || 'N/A'}</TableCell>
                                <TableCell>{item.quantityPerCondition ?? 'N/A'}</TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-2">
                                        {item.locationId && <MapPin className="w-4 h-4 text-muted-foreground"/>}
                                        {getLocationName(item.locationId)}
                                    </span>
                                </TableCell>
                                <TableCell>{item.notes || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                        {(!fileItems || fileItems.length === 0) && (
                            <TableRow><TableCell colSpan={7} className="text-center h-24">No items found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
              <div className="pt-24 px-4 text-right">
                <div className="inline-block text-center mt-8">
                    <p className="border-t border-gray-400 pt-2 w-48 text-sm text-gray-700">{t('warehouse_manager_signature')}</p>
                </div>
              </div>
        </div>
      </div>
    </>
  );
}
