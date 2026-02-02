
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, Calendar as CalendarIcon, Loader2, User, Edit, X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import type { Expense } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DailyExpenseReportPdf } from '@/components/expenses/DailyExpenseReportPdf';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

const mainExpenseTypes = ["Taxi Rent", "Purchases (Buying Items)"];

export default function AddExpensePage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { employees, expenses, setExpenses, settings } = useAppContext();

  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [expenseType, setExpenseType] = useState('');
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

  const dailyExpenses = useMemo(() => {
    if (!expenses || !date) return [];
    const start = startOfDay(date);
    const end = endOfDay(date);
    return expenses.filter(exp => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, { start, end });
    }).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [expenses, date]);
  
  const getEmployeeName = (id: string, useKurdish: boolean = false) => {
    const employee = employees?.find(e => e.id === id);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const grandTotal = useMemo(() => dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0), [dailyExpenses]);

  const resetForm = () => {
    setSelectedEmployee('');
    setExpenseType('');
    setAmount('');
    setDescription('');
  }
  
  const handleAddOrUpdateExpense = () => {
    const parsedAmount = parseFloat(amount);
    if (!selectedEmployee || !amount || !date || isNaN(parsedAmount) || parsedAmount <= 0 || !expenseType) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('add_expense_validation_error') });
      return;
    }

    setIsSaving(true);
    
    const expensePayload = {
      employeeId: selectedEmployee,
      date: date.toISOString(),
      amount: parsedAmount,
      notes: description,
      expenseType: expenseType,
      expenseSubType: '', // Subtype removed
    };

    if (editingExpense) {
      const updatedExpense: Expense = { ...editingExpense, ...expensePayload };
      setExpenses(expenses.map(e => e.id === editingExpense.id ? updatedExpense : e));
      toast({ title: t('expense_updated'), description: t('expense_updated_desc') });
      setEditingExpense(null);
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        ...expensePayload,
        expenseReportId: '' // Simplified: No longer tied to reports
      };
      setExpenses([...expenses, newExpense]);
      toast({ title: t('expense_added'), description: t('expense_added_desc', {amount: formatCurrency(newExpense.amount)})});
    }

    resetForm();
    setIsSaving(false);
  }
  
  const startEditing = (expense: Expense) => {
    setEditingExpense(expense);
    setSelectedEmployee(expense.employeeId);
    setExpenseType(expense.expenseType || '');
    setAmount(String(expense.amount));
    setDescription(expense.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingExpense(null);
    resetForm();
  };

  const handleDelete = (expenseToDelete: Expense) => {
    setExpenses(expenses.filter(e => e.id !== expenseToDelete.id));
    toast({ title: t('expense_deleted'), description: t('expense_deleted_desc') });
  };
  
  const handlePrint = () => {
    window.print();
  }

  const PageContent = () => (
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
                <Select value={expenseType} onValueChange={setExpenseType} disabled={isSaving}>
                    <SelectTrigger><SelectValue placeholder={t('select_expense_type')} /></SelectTrigger>
                    <SelectContent>
                        {mainExpenseTypes.map(type => <SelectItem key={type} value={type}>{t(type.toLowerCase().replace(/[\s()]/g, '_'))}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
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
                    <CardTitle className="text-center text-2xl" style={{color: settings.reportHeaderColors?.ashleyExpenses}}>
                      {t('daily_expense_report')}
                    </CardTitle>
                    <CardDescription className="text-center">{date ? format(date, 'PPPP') : '...'}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> : (
                        dailyExpenses.length > 0 ? (
                            <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t('employee')}</TableHead>
                                    <TableHead>{t('details')}</TableHead>
                                    <TableHead className="text-right">{t('amount')}</TableHead>
                                    <TableHead className="print:hidden w-24"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dailyExpenses.map(exp => (
                                    <TableRow key={exp.id}>
                                      <TableCell>{getEmployeeName(exp.employeeId, language === 'ku')}</TableCell>
                                      <TableCell>
                                        <p>{t(exp.expenseType.toLowerCase().replace(/[\s()]/g, '_'))}</p>
                                        {exp.notes && <p className="text-xs text-muted-foreground">{exp.notes}</p>}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">{formatCurrency(exp.amount)}</TableCell>
                                      <TableCell className="print:hidden">
                                        {!editingExpense && (
                                          <div className="flex gap-1">
                                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(exp)}><Edit className="h-4 w-4"/></Button>
                                              <AlertDialog>
                                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                      <AlertDialogHeader>
                                                          <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                                          <AlertDialogDescription>{t('confirm_delete_expense', {amount: exp.amount})}</AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(exp)}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                          </div>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">{t('no_expense_items_added')}</p>
                        )
                    )}
                </CardContent>
                {dailyExpenses.length > 0 && (
                    <CardFooter className="bg-muted/50 p-4 justify-end">
                        <div className="text-lg font-bold">
                            <span>{t('grand_total')}: </span>
                            <span className="text-primary">{formatCurrency(grandTotal)}</span>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
        <div className="hidden print:block">
           <DailyExpenseReportPdf
              records={dailyExpenses}
              date={date}
              settings={settings}
              getEmployeeName={getEmployeeName}
           />
        </div>
        <div className="min-h-screen bg-background text-foreground print:hidden">
            <header className="bg-card border-b p-4">
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
                        </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="icon" onClick={handlePrint} disabled={isLoading || dailyExpenses.length === 0}><Printer className="h-4 w-4"/></Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
              <PageContent />
            </main>
        </div>
    </>
  );
}
