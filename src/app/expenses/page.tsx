'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, Timestamp, doc } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, DollarSign, User, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


type Employee = {
  id: string;
  name: string;
};

type Expense = {
  id: string;
  employeeId: string;
  amount: number;
  date: Timestamp;
  notes?: string;
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper to safely convert Firestore Timestamp or JS Date to a JS Date
const safeDate = (dateValue: Timestamp | Date | undefined): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof (dateValue as Timestamp).toDate === 'function') {
    return (dateValue as Timestamp).toDate();
  }
  // Try to parse if it's a string or number, though this is less ideal
  const parsed = new Date(dateValue as any);
  return isNaN(parsed.getTime()) ? null : parsed;
};


export default function ExpensesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const chartRef = useRef<HTMLDivElement>(null);

  // Data fetching
  const employeesRef = useMemoFirebase(() => (firestore && user ? collection(firestore, 'employees') : null), [firestore, user]);
  const expensesRef = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);

  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesRef);

  // Form state
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState<string>('');
  
  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);


  const resetForm = () => {
    setSelectedEmployee('');
    setAmount('');
    setDate(new Date());
    setNotes('');
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to perform this action.' });
        return;
    }
    if (!firestore || !selectedEmployee || !amount || !date) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please fill out all required fields.",
        });
        return;
    }

    const expenseData = {
      employeeId: selectedEmployee,
      amount: parseFloat(amount),
      date: Timestamp.fromDate(date),
      notes,
    };
    
    addDocumentNonBlocking(expensesRef!, expenseData);
    
    toast({
        title: "Expense Added",
        description: "The new expense has been recorded."
    });
    resetForm();
  };
  
  const handleDelete = (expenseId: string) => {
      if(!firestore) return;
      const docRef = doc(firestore, 'expenses', expenseId);
      deleteDocumentNonBlocking(docRef);
      toast({
          title: "Expense Deleted",
          description: "The expense has been removed."
      });
  }

  const { expensesByEmployee, grandTotal, chartData } = useMemo(() => {
    if (!expenses || !employees) return { expensesByEmployee: new Map(), grandTotal: 0, chartData: [] };

    const grouped = new Map<string, { employee: Employee; expenses: Expense[]; total: number }>();
    let total = 0;

    for (const expense of expenses) {
      const employee = employees.find(e => e.id === expense.employeeId);
      if (employee) {
        if (!grouped.has(employee.id)) {
          grouped.set(employee.id, { employee, expenses: [], total: 0 });
        }
        const entry = grouped.get(employee.id)!;
        entry.expenses.push(expense);
        entry.total += expense.amount;
        total += expense.amount;
      }
    }
    
    // Sort expenses by date for each employee
    grouped.forEach(entry => {
        entry.expenses.sort((a, b) => {
            const dateA = safeDate(a.date)?.getTime() || 0;
            const dateB = safeDate(b.date)?.getTime() || 0;
            return dateB - dateA;
        });
    });
    
    // Sort employees by name for the list view
    const sortedGrouped = new Map([...grouped.entries()].sort((a, b) => a[1].employee.name.localeCompare(b[1].employee.name)));

    const chartData = Array.from(sortedGrouped.values()).map(data => ({
        name: data.employee.name.split(' ')[0], // Use first name for chart label
        total: data.total
    })).sort((a,b) => b.total - a.total);

    return { expensesByEmployee: sortedGrouped, grandTotal: total, chartData };
  }, [expenses, employees]);

  const handleDownloadReport = async () => {
    if (!chartRef.current) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate report.' });
        return;
    }
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Employee Expenses Report`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

    // Add chart image
    const canvas = await (await import('html2canvas')).default(chartRef.current, { scale: 2, backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    doc.addImage(imgData, 'PNG', 14, 40, pdfWidth - 28, 100);
    
    const tableData = Array.from(expensesByEmployee.values()).flatMap(empData => 
        empData.expenses.map(exp => [
            empData.employee.name,
            formatCurrency(exp.amount),
            format(safeDate(exp.date) || new Date(), 'PP'),
            exp.notes || ''
        ])
    );
    
    autoTable(doc, {
        startY: 150,
        head: [['Employee', 'Amount', 'Date', 'Notes']],
        body: tableData,
    });

    doc.save(`employee-expenses-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  const isLoading = isLoadingEmployees || isLoadingExpenses || isUserLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if(!isOpen) resetForm(); }}>
        <header className="bg-card border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/ashley-expenses">
                  <ArrowLeft />
                  <span className="sr-only">Back to Ashley Expenses</span>
                </Link>
              </Button>
              <h1 className="text-xl font-bold">Ashley Expenses</h1>
            </div>
            <div className='flex items-center gap-2'>
                <Button onClick={handleDownloadReport} variant="outline" disabled={expensesByEmployee.size === 0}>
                    <FileDown className="mr-2 h-4 w-4"/>
                    Download Report
                </Button>
                <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
                </DialogTrigger>
            </div>
          </div>
        </header>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select onValueChange={setSelectedEmployee} value={selectedEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEmployees ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    sortedEmployees?.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="pl-8"/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Lunch with client" />
            </div>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">Add Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      
      <main className="container mx-auto p-4 md:p-8">
        {isLoading ? (
            <div className="space-y-6">
                 <Card className="animate-pulse"><CardHeader><div className="h-48 w-full rounded bg-muted"></div></CardHeader></Card>
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader><div className="h-7 w-48 rounded bg-muted"></div></CardHeader>
                        <CardContent><div className="h-24 w-full rounded bg-muted"></div></CardContent>
                    </Card>
                ))}
            </div>
        ) : expensesByEmployee.size > 0 ? (
            <>
                <Card className="mb-8" ref={chartRef}>
                    <CardHeader>
                        <CardTitle>Expenses per Employee</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[250px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value)}`}/>
                                    <Tooltip
                                        cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Total']}
                                    />
                                    <Legend />
                                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Expenses" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    {Array.from(expensesByEmployee.entries()).map(([employeeId, data]) => (
                        <Card key={employeeId}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-xl flex items-center gap-2"><User className="h-5 w-5 text-primary"/>{data.employee.name}</CardTitle>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Employee Total</p>
                                        <p className="text-xl font-bold text-primary">{formatCurrency(data.total)}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                {data.expenses.map(expense => {
                                    const formattedDate = safeDate(expense.date);
                                    return (
                                        <div key={expense.id} className="py-3 flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                                                <p className="text-sm text-muted-foreground">{formattedDate ? format(formattedDate, 'MMMM d, yyyy') : 'Invalid Date'}</p>
                                                <p className="text-sm mt-1">{expense.notes}</p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        This will permanently delete this expense record. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(expense.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    );
                                })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 <Card className="mt-8 bg-card">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Overall Total</CardTitle>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
                        </div>
                    </CardHeader>
                </Card>
            </>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Expenses Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Get started by adding the first expense.</p>
              <div className="mt-6">
                   <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                      </Button>
                    </DialogTrigger>
              </div>
            </div>
          </Dialog>
        )}
      </main>
    </Dialog>
    </div>
  );
}
