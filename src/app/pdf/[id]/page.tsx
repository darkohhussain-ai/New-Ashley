
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
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import html2canvas from 'html2canvas';
import { FilePdfCard } from '@/components/archive/file-pdf-card';
import useLocalStorage from '@/hooks/use-local-storage';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useAppContext } from '@/context/app-provider';
import type { Employee, ExcelFile, Item, StorageLocation } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { shapeText } from '@/lib/pdf-utils';


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
  const { excelFiles, items, employees, locations } = useAppContext();

  const defaultLogo = "https://picsum.photos/seed/1/300/100";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);


  const file = useMemo(() => excelFiles.find(f => f.id === fileId), [excelFiles, fileId]);
  const fileItems = useMemo(() => items.filter(i => i.fileId === fileId), [items, fileId]);
  
  const pdfCardRef = useRef<HTMLDivElement>(null);

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

  const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.name || '...';
  const getLocationName = (id?: string) => locations?.find(l => l.id === id)?.name || 'N/A';

  const handleDownloadPdf = async () => {
    if (!file || !fileItems || !pdfCardRef.current) return;
    
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

    const canvas = await html2canvas(pdfCardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth - 28;
    const finalImgHeight = finalImgWidth / ratio;
    
    pdf.addImage(imgData, 'PNG', 14, 14, finalImgWidth, finalImgHeight);
    
    autoTable(pdf, {
      startY: finalImgHeight + 30,
      head: [[shapeText(t('model')), t('quantity'), shapeText(t('storage_status')), shapeText(t('condition')), t('qty_per_condition'), shapeText(t('location')), shapeText(t('notes'))]],
      body: fileItems.map(item => [
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
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: 'bold',
      },
    });
    
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
     <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', background: 'white', color: 'black' }}>
          {file && employeeForFile && fileItems && (
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
            <Link href="/pdf-archive"><ArrowLeft /></Link>
          </Button>
          <div className='flex items-center gap-2 flex-wrap justify-end'>
              <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button>
              <Button variant="outline" onClick={handleDownloadExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
              <Card>
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
                        <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/>{file.date ? format(parseISO(file.date), 'PPP') : 'Invalid Date'}</span>
                    </CardDescription>
                </CardHeader>
              </Card>
              
               <div className='flex gap-4 items-center justify-center flex-wrap'>
                    {statusChartData.length > 0 && (
                      <ChartContainer config={statusChartConfig} className="min-h-[120px] w-full max-w-[300px]">
                        <ResponsiveContainer>
                          <PieChart>
                            <Tooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const { name, value } = payload[0].payload;
                                  const total = statusChartData.reduce((acc, curr) => acc + curr.value, 0);
                                  return (<div className="p-2 text-sm bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm"><p className="font-bold">{`${name}: ${((value / total) * 100).toFixed(0)}% (${value})`}</p></div>);
                                }
                                return null;
                              }} />
                            <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} strokeWidth={2}>
                              {statusChartData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.fill} />))}
                            </Pie>
                            <Legend content={() => (<div className="text-center text-xs text-muted-foreground -mt-2">Inventory Status</div>)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                    {conditionChartData.length > 0 && (
                      <ChartContainer config={conditionChartConfig} className="min-h-[120px] w-full max-w-[300px]">
                        <ResponsiveContainer>
                          <PieChart>
                            <Tooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const { name, value } = payload[0].payload;
                                  const total = conditionChartData.reduce((acc, curr) => acc + curr.value, 0);
                                  return (<div className="p-2 text-sm bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm"><p className="font-bold">{`${name}: ${((value / total) * 100).toFixed(0)}% (${value})`}</p></div>);
                                }
                                return null;
                              }}/>
                            <Pie data={conditionChartData} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} strokeWidth={2}>
                              {conditionChartData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.fill} />))}
                            </Pie>
                            <Legend content={() => (<div className="text-center text-xs text-muted-foreground -mt-2">Condition Status</div>)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </div>
          </div>
        
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Items ({fileItems?.length || 0})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
