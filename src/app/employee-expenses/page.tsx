'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Wallet, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import type { Employee, SimpleExpense } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import withAuth from '@/hooks/withAuth';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

function EmployeeExpensesPage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { employees, simpleExpenses, setSimpleExpenses } = useAppContext();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDate(new Date());
  }, []);

  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing').sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const getEmployeeName = (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return t('unknown');
    return language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const handleAddExpense = () => {
    if (!employeeId || !amount || !date) {
      toast({
        variant: 'destructive',
        title: t('missing_information'),
        description: "Please select an employee, enter an amount, and select a date.",
      });
      return;
    }
    
    setIsSaving(true);
    const newExpense: SimpleExpense = {
      id: crypto.randomUUID(),
      employeeId,
      amount: parseFloat(amount),
      date: formatISO(date),
      description,
    };
    
    setSimpleExpenses([...simpleExpenses, newExpense]);
    toast({ title: "Expense Added", description: `Expense of ${formatCurrency(newExpense.amount)} for ${getEmployeeName(employeeId)} has been added.` });
    
    // Reset form
    setEmployeeId('');
    setAmount('');
    setDescription('');
    setIsSaving(false);
  };
  
  const employeeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    simpleExpenses.forEach(expense => {
      totals[expense.employeeId] = (totals[expense.employeeId] || 0) + expense.amount;
    });
    return totals;
  }, [simpleExpenses]);

  const overallTotal = useMemo(() => {
    return simpleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [simpleExpenses]);
  
  const sortedExpenses = useMemo(() => {
      return [...simpleExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [simpleExpenses])

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/ashley-expenses"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl">Employee Expenses</h1>
        </div>
        <Button onClick={handleAddExpense} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Plus className="mr-2" />}
          Add Expense
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">{t('employee')}</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger><SelectValue placeholder={t('select_an_employee')} /></SelectTrigger>
                  <SelectContent>
                    {warehouseEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id} dir={language === 'ku' ? 'rtl' : 'ltr'}>{getEmployeeName(emp.id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>{t('pick_a_date')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (IQD)</Label>
                <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 15000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (e.g. Taxi Fare)</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter expense type or notes..." />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense List</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedExpenses.length > 0 ? (
                <div className="space-y-4">
                  {sortedExpenses.map(expense => (
                    <div key={expense.id} className="border-b pb-3">
                       <div className="flex justify-between items-start">
                        <div>
                           <p className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" />{getEmployeeName(expense.employeeId)}</p>
                           <p className="text-sm text-muted-foreground mt-1">{expense.description || "General Expense"}</p>
                        </div>
                         <div className='text-right'>
                            <p className="font-semibold text-primary">{formatCurrency(expense.amount)}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(expense.date), 'PPP')}</p>
                         </div>
                       </div>
                    </div>
                  ))}
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    {Object.entries(employeeTotals).map(([empId, total]) => (
                      <p key={empId}>
                        <span className="font-semibold">{getEmployeeName(empId)}</span> has spent a total of <span className="font-bold text-primary">{formatCurrency(total)}</span>.
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No expenses added yet.</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Use the form to add the first expense record.</p>
                </div>
              )}
            </CardContent>
            {sortedExpenses.length > 0 && (
                <CardFooter className="justify-end bg-muted/50 py-4">
                    <p className="font-bold text-lg">Overall Total: <span className="text-primary">{formatCurrency(overallTotal)}</span></p>
                </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(EmployeeExpensesPage);
