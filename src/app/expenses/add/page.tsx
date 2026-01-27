
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, Calendar as CalendarIcon, Loader2, User, Edit, X, Printer, FileDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatISO, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import type { Employee, Expense, ExpenseReport, AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DailyExpenseReportPdf } from '@/components/expenses/DailyExpenseReportPdf';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

const mainExpenseTypes = ["Taxi Expenses", "Purchases (Buying Items)"];
const taxiSubTypes = [
  "Taxi for warehouse organization",
  "Taxi for loading items",
  "Taxi to driver",
  "Taxi return from driver",
  "Taxi to technician for fixing defective items",
  "Taxi for transporting furniture parts"
];

export default function AddExpensePage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { employees, expenses, setExpenses, expenseReports, setExpenseReports, settings } = useAppContext();
  const reportPdfRef = useRef<HTMLDivElement>(null);


  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [expenseSubType, setExpenseSubType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    let initialDate = new Date();
    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (!isNaN(parsed.getTime())) {
        initialDate = parsed;
      }
    }
    setDate(initialDate);
  }, [dateParam]);
  
  const isLoading = !employees || !expenses || !date;

  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing').sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const dailyReport = useMemo(() => {
    if (!expenseReports || !date) return null;
    const reportDateStr = format(date, 'yyyy-MM-dd');
    return expenseReports.find(r => format(parseISO(r.reportDate), 'yyyy-MM-dd') === reportDateStr);
  }, [expenseReports, date]);

  const dailyExpenses = useMemo(() => {
    if (!dailyReport) return [];
    return expenses.filter(exp => exp.expenseReportId === dailyReport.id)
                   .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [expenses, dailyReport]);
  
  const getEmployeeName = (id: string, useKurdish: boolean = false) => {
    const employee = employees?.find(e => e.id === id);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const groupedDailyExpenses = useMemo(() => {
    if (!dailyExpenses || !employees) return [];
    
    const groups: Record<string, { employeeName: string; expenses: Expense[]; total: number }> = {};
    
    dailyExpenses.forEach(exp => {
      if (!groups[exp.employeeId]) {
        groups[exp.employeeId] = {
          employeeName: getEmployeeName(exp.employeeId, language === 'ku'),
          expenses: [],
          total: 0
        };
      }
      groups[exp.employeeId].expenses.push(exp);
      groups[exp.employeeId].total += exp.amount;
    });

    return Object.values(groups);
  }, [dailyExpenses, employees, language, getEmployeeName]);

  const grandTotal = useMemo(() => dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0), [dailyExpenses]);

  const resetForm = () => {
    setSelectedEmployee('');
    setExpenseType('');
    setExpenseSubType('');
    setAmount('');
    setDescription('');
  }
  
  const handleAddOrUpdateExpense = () => {
    const parsedAmount = parseFloat(amount);
    if (!selectedEmployee || !amount || !date || isNaN(parsedAmount) || parsedAmount <= 0 || !expenseType) {
      toast({ variant: 'destructive', title: t('missing_information'), description: "Please select an employee, type, and enter a valid positive amount." });
      return;
    }

    setIsSaving(true);
    
    const reportDateStr = format(date, 'yyyy-MM-dd');
    let report = expenseReports.find(r => format(parseISO(r.reportDate), 'yyyy-MM-dd') === reportDateStr);
    let newReportCreated = false;
    if (!report) {
        report = {
            id: `report-${reportDateStr}`,
            reportName: `Daily Expenses - ${format(date, 'PPP')}`,
            reportDate: date.toISOString(),
            totalAmount: 0
        };
        newReportCreated = true;
    }

    const expensePayload = {
      employeeId: selectedEmployee,
      date: date.toISOString(),
      amount: parsedAmount,
      notes: description,
      expenseType: expenseType,
      expenseSubType: expenseType === 'Taxi Expenses' ? expenseSubType : '',
    };

    if (editingExpense) {
      const updatedExpense: Expense = { ...editingExpense, ...expensePayload };
      const updatedExpenses = expenses.map(e => e.id === editingExpense.id ? updatedExpense : e);
      setExpenses(updatedExpenses);
      
      const newTotalForReport = updatedExpenses.filter(e => e.expenseReportId === report!.id).reduce((sum, e) => sum + e.amount, 0);
      setExpenseReports(expenseReports.map(r => r.id === report!.id ? {...r, totalAmount: newTotalForReport } : r));

      toast({ title: "Expense Updated", description: "The expense record has been successfully updated."});
      setEditingExpense(null);
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        ...expensePayload,
        expenseReportId: report.id
      };
      const updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      
      const newTotalForReport = updatedExpenses.filter(e => e.expenseReportId === report!.id).reduce((sum, e) => sum + e.amount, 0);
      if(newReportCreated){
        setExpenseReports([...expenseReports, {...report, totalAmount: newTotalForReport}]);
      } else {
        setExpenseReports(expenseReports.map(r => r.id === report!.id ? {...r, totalAmount: newTotalForReport } : r));
      }

      toast({ title: "Expense Added", description: `An expense of ${formatCurrency(newExpense.amount)} has been added.`});
    }

    resetForm();
    setIsSaving(false);
  }
  
  const startEditing = (expense: Expense) => {
    setEditingExpense(expense);
    setSelectedEmployee(expense.employeeId);
    setExpenseType(expense.expenseType || '');
    setExpenseSubType(expense.expenseSubType || '');
    setAmount(String(expense.amount));
    setDescription(expense.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingExpense(null);
    resetForm();
  };

  const handleDelete = (expenseToDelete: Expense) => {
    const updatedExpenses = expenses.filter(e => e.id !== expenseToDelete.id);
    setExpenses(updatedExpenses);

    const reportToUpdate = expenseReports.find(r => r.id === expenseToDelete.expenseReportId);
    if (reportToUpdate) {
        const newTotal = updatedExpenses.filter(e => e.expenseReportId === reportToUpdate.id).reduce((sum, e) => sum + e.amount, 0);
        if (newTotal > 0) {
            setExpenseReports(expenseReports.map(r => r.id === reportToUpdate.id ? {...r, totalAmount: newTotal} : r));
        } else {
            setExpenseReports(expenseReports.filter(r => r.id !== reportToUpdate.id));
        }
    }
    toast({ title: "Expense Deleted", description: "The expense record has been removed." });
  };
  
  const handlePrint = () => {
    window.print();
  }

  const handleDownloadPdf = async () => {
    if (!reportPdfRef.current || !date) return;
    const canvas = await html2canvas(reportPdfRef.current, {
        scale: 2,
        useCORS: true,
        onclone: (document) => {
            if (settings?.customFont && language === 'ku') {
                const style = document.createElement('style');
                style.innerHTML = `@font-face { font-family: 'CustomPdfFont'; src: url(${settings.customFont}); } body, table, div, p, h1, h2, h3, span { font-family: 'CustomPdfFont' !important; }`;
                document.head.appendChild(style);
            }
        },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'px', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfWidth * (canvas.height / canvas.width));
    pdf.save(`daily-expense-report-${format(date, 'yyyy-MM-dd')}.pdf`);
  };

  const handleSaveAndRefresh = () => {
    toast({
      title: "Data Saved",
      description: "All expenses have been saved.",
    });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  const sortedExpenseReports = useMemo(() => {
    if (!expenseReports) return [];
    return [...expenseReports].sort((a, b) => parseISO(b.reportDate).getTime() - parseISO(a.reportDate).getTime());
  }, [expenseReports]);

  const handleReportSelect = (reportId: string) => {
      const selectedReport = expenseReports.find(r => r.id === reportId);
      if (selectedReport) {
          setDate(parseISO(selectedReport.reportDate));
      }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={reportPdfRef} style={{ width: '700px' }}>
                {date && <DailyExpenseReportPdf records={dailyExpenses} date={date} settings={settings} getEmployeeName={getEmployeeName} />}
            </div>
        </div>
        <div className="hidden print:block">
             {date && <DailyExpenseReportPdf records={dailyExpenses} date={date} settings={settings} getEmployeeName={getEmployeeName} />}
        </div>
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b p-4 print:hidden">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/expenses"><ArrowLeft /></Link>
                        </Button>
                        <h1 className="text-xl">{t('add_daily_expense')}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="hidden sm:block">{t('date')}:</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-48 justify-start text-left", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'PPP') : <span>{t('pick_a_date')}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar 
                                mode="single" 
                                selected={date} 
                                onSelect={(d) => {
                                    if(d) setDate(d);
                                    setIsCalendarOpen(false);
                                }}
                                captionLayout="dropdown-nav" fromYear={2020} toYear={2040} initialFocus 
                            />
                            <div className="p-2 border-t">
                                <Input 
                                    type="text"
                                    placeholder="yyyy-mm-dd"
                                    value={date ? format(date, 'yyyy-MM-dd') : ''}
                                    onChange={(e) => {
                                        try {
                                            const newDate = parseISO(e.target.value);
                                            if (!isNaN(newDate.getTime())) {
                                                setDate(newDate);
                                            }
                                        } catch {}
                                    }}
                                />
                            </div>
                        </PopoverContent>
                        </Popover>
                        <Button variant="outline" onClick={handlePrint} disabled={isLoading || dailyExpenses.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
                        <Button variant="outline" onClick={handleDownloadPdf} disabled={isLoading || dailyExpenses.length === 0}><FileDown className="mr-2"/>PDF</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 print:hidden">
                    <Card>
                        <CardHeader>
                        <CardTitle>{editingExpense ? t('edit_expense') : t('new_expense_entry')}</CardTitle>
                        <CardDescription>{editingExpense ? t('update_expense_details') : t('add_new_expense_for_date')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="report-select">{t('or_load_from_report')}</Label>
                            <Select onValueChange={handleReportSelect}>
                                <SelectTrigger id="report-select">
                                    <SelectValue placeholder={t('select_existing_report')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortedExpenseReports.map(report => (
                                        <SelectItem key={report.id} value={report.id}>
                                            {report.reportName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="employee">{t('employee')}</Label>
                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee} disabled={isSaving}>
                            <SelectTrigger><SelectValue placeholder={t('select_an_employee')} /></SelectTrigger>
                            <SelectContent>{warehouseEmployees.map(e => <SelectItem key={e.id} value={e.id} dir={language === 'ku' ? 'rtl' : 'ltr'}>{language==='ku' && e.kurdishName ? e.kurdishName : e.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expense-type">{t('expense_type')}</Label>
                            <Select value={expenseType} onValueChange={(v) => { setExpenseType(v); setExpenseSubType(''); }} disabled={isSaving}>
                                <SelectTrigger><SelectValue placeholder={t('select_expense_type')} /></SelectTrigger>
                                <SelectContent>
                                    {mainExpenseTypes.map(type => <SelectItem key={type} value={type}>{t(type.toLowerCase().replace(/[\s()]/g, '_'))}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {expenseType === 'Taxi Expenses' && (
                            <div className="space-y-2">
                                <Label htmlFor="expense-sub-type">{t('taxi_sub_type')}</Label>
                                <Select value={expenseSubType} onValueChange={setExpenseSubType} disabled={isSaving}>
                                    <SelectTrigger id="expense-sub-type"><SelectValue placeholder={t('select_taxi_sub_type')} /></SelectTrigger>
                                    <SelectContent>
                                        {taxiSubTypes.map(type => <SelectItem key={type} value={type}>{t(type.toLowerCase().replace(/\s/g, '_'))}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="amount">{t('amount_iqd')}</Label>
                            <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 25000" disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">{t('notes')}</Label>
                            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('notes_optional_expense')} disabled={isSaving}/>
                        </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                        <Button onClick={handleAddOrUpdateExpense} disabled={isSaving} className="w-full">
                            {isSaving ? <Loader2 className="animate-spin mr-2"/> : editingExpense ? <Save className="mr-2"/> : <Plus className="mr-2" />}
                            {editingExpense ? t('save_changes') : t('add_expense')}
                        </Button>
                        {editingExpense && <Button variant="ghost" onClick={cancelEditing}><X/></Button>}
                        </CardFooter>
                    </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('expenses_for_date', { date: date ? format(date, 'PPP') : '...' })}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                    {isLoading ? (
                                        <div className="p-8 text-center text-muted-foreground">{t('loading_records')}...</div>
                                    ) : groupedDailyExpenses && groupedDailyExpenses.length > 0 ? (
                                        groupedDailyExpenses.map(group => (
                                        <div key={group.employeeName} className="py-3 first:pt-0 last:pb-0">
                                            {group.expenses.map(exp => (
                                            <div key={exp.id} className="py-3 flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="flex items-center gap-2" dir={language === 'ku' ? 'rtl' : 'ltr'}><User className="h-4 w-4 text-primary" /> {getEmployeeName(exp.employeeId, language === 'ku')}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{t(exp.expenseType.toLowerCase().replace(/[\s()]/g, '_'))}{exp.expenseSubType ? ` (${t(exp.expenseSubType.toLowerCase().replace(/\s/g, '_'))})` : ''}</p>
                                                    {exp.notes && <p className="text-sm mt-1">{exp.notes}</p>}
                                                </div>
                                                <div className='flex flex-col items-end'>
                                                    <p className="font-semibold text-primary">{formatCurrency(exp.amount)}</p>
                                                    <div className="flex gap-1 mt-1 print:hidden">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(exp)}><Edit className="h-4 w-4"/></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                                                    <AlertDialogDescription>{t('confirm_delete_expense')}</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(exp)}>{t('delete')}</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </div>
                                            ))}
                                            {group.expenses.length > 1 && (
                                                <div className="flex justify-end items-center mt-2 pt-2 border-t border-dashed">
                                                    <p className="text-sm font-semibold text-muted-foreground">
                                                    {group.employeeName} {t('total')}: {formatCurrency(group.total)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        ))
                                    ) : (
                                        <div className="text-center h-24 text-muted-foreground flex items-center justify-center">
                                            {t('no_expenses_for_date')}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            {grandTotal > 0 && (
                            <CardFooter className="bg-muted/80 py-4 justify-end">
                                <div className="text-lg font-bold flex items-center gap-4">
                                    <span>{t('grand_total')}:</span>
                                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
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
