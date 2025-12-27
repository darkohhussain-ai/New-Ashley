
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, Clock, User, Edit, Save, X, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAppContext } from '@/context/app-provider';
import type { Employee, Overtime } from '@/lib/types';


const OVERTIME_RATE = 5000; // Default: 5,000 IQD per hour

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function OvertimePage() {
  const { toast } = useToast();
  const { employees, overtime: allOvertimeRecords, setOvertime: setAllOvertimeRecords } = useAppContext();
  const defaultLogo = "https://i.ibb.co/68RvM01/ashley-logo.png";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);

  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editingRecord, setEditingRecord] = useState<Overtime | null>(null);
  
  const pdfHeaderRef = useRef<HTMLDivElement>(null);

  const overtimeRecords = useMemo(() => {
    if (!allOvertimeRecords || !selectedDate) return [];
    const start = view === 'daily' ? startOfDay(selectedDate) : startOfMonth(selectedDate);
    const end = view === 'daily' ? endOfDay(selectedDate) : endOfMonth(selectedDate);
    return allOvertimeRecords.filter(record => {
        const recordDate = parseISO(record.date);
        return isWithinInterval(recordDate, { start, end });
    });
  }, [allOvertimeRecords, selectedDate, view]);


  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.name || '...';
  
  const resetForm = () => {
    setSelectedEmployee('');
    setHours('');
    setNotes('');
  };
  
  const startEditing = (record: Overtime) => {
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
        totalAmount: editingRecord.hours * editingRecord.rate,
    };
    
    setAllOvertimeRecords(allOvertimeRecords.map(rec => rec.id === updatedData.id ? updatedData : rec));
    toast({ title: 'Success', description: 'Overtime record updated.' });
    setEditingRecord(null);
    setIsSaving(false);
  };


  const handleAddOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !hours || !selectedDate) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please select an employee and enter the hours.' });
      return;
    }
    
    setIsSaving(true);
    const overtimeData: Overtime = {
      id: crypto.randomUUID(),
      employeeId: selectedEmployee,
      date: selectedDate.toISOString(),
      hours: parseFloat(hours),
      rate: OVERTIME_RATE,
      totalAmount: parseFloat(hours) * OVERTIME_RATE,
      notes,
    };

    setAllOvertimeRecords([...allOvertimeRecords, overtimeData]);
    toast({ title: 'Overtime Added', description: 'The record has been added.' });
    resetForm();
    setIsSaving(false);
  };

  const handleDelete = (record: Overtime) => {
    setAllOvertimeRecords(allOvertimeRecords.filter(rec => rec.id !== record.id));
    toast({ title: 'Record Deleted', description: 'The overtime record has been removed.' });
  };

  const { totalHours, totalAmount, monthlyReportData } = useMemo(() => {
    if (!overtimeRecords || !employees) return { totalHours: 0, totalAmount: 0, monthlyReportData: [] };

    if (view === 'daily') {
        const { totalHours, totalAmount } = overtimeRecords.reduce(
            (acc, record) => {
                acc.totalHours += record.hours;
                acc.totalAmount += record.totalAmount;
                return acc;
            }, { totalHours: 0, totalAmount: 0 });
        return { totalHours, totalAmount, monthlyReportData: [] };
    } else { // Monthly view
        const employeeTotals = new Map<string, { totalHours: number, totalAmount: number }>();
        overtimeRecords.forEach(record => {
            const current = employeeTotals.get(record.employeeId) || { totalHours: 0, totalAmount: 0 };
            current.totalHours += record.hours;
            current.totalAmount += record.totalAmount;
            employeeTotals.set(record.employeeId, current);
        });

        const reportData = Array.from(employeeTotals.entries()).map(([employeeId, totals]) => ({
            employeeId,
            employeeName: getEmployeeName(employeeId),
            ...totals
        })).sort((a,b) => a.employeeName.localeCompare(b.employeeName));

        const grandTotalHours = reportData.reduce((sum, item) => sum + item.totalHours, 0);
        const grandTotalAmount = reportData.reduce((sum, item) => sum + item.totalAmount, 0);

        return { totalHours: grandTotalHours, totalAmount: grandTotalAmount, monthlyReportData: reportData };
    }
  }, [overtimeRecords, view, employees]);

 const handleDownloadPdf = async () => {
    if (!selectedDate || !pdfHeaderRef.current) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const canvas = await html2canvas(pdfHeaderRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const finalImgWidth = pdfWidth - 28;
    const finalImgHeight = finalImgWidth / ratio;
    
    doc.addImage(imgData, 'PNG', 14, 14, finalImgWidth, finalImgHeight);
    
    const startY = finalImgHeight + 30;

    if (view === 'daily') {
        autoTable(doc, {
            startY: startY,
            head: [['Employee', 'Hours', 'Notes', 'Amount']],
            body: (overtimeRecords || []).map(item => [
                getEmployeeName(item.employeeId), 
                item.hours.toFixed(2), 
                item.notes || '',
                formatCurrency(item.totalAmount)
            ]),
            foot: [['Grand Total', totalHours.toFixed(2), '', formatCurrency(totalAmount)]],
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] },
            footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
        });
        doc.save(`overtime-report-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    } else { // monthly
        autoTable(doc, {
            startY: startY,
            head: [['Employee', 'Total Hours', 'Total Amount']],
            body: monthlyReportData.map(item => [item.employeeName, item.totalHours.toFixed(2), formatCurrency(item.totalAmount)]),
            foot: [['Grand Total', totalHours.toFixed(2), formatCurrency(totalAmount)]],
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] },
            footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
        });
        doc.save(`overtime-report-${format(selectedDate, 'yyyy-MM')}.pdf`);
    }
  };

  const isLoading = !employees || !allOvertimeRecords;

  return (
    <>
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      {selectedDate && (
         <div ref={pdfHeaderRef} style={{ width: '700px', background: 'white', color: 'black' }}>
            <ReportPdfHeader
              title="Overtime Report"
              subtitle={view === 'daily' ? format(selectedDate, 'PPP') : format(selectedDate, 'MMMM yyyy')}
              logoSrc={logoSrc}
            />
          </div>
      )}
    </div>
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/ashley-expenses">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Employee Overtime</h1>
          </div>
          <div className='flex items-center gap-2'>
             <Select value={view} onValueChange={(v: 'daily' | 'monthly') => setView(v)}>
                <SelectTrigger className='w-32'><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
             </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, view === 'daily' ? "PPP" : "MMMM yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus 
                    captionLayout={view === 'monthly' ? "dropdown-buttons" : "dropdown-nav"}
                    fromYear={2020} toYear={2040}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {view === 'daily' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle>Add Overtime Record</CardTitle>
                    <CardDescription>Select an employee and enter their overtime hours for the selected date.</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddOvertime}>
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
                        <label htmlFor="hours">Overtime Hours</label>
                        <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="hours" type="number" value={hours} onChange={e => setHours(e.target.value)} required placeholder="e.g., 2.5" className="pl-8" disabled={isSaving} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="notes">Notes</label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes about the overtime" disabled={isSaving}/>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Overtime rate: {formatCurrency(OVERTIME_RATE)} / hour
                    </p>
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
                        <CardTitle>Overtime Records for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}</CardTitle>
                    </div>
                    <Button onClick={handleDownloadPdf} disabled={(overtimeRecords?.length || 0) === 0} variant="outline" size="sm">
                        <FileDown className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading records...</div>
                    ) : overtimeRecords && overtimeRecords.length > 0 ? (
                        overtimeRecords.map(record => (
                        <div key={record.id} className="py-3 flex justify-between items-start gap-4">
                            {editingRecord?.id === record.id ? (
                            <div className="flex-1 space-y-2">
                                <p className="font-bold">{getEmployeeName(record.employeeId)}</p>
                                <Input 
                                    type="number" 
                                    value={editingRecord.hours}
                                    onChange={(e) => setEditingRecord({...editingRecord, hours: parseFloat(e.target.value) || 0})}
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
                                <p className="text-sm text-muted-foreground">{record.hours} hours</p>
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
                                                    <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                    This will permanently delete the overtime record for {getEmployeeName(record.employeeId)}.
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
                        <div className="py-8 text-center text-muted-foreground">No overtime records for this date.</div>
                    )}
                    </div>
                </CardContent>
                {overtimeRecords && overtimeRecords.length > 0 && (
                    <CardFooter className="flex justify-between font-bold bg-muted/50 py-4 rounded-b-lg">
                        <span>Total</span>
                        <div className='text-right'>
                            <p>{totalHours.toFixed(2)} hours</p>
                            <p className="text-primary">{formatCurrency(totalAmount)}</p>
                        </div>
                    </CardFooter>
                )}
                </Card>
            </div>
            </div>
        ) : (
            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <div>
                        <CardTitle>Monthly Report: {selectedDate ? format(selectedDate, 'MMMM yyyy') : '...'}</CardTitle>
                        <CardDescription>Summary of overtime hours and costs for all employees.</CardDescription>
                    </div>
                    <Button onClick={handleDownloadPdf} disabled={monthlyReportData.length === 0}>
                        <FileDown className="mr-2 h-4 w-4"/>
                        Download PDF
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading records...</div>
                    ) : monthlyReportData.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead className='text-right'>Total Hours</TableHead>
                                    <TableHead className='text-right'>Total Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyReportData.map(item => (
                                    <TableRow key={item.employeeId}>
                                        <TableCell className='font-medium'>{item.employeeName}</TableCell>
                                        <TableCell className='text-right'>{item.totalHours.toFixed(2)}</TableCell>
                                        <TableCell className='text-right font-semibold text-primary'>{formatCurrency(item.totalAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-bold">Grand Total</TableCell>
                                    <TableCell className="text-right font-bold">{totalHours.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(totalAmount)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">No overtime records for this month.</div>
                    )}
                </CardContent>
            </Card>
        )}
      </main>
    </div>
    </>
  );
}
