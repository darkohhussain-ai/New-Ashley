
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, Timestamp, doc } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, DollarSign, User } from 'lucide-react';
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


export default function ExpensesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // Data fetching
  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const expensesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'expenses') : null), [firestore]);

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

  const { expensesByEmployee, grandTotal } = useMemo(() => {
    if (!expenses || !employees) return { expensesByEmployee: new Map(), grandTotal: 0 };

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
        entry.expenses.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
    });
    
    // Sort employees by name
    const sortedGrouped = new Map([...grouped.entries()].sort((a, b) => a[1].employee.name.localeCompare(b[1].employee.name)));

    return { expensesByEmployee: sortedGrouped, grandTotal: total };
  }, [expenses, employees]);

  const isLoading = isLoadingEmployees || isLoadingExpenses;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if(!isOpen) resetForm(); }}>
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Expenses</h1>
          </div>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
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
      
      <main className="space-y-8">
        {isLoading ? (
            <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader><div className="h-7 w-48 rounded bg-muted"></div></CardHeader>
                        <CardContent><div className="h-24 w-full rounded bg-muted"></div></CardContent>
                    </Card>
                ))}
            </div>
        ) : expensesByEmployee.size > 0 ? (
            <>
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
                                {data.expenses.map(expense => (
                                    <div key={expense.id} className="py-3 flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                                            <p className="text-sm text-muted-foreground">{format(expense.date.toDate(), 'MMMM d, yyyy')}</p>
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
                                ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 <Card className="mt-8 bg-secondary">
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
