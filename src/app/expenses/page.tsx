'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, DollarSign, User, FileDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAppContext } from '@/context/app-provider';
import type { Employee, Expense } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0
  }).format(amount);
};

const safeDate = (dateValue: string | undefined): Date | null => {
  if (!dateValue) return null;
  const parsed = parseISO(dateValue);
  return isNaN(parsed.getTime()) ? null : parsed;
};


export default function ExpensesPage() {
  const { toast } = useToast();
  const { employees, expenses, setExpenses } = useAppContext();
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  const chartRef = useRef<HTMLDivElement>(null);
  const pdfHeaderRef = useRef<HTMLDivElement>(null);
  const defaultLogo = "https://picsum.photos/seed/ashley-logo/300/100";
  const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
  const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);


  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState<string>('');
  
  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing');
  }, [employees]);

  const sortedEmployees = useMemo(() => {
    if (!warehouseEmployees) return [];
    return [...warehouseEmployees].sort((a, b) => a.name.localeCompare(b.name));
  }, [warehouseEmployees]);

  const expensesForMonth = useMemo(() => {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      return expenses.filter(exp => {
          const expDate = parseISO(exp.date);
          return isWithinInterval(expDate, {start, end});
      });
  }, [expenses, selectedMonth]);
  
  const isLoading = !employees || !expenses;

  const resetForm = () => {
    setSelectedEmployee('');
    setAmount('');
    setDate(new Date());
    setNotes('');
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !amount || !date) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please fill out all required fields.",
        });
        return;
    }

    const expenseData: Expense = {
      id: crypto.randomUUID(),
      employeeId: selectedEmployee,
      amount: parseFloat(amount),
      date: date.toISOString(),
      notes,
    };
    
    setExpenses([...expenses, expenseData]);
    
    toast({
        title: "Expense Added",
        description: "The new expense has been recorded."
    });
    resetForm();
  };
  
  const handleDelete = (expenseId: string) => {
      setExpenses(expenses.filter(exp => exp.id !== expenseId));
      toast({
          title: "Expense Deleted",
          description: "The expense has been removed."
      });
  }

  const { expensesByEmployee, grandTotal, chartData } = useMemo(() => {
    if (!expensesForMonth || !employees) return { expensesByEmployee: new Map(), grandTotal: 0, chartData: [] };

    const grouped = new Map<string, { employee: Employee; expenses: Expense[]; total: number }>();
    let total = 0;

    for (const expense of expensesForMonth) {
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
    
    grouped.forEach(entry => {
        entry.expenses.sort((a, b) => {
            const dateA = safeDate(a.date)?.getTime() || 0;
            const dateB = safeDate(b.date)?.getTime() || 0;
            return dateB - dateA;
        });
    });
    
    const sortedGrouped = new Map([...grouped.entries()].sort((a, b) => a[1].employee.name.localeCompare(b[1].employee.name)));

    const chartData = Array.from(sortedGrouped.values()).map(data => ({
        name: data.employee.name.split(' ')[0],
        total: data.total
    })).sort((a,b) => b.total - a.total);

    return { expensesByEmployee: sortedGrouped, grandTotal: total, chartData };
  }, [expensesForMonth, employees]);

  const handleDownloadReport = async () => {
    if (!pdfHeaderRef.current) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    if (customFontBase64) {
        const fontName = "CustomFont";
        const fontStyle = "normal";
        const fontBase64 = customFontBase64.split(',')[1];
        doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
        doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
        doc.setFont(fontName);
    }
    
    const headerCanvas = await html2canvas(pdfHeaderRef.current, { scale: 2, backgroundColor: 'white' });
    const headerImgData = headerCanvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const headerRatio = headerCanvas.width / headerCanvas.height;
    const finalHeaderWidth = pdfWidth - 28;
    const finalHeaderHeight = finalHeaderWidth / headerRatio;
    
    doc.addImage(headerImgData, 'PNG', 14, 14, finalHeaderWidth, finalHeaderHeight);
    let currentY = finalHeaderHeight + 30;

    if (chartRef.current) {
        try {
            const chartCanvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
            const chartImgData = chartCanvas.toDataURL('image/png');
            const chartRatio = chartCanvas.width / chartCanvas.height;
            const finalChartWidth = pdfWidth - 28;
            const finalChartHeight = finalChartWidth / chartRatio;

            doc.addImage(chartImgData, 'PNG', 14, currentY, finalChartWidth, finalChartHeight);
            currentY += finalChartHeight + 20;

        } catch(e) {
            console.error("Error generating chart image for PDF:", e);
        }
    }

    const tableData = Array.from(expensesByEmployee.values()).flatMap(empData => 
        empData.expenses.map(exp => [
            empData.employee.name,
            format(safeDate(exp.date) || new Date(), 'PP'),
            exp.notes || '',
            formatCurrency(exp.amount)
        ])
    );
    
    autoTable(doc, {
        startY: currentY,
        head: [['Employee', 'Date', 'Notes', 'Amount']],
        body: tableData,
        foot: [['Grand Total', '', '', formatCurrency(grandTotal)]],
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
        didParseCell: function (data) {
            if (customFontBase64) {
                (data.cell.styles as any).font = "CustomFont";
            }
        }
    });

    doc.save(`employee-expenses-${format(selectedMonth, 'yyyy-MM')}.pdf`);
  }

  return (
    <>
     <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
         <div ref={pdfHeaderRef} style={{ width: '700px', background: 'white', color: 'black' }}>
            <ReportPdfHeader
              title="Employee Expenses Report"
              subtitle={`For ${format(selectedMonth, 'MMMM yyyy')}`}
              logoSrc={logoSrc ?? ''}
            />
          </div>
    </div>
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
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedMonth && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span>Pick a month</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={selectedMonth} onSelect={(date) => date && setSelectedMonth(date)} initialFocus captionLayout="dropdown-buttons" fromYear={2020} toYear={new Date().getFullYear() + 1} />
                  </PopoverContent>
                </Popover>
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
                  {isLoading ? (
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
              <Label htmlFor="amount">Amount (IQD)</Label>
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
              <Label htmlFor="notes">Notes (Optional)</Label>
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
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Expenses per Employee for {format(selectedMonth, 'MMMM yyyy')}</CardTitle>
                    </CardHeader>
                    <CardContent ref={chartRef} className="bg-background">
                        <ChartContainer config={{}} className="h-[250px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value as number)}`}/>
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
                                        <p className="text-sm text-muted-foreground">Employee Total for Month</p>
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
                                                {expense.notes && <p className="text-sm mt-1">{expense.notes}</p>}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                                            <span className="text-destructive">Delete</span>
                                                          </DropdownMenuItem>
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
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                            <CardTitle>Month's Total</CardTitle>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
                        </div>
                    </CardHeader>
                </Card>
            </>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Expenses Found for {format(selectedMonth, 'MMMM yyyy')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Get started by adding the first expense for this month.</p>
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
    </>
  );
}
