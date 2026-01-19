

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
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

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
  const { pdfSettings, customFont } = settings;
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
    const initialDate = dateParam ? parseISO(dateParam) : new Date();
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

  const flattenedExpenses = useMemo(() => {
    return dailyExpenses.map(exp => ({...exp, employeeName: getEmployeeName(exp.employeeId, language === 'ku')}));
  }, [dailyExpenses, employees, language]);


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
    
    // Find or create the report for the day
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
      const updatedExpense: Expense = {
        ...editingExpense,
        ...expensePayload
      };
      setExpenses(expenses.map(e => e.id === editingExpense.id ? updatedExpense : e));
      toast({ title: "Expense Updated", description: "The expense record has been successfully updated."});
      setEditingExpense(null);
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        ...expensePayload,
        expenseReportId: report.id
      };
      setExpenses([...expenses, newExpense]);
      toast({ title: "Expense Added", description: `An expense of ${formatCurrency(newExpense.amount)} has been added.`});
    }

    // This logic is complex because it has to recalculate totals after an update/add.
    // This is a placeholder for that logic, which should ideally be a more robust state management pattern.
    const allReports = newReportCreated ? [...expenseReports, report] : [...expenseReports];
    const finalReports = allReports.map(rep => {
        const relevantExpenses = expenses
            .filter(ex => ex.expenseReportId === rep.id)
            .filter(ex => !(editingExpense && ex.id === editingExpense.id)); // exclude old version if editing

        if(editingExpense && rep.id === report?.id) {
            relevantExpenses.push({ ...editingExpense, ...expensePayload });
        }
        if(!editingExpense && rep.id === report?.id) {
             relevantExpenses.push({
                id: crypto.randomUUID(), // temp id
                ...expensePayload,
                expenseReportId: report.id,
            });
        }
        
        const newTotal = relevantExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        return { ...rep, totalAmount: newTotal };
    });

    setExpenseReports(finalReports.filter(r => r.totalAmount > 0));

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

  const handleDelete = (expenseId: string) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
    toast({ title: "Expense Deleted", description: "The expense record has been removed." });
  };
  
  const handlePrint = () => {
    window.print();
  }

  const handleDownloadPdf = async () => {
    if (!reportPdfRef.current) return;
        
    const canvas = await html2canvas(reportPdfRef.current, { 
        scale: 2,
        useCORS: true,
         onclone: (document) => {
            if (customFont && language === 'ku') {
                const style = document.createElement('style');
                style.innerHTML = `@font-face { font-family: 'CustomPdfFont'; src: url(${customFont}); } body { font-family: 'CustomPdfFont' !important; }`;
                document.head.appendChild(style);
            }
        }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'px', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let finalImgWidth = pdfWidth;
    let finalImgHeight = pdfWidth / ratio;
    
    if (finalImgHeight > pdfHeight) {
        finalImgHeight = pdfHeight;
        finalImgWidth = finalImgHeight * ratio;
    }
    
    const x = (pdfWidth - finalImgWidth) / 2;

    pdf.addImage(imgData, 'PNG', x, 0, finalImgWidth, finalImgHeight);
    pdf.save(`expenses-report-${format(date!, 'yyyy-MM-dd')}.pdf`);
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
             <div ref={reportPdfRef} style={{ width: '800px' }}>
                {date && (
                    <ReportWrapper
                        title={t('daily_expense_report')}
                        date={format(date, 'yyyy-MM-dd')}
                        logoSrc={pdfSettings.report.logo}
                        themeColor={pdfSettings.report.reportColors?.expense || '#3b82f6'}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('name')}</TableHead>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead>{t('total_value')}</TableHead>
                                    <TableHead>{t('expense_type')}</TableHead>
                                    <TableHead>{t('notes')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {flattenedExpenses.map((exp, index) => (
                                    <TableRow key={exp.id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                                        <TableCell dir={language === 'ku' ? 'rtl' : 'ltr'}>{exp.employeeName}</TableCell>
                                        <TableCell>{format(new Date(exp.date), 'PP')}</TableCell>
                                        <TableCell>{formatCurrency(exp.amount)}</TableCell>
                                        <TableCell>{t(exp.expenseType.toLowerCase().replace(/[\s()]/g, '_'))}{exp.expenseSubType ? ` (${t(exp.expenseSubType.toLowerCase().replace(/\s/g, '_'))})` : ''}</TableCell>
                                        <TableCell>{exp.notes || t('na')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4} className="text-right font-bold">{t('grand_total')}:</TableCell>
                                    <TableCell className="font-bold">{formatCurrency(grandTotal)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </ReportWrapper>
                )}
            </div>
        </div>
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:p-0">
            <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
                <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/expenses"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl">{t('add_daily_expense')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="hidden sm:block">{t('date')}:</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-48 justify-start text-left font-normal", !date && "text-muted-foreground")}>
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
                    </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={handlePrint} disabled={isLoading || dailyExpenses.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={isLoading || dailyExpenses.length === 0}><FileDown className="mr-2"/>PDF</Button>
                    <Button onClick={handleSaveAndRefresh}><RefreshCw className="mr-2 h-4 w-4" /> {t('save_and_refresh')}</Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 print:hidden">
                <Card>
                    <CardHeader>
                    <CardTitle>{editingExpense ? t('edit_expense') : t('new_expense_entry')}</CardTitle>
                    <CardDescription>{editingExpense ? t('update_expense_details') : t('add_new_expense_for_date')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('employee')}</TableHead>
                                    <TableHead>{t('expense_type')}</TableHead>
                                    <TableHead>{t('notes')}</TableHead>
                                    <TableHead className="text-right">{t('amount')}</TableHead>
                                    <TableHead className="w-24 print:hidden"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyExpenses.length > 0 ? dailyExpenses.map(exp => (
                                    <TableRow key={exp.id}>
                                        <TableCell>{getEmployeeName(exp.employeeId, language==='ku')}</TableCell>
                                        <TableCell>
                                             <p className="font-medium">{t(exp.expenseType.toLowerCase().replace(/[\s()]/g, '_'))}</p>
                                             {exp.expenseSubType && <p className="text-xs text-muted-foreground">{t(exp.expenseSubType.toLowerCase().replace(/\s/g, '_'))}</p>}
                                        </TableCell>
                                        <TableCell>{exp.notes || t('na')}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
                                        <TableCell>
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
                                                            <AlertDialogAction onClick={() => handleDelete(exp.id)}>{t('delete')}</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            {t('no_expenses_for_date')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
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
        </div>
    </>
  );
}
