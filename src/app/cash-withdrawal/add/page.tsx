
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, User, Edit, Save, X, FileDown, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAppContext } from '@/context/app-provider';
import type { CashWithdrawal, AllPdfSettings } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCurrencyForPdf = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount);
};


export default function AddCashWithdrawalPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { employees, withdrawals, setWithdrawals } = useAppContext();
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
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editingRecord, setEditingRecord] = useState<CashWithdrawal | null>(null);
  
  const pdfHeaderRef = useRef<HTMLDivElement>(null);

  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing');
  }, [employees]);

  const dailyWithdrawals = useMemo(() => {
    if (!withdrawals || !selectedDate) return [];
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return withdrawals.filter(record => {
        const recordDate = parseISO(record.date);
        return isWithinInterval(recordDate, { start, end });
    }).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [withdrawals, selectedDate]);

  const sortedEmployees = useMemo(() => {
    if (!warehouseEmployees) return [];
    return [...warehouseEmployees].sort((a, b) => a.name.localeCompare(b.name));
  }, [warehouseEmployees]);

  const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.name || '...';
  
  const resetForm = () => {
    setSelectedEmployee('');
    setAmount('');
    setNotes('');
  };
  
  const startEditing = (record: CashWithdrawal) => {
    setEditingRecord(JSON.parse(JSON.stringify(record))); // Deep copy
  };
  
  const cancelEditing = () => {
    setEditingRecord(null);
  };
  
  const handleUpdateRecord = () => {
    if(!editingRecord) return;
    
    setIsSaving(true);
    
    setWithdrawals(withdrawals.map(rec => rec.id === editingRecord.id ? editingRecord : rec));
    toast({ title: 'Success', description: 'Withdrawal record updated.' });
    setEditingRecord(null);
    setIsSaving(false);
  };

  const handleAddWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !amount || !selectedDate || parseFloat(amount) <= 0) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please select an employee and enter a valid amount.' });
      return;
    }
    
    setIsSaving(true);
    const withdrawalData: CashWithdrawal = {
      id: crypto.randomUUID(),
      employeeId: selectedEmployee,
      date: selectedDate.toISOString(),
      amount: parseFloat(amount),
      notes,
    };

    setWithdrawals([...withdrawals, withdrawalData]);
    toast({ title: 'Withdrawal Added', description: 'The record has been added.' });
    resetForm();
    setIsSaving(false);
  };

  const handleDelete = (record: CashWithdrawal) => {
    setWithdrawals(withdrawals.filter(rec => rec.id !== record.id));
    toast({ title: 'Record Deleted', description: 'The withdrawal record has been removed.' });
  };
  
  const { totalAmount } = useMemo(() => {
    if (!dailyWithdrawals) return { totalAmount: 0 };
    return dailyWithdrawals.reduce((acc, record) => {
        acc.totalAmount += record.amount;
        return acc;
    }, { totalAmount: 0 });
  }, [dailyWithdrawals]);

  const isLoading = !employees || !withdrawals;

  const handleDownloadPdf = async () => {
    if (!pdfHeaderRef.current || !selectedDate || !dailyWithdrawals) return;
    
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
        head: [['Employee', 'Notes', 'Amount']],
        body: dailyWithdrawals.map(item => [getEmployeeName(item.employeeId), item.notes || 'N/A', formatCurrencyForPdf(item.amount)]),
        foot: [['Total', '', formatCurrencyForPdf(totalAmount)]],
        theme: 'striped',
        headStyles: { fillColor: settings.themeColor || '#22c55e' },
        footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
        didParseCell: (data) => { if (settings.customFont) { (data.cell.styles as any).font = "CustomFont"; } }
    });
    
    doc.save(`cash-withdrawal-report-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <>
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      {selectedDate && (
         <div ref={pdfHeaderRef} style={{ width: '700px', background: 'white', color: 'black' }}>
            <ReportPdfHeader
              title="Daily Cash Withdrawal Report"
              subtitle={format(selectedDate, 'PPP')}
              logoSrc={pdfSettings.report?.logo ?? null}
              themeColor={pdfSettings.report?.themeColor}
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
              <Link href="/cash-withdrawal">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Daily Cash Withdrawals</h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                 <Calendar mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); if (dateParam) router.push('/cash-withdrawal/add'); }} initialFocus captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
             <Button variant="outline" onClick={handleDownloadPdf} disabled={!dailyWithdrawals || dailyWithdrawals.length === 0}><FileDown className="mr-2 h-4 w-4" />PDF</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle>Add Withdrawal Record</CardTitle>
                    <CardDescription>Select an employee and enter the amount they wish to withdraw from their salary.</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddWithdrawal}>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="employee">Employee</label>
                        <Select onValueChange={setSelectedEmployee} value={selectedEmployee} disabled={isSaving}>
                        <SelectTrigger id="employee">
                            <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                            ) : (
                            sortedEmployees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))
                            )}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="amount">Amount (IQD)</label>
                        <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="e.g., 100000" className="pl-8" disabled={isSaving} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="notes">Notes</label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" disabled={isSaving}/>
                    </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSaving}>
                            <Plus className="mr-2 h-4 w-4" /> Add Record
                        </Button>
                    </CardFooter>
                </form>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Withdrawals for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading records...</div>
                    ) : dailyWithdrawals && dailyWithdrawals.length > 0 ? (
                        dailyWithdrawals.map(record => (
                        <div key={record.id} className="py-3 flex justify-between items-start gap-4">
                            {editingRecord?.id === record.id ? (
                            <div className="flex-1 space-y-2">
                                <p className="font-bold">{getEmployeeName(record.employeeId)}</p>
                                <Input 
                                    type="number" 
                                    value={editingRecord.amount}
                                    onChange={(e) => setEditingRecord({...editingRecord, amount: parseFloat(e.target.value) || 0})}
                                    className="h-8"
                                />
                                <Textarea 
                                    value={editingRecord.notes}
                                    onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                                    placeholder="Notes..."
                                />
                            </div>
                            ) : (
                            <div className="flex-1">
                                <p className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {getEmployeeName(record.employeeId)}</p>
                                {record.notes && <p className="text-sm mt-1">{record.notes}</p>}
                            </div>
                            )}
                            <div className='flex flex-col items-end'>
                                <p className="font-semibold text-primary">{formatCurrency(record.amount)}</p>
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
                                                    <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                    This will permanently delete the withdrawal record for {getEmployeeName(record.employeeId)}.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(record)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">No withdrawal records for this date.</div>
                    )}
                    </div>
                </CardContent>
                {dailyWithdrawals && dailyWithdrawals.length > 0 && (
                    <CardFooter className="flex justify-between font-bold bg-muted/50 py-4 rounded-b-lg">
                        <span>Total</span>
                        <p className="text-primary">{formatCurrency(totalAmount)}</p>
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
