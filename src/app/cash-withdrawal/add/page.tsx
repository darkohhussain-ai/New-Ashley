'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, User, Edit, Save, X, FileText, Banknote, Printer, Loader2 } from 'lucide-react';
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
import { useAppContext } from '@/context/app-provider';
import type { CashWithdrawal, AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AddCashWithdrawalPage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { employees, withdrawals, setWithdrawals } = useAppContext();

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
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editingRecord, setEditingRecord] = useState<CashWithdrawal | null>(null);
  
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

  const getEmployeeName = (id: string, useKurdish: boolean = false) => {
    const employee = employees?.find(e => e.id === id);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };
  
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
    toast({ title: t('save_changes'), description: t('withdrawal_record_updated') });
    setEditingRecord(null);
    setIsSaving(false);
  };

  const handleAddWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !amount || !selectedDate || parseFloat(amount) <= 0) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('add_withdrawal_validation_error') });
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
    toast({ title: t('withdrawal_added'), description: t('withdrawal_added_desc') });
    resetForm();
    setIsSaving(false);
  };

  const handleDelete = (record: CashWithdrawal) => {
    setWithdrawals(withdrawals.filter(rec => rec.id !== record.id));
    toast({ title: t('record_deleted'), description: t('withdrawal_record_deleted') });
  };
  
  const { totalAmount } = useMemo(() => {
    if (!dailyWithdrawals) return { totalAmount: 0 };
    return dailyWithdrawals.reduce((acc, record) => {
        acc.totalAmount += record.amount;
        return acc;
    }, { totalAmount: 0 });
  }, [dailyWithdrawals]);

  const isLoading = !employees || !withdrawals;


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
              <Link href="/cash-withdrawal">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl">{t('daily_cash_withdrawals')}</h1>
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
                 <Calendar mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); if (dateParam) router.push('/cash-withdrawal/add'); }} initialFocus captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
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
                    <CardTitle>{t('add_withdrawal_record')}</CardTitle>
                    <CardDescription>{t('add_withdrawal_record_desc')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddWithdrawal}>
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
                        <label htmlFor="amount">{t('amount_iqd')}</label>
                        <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="e.g., 100000" className="pl-8" disabled={isSaving} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="notes">{t('notes')}</label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_optional')} disabled={isSaving}/>
                    </div>
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
                <CardHeader>
                    <div className='text-center'>
                        <CardTitle className='text-2xl'>{t('withdrawals_for_date', {date: ''})}</CardTitle>
                        <CardDescription className='text-lg'>{selectedDate ? format(selectedDate, 'PPP') : '...'}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">{t('loading_records')}...</div>
                    ) : dailyWithdrawals && dailyWithdrawals.length > 0 ? (
                        dailyWithdrawals.map(record => (
                        <div key={record.id} className="py-3 flex justify-between items-start gap-4">
                            {editingRecord?.id === record.id ? (
                            <div className="flex-1 space-y-2 print:hidden">
                                <p dir={language === 'ku' ? 'rtl' : 'ltr'}>{getEmployeeName(record.employeeId, language === 'ku')}</p>
                                <Input 
                                    type="number" 
                                    value={editingRecord.amount}
                                    onChange={(e) => setEditingRecord({...editingRecord, amount: parseFloat(e.target.value) || 0})}
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
                                <p className="flex items-center gap-2" dir={language === 'ku' ? 'rtl' : 'ltr'}><User className="h-4 w-4 text-primary" /> {getEmployeeName(record.employeeId, language === 'ku')}</p>
                                {record.notes && <p className="text-sm mt-1">{record.notes}</p>}
                            </div>
                            )}
                            <div className='flex flex-col items-end'>
                                <p className="font-semibold text-primary">{formatCurrency(record.amount)}</p>
                                {editingRecord?.id === record.id ? (
                                    <div className="flex gap-1 mt-2 print:hidden">
                                        <Button size="icon" className="h-8 w-8" onClick={handleUpdateRecord} disabled={isSaving}><Save className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 mt-1 print:hidden">
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
                                                    {t('confirm_delete_withdrawal', {employeeName: getEmployeeName(record.employeeId, language === 'ku')})}
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
                        <div className="py-8 text-center text-muted-foreground">{t('no_withdrawal_records_for_date')}</div>
                    )}
                    </div>
                </CardContent>
                {dailyWithdrawals && dailyWithdrawals.length > 0 && (
                    <CardFooter className="flex justify-between bg-muted/50 py-4 rounded-b-lg">
                        <span>{t('total')}</span>
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