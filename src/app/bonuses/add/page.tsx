
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, User, Edit, Save, X, FileDown, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAppContext } from '@/context/app-provider';
import type { Bonus, AllPdfSettings } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useTranslation } from '@/hooks/use-translation';

const BONUS_RATE = 5000; // 5,000 IQD per load

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AddBonusPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { employees, bonuses, setBonuses } = useAppContext();
  const [pdfSettings] = useLocalStorage<AllPdfSettings>('pdf-settings', { report: {}, invoice: {}, card: {} });

  const dateParam = searchParams.get('date');

  const getInitialDate = () => {
    if (dateParam) {
      const parsedDate = parseISO(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date();
  };
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getInitialDate());
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loadCount, setLoadCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editingRecord, setEditingRecord] = useState<Bonus | null>(null);
  
  const pdfHeaderRef = useRef<HTMLDivElement>(null);

  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing');
  }, [employees]);

  const dailyBonuses = useMemo(() => {
    if (!bonuses || !selectedDate) return [];
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return bonuses.filter(record => {
        const recordDate = parseISO(record.date);
        return isWithinInterval(recordDate, { start, end });
    }).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [bonuses, selectedDate]);

  const sortedEmployees = useMemo(() => {
    if (!warehouseEmployees) return [];
    return [...warehouseEmployees].sort((a, b) => a.name.localeCompare(b.name));
  }, [warehouseEmployees]);

  const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.name || '...';
  
  const resetForm = () => {
    setSelectedEmployee('');
    setLoadCount('1');
    setNotes('');
  };
  
  const startEditing = (record: Bonus) => {
    setEditingRecord(JSON.parse(JSON.stringify(record))); // Deep copy
  };
  
  const cancelEditing = () => {
    setEditingRecord(null);
  };
  
  const handleUpdateRecord = () => {
    if(!editingRecord) return;
    
    setIsSaving(true);
    
    const updatedData = {
        ...editingRecord,
        totalAmount: editingRecord.loadCount * editingRecord.rate,
    };
    
    setBonuses(bonuses.map(rec => rec.id === updatedData.id ? updatedData : rec));
    toast({ title: t('save_changes'), description: t('bonus_record_updated') });
    setEditingRecord(null);
    setIsSaving(false);
  };

  const handleAddBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !loadCount || !selectedDate || parseInt(loadCount) <= 0) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('add_bonus_validation_error') });
      return;
    }
    
    setIsSaving(true);
    const bonusData: Bonus = {
      id: crypto.randomUUID(),
      employeeId: selectedEmployee,
      date: selectedDate.toISOString(),
      loadCount: parseInt(loadCount),
      rate: BONUS_RATE,
      totalAmount: parseInt(loadCount) * BONUS_RATE,
      notes,
    };

    setBonuses([...bonuses, bonusData]);
    toast({ title: t('bonus_added'), description: t('bonus_added_desc') });
    resetForm();
    setIsSaving(false);
  };

  const handleDelete = (record: Bonus) => {
    setBonuses(bonuses.filter(rec => rec.id !== record.id));
    toast({ title: t('record_deleted'), description: t('bonus_record_deleted') });
  };
  
  const { totalLoads, totalAmount } = useMemo(() => {
    if (!dailyBonuses) return { totalLoads: 0, totalAmount: 0 };
    return dailyBonuses.reduce(
        (acc, record) => {
            acc.totalLoads += record.loadCount;
            acc.totalAmount += record.totalAmount;
            return acc;
        }, { totalLoads: 0, totalAmount: 0 });
  }, [dailyBonuses]);


  const isLoading = !employees || !bonuses;

  const handleDownloadPdf = async () => {
    if (!pdfHeaderRef.current || !selectedDate || !dailyBonuses) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const settings = pdfSettings.report || {};
    
    if (settings.customFont) {
        const fontName = "CustomFont";
        const fontStyle = "normal";
        const fontBase64 = settings.customFont.split(',')[1];
        doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
        doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
        doc.setFont(fontName);
    }

    const canvas = await html2canvas(pdfHeaderRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const ratio = canvas.width / canvas.height;
    const finalImgWidth = pdfWidth;
    const finalImgHeight = finalImgWidth / ratio;
    
    doc.addImage(imgData, 'PNG', 0, 0, finalImgWidth, finalImgHeight);

    autoTable(doc, {
        startY: finalImgHeight + 10,
        head: [[t('employee'), t('loads'), t('notes'), t('amount')]],
        body: dailyBonuses.map(item => [getEmployeeName(item.employeeId), item.loadCount, item.notes || 'N/A', formatCurrency(item.totalAmount)]),
        foot: [[t('total'), totalLoads.toFixed(0), '', formatCurrency(totalAmount)]],
        theme: 'striped',
        headStyles: { fillColor: settings.reportColors?.bonus || settings.themeColor || '#22c55e' },
        footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
        didParseCell: (data) => { if (settings.customFont) { (data.cell.styles as any).font = "CustomFont"; } }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 40;
    const pageHeight = doc.internal.pageSize.height;
    if (finalY > pageHeight - 30) {
        doc.addPage();
    }
    const signatureY = finalY > pageHeight - 50 ? 40 : finalY;
    doc.setFontSize(10);
    doc.text("...................................", doc.internal.pageSize.width - 120, signatureY, { align: 'center' });
    doc.text("Warehouse Manager Signature", doc.internal.pageSize.width - 120, signatureY + 10, { align: 'center' });

    doc.save(`bonus-report-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <>
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      {selectedDate && (
         <div ref={pdfHeaderRef} style={{ width: '700px', background: 'white', color: 'black' }}>
            <ReportPdfHeader
              title={t('daily_bonus_report')}
              subtitle={format(selectedDate, 'PPP')}
              logoSrc={pdfSettings.report?.logo ?? null}
              themeColor={pdfSettings.report?.reportColors?.bonus ?? pdfSettings.report?.themeColor}
              headerText={pdfSettings.report?.headerText}
            />
          </div>
      )}
    </div>
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/bonuses">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">{t('daily_bonuses')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>{t('pick_a_date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); if (dateParam) router.push('/bonuses/add'); }} initialFocus captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
             <Button variant="outline" onClick={handleDownloadPdf} disabled={!dailyBonuses || dailyBonuses.length === 0}><FileDown className="mr-2 h-4 w-4" />PDF</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle>{t('add_bonus_record')}</CardTitle>
                    <CardDescription>{t('add_bonus_record_desc')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddBonus}>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="employee">{t('employee')}</label>
                        <Select onValueChange={setSelectedEmployee} value={selectedEmployee} disabled={isSaving}>
                        <SelectTrigger id="employee">
                            <SelectValue placeholder={t('select_an_employee')} />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoading ? (
                            <SelectItem value="loading" disabled>{t('loading')}...</SelectItem>
                            ) : (
                            sortedEmployees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))
                            )}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="loadCount">{t('number_of_loads')}</label>
                        <div className="relative">
                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="loadCount" type="number" value={loadCount} onChange={e => setLoadCount(e.target.value)} required placeholder="e.g., 2" className="pl-8" disabled={isSaving} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="notes">{t('notes')}</label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_optional')} disabled={isSaving}/>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('bonus_rate', {rate: formatCurrency(BONUS_RATE)})}
                    </p>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSaving}>
                            <Plus className="mr-2 h-4 w-4" /> {t('add_record')}
                        </Button>
                    </CardFooter>
                </form>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('bonus_records_for_date', {date: selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'})}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">{t('loading_records')}...</div>
                    ) : dailyBonuses && dailyBonuses.length > 0 ? (
                        dailyBonuses.map(record => (
                        <div key={record.id} className="py-3 flex justify-between items-start gap-4">
                            {editingRecord?.id === record.id ? (
                            <div className="flex-1 space-y-2">
                                <p className="font-bold">{getEmployeeName(record.employeeId)}</p>
                                <Input 
                                    type="number" 
                                    value={editingRecord.loadCount}
                                    onChange={(e) => setEditingRecord({...editingRecord, loadCount: parseInt(e.target.value) || 0})}
                                    className="h-8"
                                />
                                <Textarea 
                                    value={editingRecord.notes}
                                    onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                                    placeholder={t('notes_optional')}
                                />
                            </div>
                            ) : (
                            <div className="flex-1">
                                <p className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {getEmployeeName(record.employeeId)}</p>
                                <p className="text-sm text-muted-foreground">{record.loadCount} {t('loads')}</p>
                                {record.notes && <p className="text-sm mt-1">{record.notes}</p>}
                            </div>
                            )}
                            <div className='flex flex-col items-end'>
                                <p className="font-semibold text-primary">{formatCurrency(record.totalAmount)}</p>
                                {editingRecord?.id === record.id ? (
                                    <div className="flex gap-1 mt-2">
                                        <Button size="icon" className="h-8 w-8" onClick={handleUpdateRecord} disabled={isSaving}><Save className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 mt-1">
                                        <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-8 w-8" onClick={() => startEditing(record)}>
                                            <Edit className="h-4 w-4"/>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('delete_this_record')}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                    {t('confirm_delete_bonus', {employeeName: getEmployeeName(record.employeeId)})}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(record)}>{t('delete')}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">{t('no_bonus_records_for_date')}</div>
                    )}
                    </div>
                </CardContent>
                {dailyBonuses && dailyBonuses.length > 0 && (
                    <CardFooter className="flex justify-between font-bold bg-muted/50 py-4 rounded-b-lg">
                        <span>{t('total')}</span>
                        <div className='text-right'>
                            <p>{totalLoads.toFixed(0)} {t('loads')}</p>
                            <p className="text-primary">{formatCurrency(totalAmount)}</p>
                        </div>
                    </CardFooter>
                )}
                </Card>
            </div>
            </div>
      </main>
    </div>
    </>
  );
}

    