'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, Clock, User, Edit, Save, X, FileText, Printer, Loader2 } from 'lucide-react';
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
import useLocalStorage from '@/hooks/use-local-storage';
import { useAppContext } from '@/context/app-provider';
import type { Overtime, AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AddOvertimePage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { employees, overtime: allOvertimeRecords, setOvertime: setAllOvertimeRecords } = useAppContext();
  const [salarySettings] = useLocalStorage('ashley-salary-settings', { overtimeRate: 5000 });

  const dateParam = searchParams.get('date');

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const getInitialDate = () => {
      if (dateParam) {
        const parsedDate = parseISO(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      return new Date();
    };
    setSelectedDate(getInitialDate());
  }, [dateParam]);
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editingRecord, setEditingRecord] = useState<Overtime | null>(null);
  
  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing');
  }, [employees]);

  const overtimeRecords = useMemo(() => {
    if (!allOvertimeRecords || !selectedDate) return [];
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return allOvertimeRecords.filter(record => {
        const recordDate = parseISO(record.date);
        return isWithinInterval(recordDate, { start, end });
    }).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [allOvertimeRecords, selectedDate]);


  const sortedEmployees = useMemo(() => {
    if (!warehouseEmployees) return [];
    return [...warehouseEmployees].sort((a, b) => a.name.localeCompare(b.name));
  }, [warehouseEmployees]);

  const getEmployeeName = (id: string, useKurdish: boolean = false) => {
    const employee = employees?.find(e => e.id === id);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };
  
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
    toast({ title: t('save_changes'), description: t('overtime_record_updated') });
    setEditingRecord(null);
    setIsSaving(false);
  };


  const handleAddOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !hours || !selectedDate) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('add_overtime_validation_error') });
      return;
    }
    
    setIsSaving(true);
    const overtimeData: Overtime = {
      id: crypto.randomUUID(),
      employeeId: selectedEmployee,
      date: selectedDate.toISOString(),
      hours: parseFloat(hours),
      rate: salarySettings.overtimeRate,
      totalAmount: parseFloat(hours) * salarySettings.overtimeRate,
      notes,
    };

    setAllOvertimeRecords([...allOvertimeRecords, overtimeData]);
    toast({ title: t('overtime_added'), description: t('overtime_added_desc') });
    resetForm();
    setIsSaving(false);
  };

  const handleDelete = (record: Overtime) => {
    setAllOvertimeRecords(allOvertimeRecords.filter(rec => rec.id !== record.id));
    toast({ title: t('record_deleted'), description: t('overtime_record_deleted') });
  };
  
  const { totalHours, totalAmount } = useMemo(() => {
    if (!overtimeRecords) return { totalHours: 0, totalAmount: 0 };
    return overtimeRecords.reduce(
        (acc, record) => {
            acc.totalHours += record.hours;
            acc.totalAmount += record.totalAmount;
            return acc;
        }, { totalHours: 0, totalAmount: 0 });
  }, [overtimeRecords]);


  const isLoading = !employees || !allOvertimeRecords;

  const handlePrint = () => {
    window.print();
  };
  
  if (!selectedDate) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4 print:hidden">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/overtime">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl">{t('daily_overtime')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-48 justify-start text-left", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>{t('pick_a_date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); if (dateParam) router.push('/overtime/add'); }} initialFocus captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 print:hidden">
                <Card>
                <CardHeader>
                    <CardTitle>{t('add_overtime_record')}</CardTitle>
                    <CardDescription>{t('add_overtime_record_desc')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddOvertime}>
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
                                <SelectItem key={emp.id} value={emp.id} dir={language === 'ku' ? 'rtl' : 'ltr'}>{getEmployeeName(emp.id, language === 'ku')}</SelectItem>
                            ))
                            )}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="hours">{t('overtime_hours')}</label>
                        <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="hours" type="number" value={hours} onChange={e => setHours(e.target.value)} required placeholder="e.g., 2.5" className="pl-8" disabled={isSaving} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="notes">{t('notes')}</label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_optional_overtime')} disabled={isSaving}/>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('overtime_rate')}: {formatCurrency(salarySettings.overtimeRate)} / {t('hour')}
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
                        <CardTitle>{t('overtime_records_for_date', {date: selectedDate ? format(selectedDate, 'PPP') : '...' })}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">{t('loading_records')}...</div>
                    ) : overtimeRecords && overtimeRecords.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('employee')}</TableHead>
                                    <TableHead className="text-center">{t('overtime_hours')}</TableHead>
                                    <TableHead className="text-center">{t('salary')}</TableHead>
                                    <TableHead>{t('notes')}</TableHead>
                                    <TableHead className="w-24 print:hidden"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {overtimeRecords.map(record => (
                                    editingRecord?.id === record.id ? (
                                        <TableRow key={record.id}>
                                            <TableCell>{getEmployeeName(record.employeeId, language==='ku')}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    value={editingRecord.hours}
                                                    onChange={(e) => setEditingRecord({...editingRecord, hours: parseFloat(e.target.value) || 0})}
                                                    className="h-8 w-24 mx-auto text-center"
                                                />
                                            </TableCell>
                                            <TableCell className='text-center'>{formatCurrency(editingRecord.hours * editingRecord.rate)}</TableCell>
                                            <TableCell>
                                                <Textarea 
                                                    value={editingRecord.notes}
                                                    onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                                                    placeholder={t('notes_optional')}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right print:hidden">
                                                <div className="flex gap-1">
                                                    <Button size="icon" className="h-8 w-8" onClick={handleUpdateRecord} disabled={isSaving}><Save className="h-4 w-4"/></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow key={record.id}>
                                            <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{getEmployeeName(record.employeeId, language === 'ku')}</TableCell>
                                            <TableCell className="text-center">{record.hours.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">{formatCurrency(record.totalAmount)}</TableCell>
                                            <TableCell>{record.notes || t('na')}</TableCell>
                                            <TableCell className="text-right print:hidden">
                                                <div className="flex gap-1">
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
                                                                {t('confirm_delete_overtime', {employeeName: getEmployeeName(record.employeeId, language === 'ku')})}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(record)}>{t('delete')}</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">{t('no_overtime_records_for_date')}</div>
                    )}
                </CardContent>
                {overtimeRecords && overtimeRecords.length > 0 && (
                    <CardFooter className="justify-between bg-muted/50 py-4 rounded-b-lg">
                        <span className="font-semibold">{t('total')}</span>
                        <div className='text-right'>
                            <p>{totalHours.toFixed(2)} {t('hours_short')}</p>
                            <p className="font-semibold text-primary">{formatCurrency(totalAmount)}</p>
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

