
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, Calendar as CalendarIcon, Loader2, User, Edit, X, Printer, FileDown } from 'lucide-react';
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
import type { Employee, SimpleExpense, Expense, ExpenseReport, AllPdfSettings } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useLocalStorage from '@/hooks/use-local-storage';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

const expenseTypes = ["Taxi Fare", "General Expense", "Food & Beverage", "Office Supplies", "Other"];

export default function AddExpensePage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { employees, expenses, setExpenses, expenseReports, setExpenseReports } = useAppContext();
  const [pdfSettings] = useLocalStorage<AllPdfSettings>('pdf-settings', { report: {}, invoice: {}, card: {} });
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [expenseType, setExpenseType] = useState('');
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

  const expensesByEmployee = useMemo(() => {
    const grouped: Record<string, { employee: Employee, expenses: Expense[], total: number }> = {};
    dailyExpenses.forEach(exp => {
      if (!grouped[exp.employeeId]) {
        const employee = employees.find(e => e.id === exp.employeeId);
        if (employee) {
          grouped[exp.employeeId] = { employee, expenses: [], total: 0 };
        }
      }
      if (grouped[exp.employeeId]) {
        grouped[exp.employeeId].expenses.push(exp);
        grouped[exp.employeeId].total += exp.amount;
      }
    });
    return Object.values(grouped).sort((a, b) => a.employee.name.localeCompare(b.employee.name));
  }, [dailyExpenses, employees]);

  const grandTotal = useMemo(() => dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0), [dailyExpenses]);

  const resetForm = () => {
    setSelectedEmployee('');
    setExpenseType('');
    setAmount('');
    setDescription('');
  }
  
  const handleAddOrUpdateExpense = () => {
    if (!selectedEmployee || !amount || !date) {
      toast({ variant: 'destructive', title: t('missing_information'), description: "Please select an employee, date, and enter an amount." });
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

    if (editingExpense) {
      const updatedExpense: Expense = {
        ...editingExpense,
        employeeId: selectedEmployee,
        date: date.toISOString(),
        amount: parseFloat(amount) || 0,
        notes: description,
      };
      setExpenses(expenses.map(e => e.id === editingExpense.id ? updatedExpense : e));
      toast({ title: "Expense Updated", description: "The expense record has been successfully updated."});
      setEditingExpense(null);
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        employeeId: selectedEmployee,
        amount: parseFloat(amount) || 0,
        date: date.toISOString(),
        notes: description,
        expenseReportId: report.id,
      };
      setExpenses([...expenses, newExpense]);
      toast({ title: "Expense Added", description: `An expense of ${formatCurrency(newExpense.amount)} has been added.`});
    }

    // Recalculate total for the report
    const updatedReportExpenses = expenses.filter(e => e.expenseReportId === report!.id);
    const newTotal = updatedReportExpenses.reduce((sum, e) => sum + e.amount, 0) + (editingExpense ? 0 : (parseFloat(amount) || 0));
    
    const updatedReport: ExpenseReport = { ...report, totalAmount: newTotal };
    
    if (newReportCreated) {
        setExpenseReports([...expenseReports, updatedReport]);
    } else {
        setExpenseReports(expenseReports.map(r => r.id === report!.id ? updatedReport : r));
    }


    resetForm();
    setIsSaving(false);
  }
  
  const startEditing = (expense: Expense) => {
    setEditingExpense(expense);
    setSelectedEmployee(expense.employeeId);
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
    if (!date || expensesByEmployee.length === 0) return;
    const doc = new jsPDF();
    const useKurdish = language === 'ku';

    if (customFontBase64 && useKurdish) {
      try {
        const fontName = "CustomFont";
        doc.addFileToVFS(`${fontName}.ttf`, customFontBase64.split(',')[1]);
        doc.addFont(`${fontName}.ttf`, fontName, "normal");
        doc.setFont(fontName);
      } catch (e) {
        console.error("Could not add custom font to PDF", e);
      }
    }

    doc.setFontSize(18);
    doc.text(t('daily_expense_report'), doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.text(format(date, 'PPP'), doc.internal.pageSize.getWidth() / 2, 32, { align: 'center' });

    const body: (string | number)[][] = [];
    expensesByEmployee.forEach(group => {
      group.expenses.forEach((exp, index) => {
        body.push([
          index === 0 ? group.employee.name : '',
          exp.notes || '',
          formatCurrency(exp.amount)
        ]);
      });
      body.push(['', { content: `Total for ${group.employee.name}`, styles: { halign: 'right', fontStyle: 'bold' } }, formatCurrency(group.total)]);
    });

    autoTable(doc, {
      startY: 40,
      head: [['Employee', 'Notes', 'Amount']],
      body: body,
      foot: [['Grand Total', '', formatCurrency(grandTotal)]],
      theme: 'striped',
      headStyles: { fillColor: pdfSettings.report.reportColors?.expense || '#3b82f6' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      didParseCell: (data) => {
        if (useKurdish && customFontBase64) {
          data.cell.styles.font = "CustomFont";
          data.cell.styles.halign = 'right';
        }
      }
    });
    
    let finalY = (doc as any).lastAutoTable.finalY + 40;
    const pageHeight = doc.internal.pageSize.height;
    if (finalY > pageHeight - 30) {
        doc.addPage();
    }
    const signatureY = finalY > pageHeight - 50 ? 40 : finalY;
    doc.setFontSize(10);
    doc.text("...................................", doc.internal.pageSize.width - 120, signatureY, { align: 'center' });
    doc.text(t('warehouse_manager_signature'), doc.internal.pageSize.width - 120, signatureY + 10, { align: 'center' });


    doc.save(`expenses-report-${format(date, 'yyyy-MM-dd')}.pdf`);
  };


  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 print:p-0">
      <header className="flex items-center justify-between gap-4 mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/expenses"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl">{t('add_daily_expense')}</h1>
        </div>
        <div className="flex items-center gap-2">
            <Label className="hidden sm:block">Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-48 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>{t('pick_a_date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(d) => { if(d) setDate(d); router.push('/expenses/add')}} />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading || dailyExpenses.length === 0}><Printer className="mr-2"/>{t('print')}</Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isLoading || dailyExpenses.length === 0}><FileDown className="mr-2"/>PDF</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>{editingExpense ? "Edit Expense" : "New Expense Entry"}</CardTitle>
              <CardDescription>{editingExpense ? "Update the details for this expense." : "Add a new expense for the selected date."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">{t('employee')}</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee} disabled={isSaving}>
                  <SelectTrigger><SelectValue placeholder={t('select_an_employee')} /></SelectTrigger>
                  <SelectContent>{warehouseEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-type">{t('expense_type')}</Label>
                <Select value={expenseType} onValueChange={setExpenseType} disabled={isSaving}>
                    <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                    <SelectContent>
                        {expenseTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{t('amount_iqd')}</Label>
                <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 25000" disabled={isSaving}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('notes')}</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details..." disabled={isSaving}/>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
               <Button onClick={handleAddOrUpdateExpense} disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="animate-spin mr-2"/> : editingExpense ? <Save className="mr-2"/> : <Plus className="mr-2" />}
                  {editingExpense ? "Save Changes" : "Add Expense"}
               </Button>
               {editingExpense && <Button variant="ghost" onClick={cancelEditing}><X/></Button>}
            </CardFooter>
          </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Expenses for {date ? format(date, 'PPP') : '...'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {expensesByEmployee.length > 0 ? expensesByEmployee.map(({employee, expenses, total}) => (
                      <div key={employee.id} className="border rounded-lg">
                        <div className="bg-muted/50 px-4 py-2 rounded-t-lg">
                          <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4"/> {employee.name}</h3>
                        </div>
                        <div className="divide-y">
                          {expenses.map(exp => (
                            <div key={exp.id} className="p-4 flex justify-between items-start">
                              <div>
                                <p className="font-medium">{exp.expenseType || 'General'}</p>
                                <p className="text-sm text-muted-foreground">{exp.notes || t('na')}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(exp.amount)}</p>
                                <div className="flex gap-1 mt-1 print:hidden">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(exp)}><Edit className="h-4 w-4"/></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete this expense record. This cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(exp.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-muted/50 px-4 py-2 rounded-b-lg flex justify-end items-center gap-2 font-semibold">
                          <span>Total for {employee.name.split(' ')[0]}:</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                    )) : (
                       <div className="text-center py-16 text-muted-foreground">No expenses recorded for this date.</div>
                    )}
                  </div>
                </CardContent>
                {grandTotal > 0 && (
                   <CardFooter className="bg-muted/80 py-4 justify-end">
                      <div className="text-lg font-bold flex items-center gap-4">
                        <span>Grand Total:</span>
                        <span className="text-primary">{formatCurrency(grandTotal)}</span>
                      </div>
                   </CardFooter>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
}
