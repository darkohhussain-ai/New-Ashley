
"use client"

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, User, Clock, DollarSign, Notebook, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type Employee = {
  id: string;
  name: string;
};

type Overtime = {
  id: string;
  employeeId: string;
  date: Timestamp;
  hours: number;
  rate: number;
  amount: number;
  notes?: string;
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const OVERTIME_RATE = 5000; // Default rate in IQD

export default function OvertimePage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Editing state
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editableHours, setEditableHours] = useState<string>('');
  const [editableNotes, setEditableNotes] = useState<string>('');

  // Data fetching
  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);
  
  const overtimeQuery = useMemoFirebase(() => {
    if (!firestore || !selectedDate) return null;
    const start = Timestamp.fromDate(startOfDay(selectedDate));
    const end = Timestamp.fromDate(endOfDay(selectedDate));
    return query(collection(firestore, 'overtime'), where('date', '>=', start), where('date', '<=', end));
  }, [firestore, selectedDate]);
  
  const { data: overtimeRecords, isLoading: isLoadingOvertime } = useCollection<Overtime>(overtimeQuery);

  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const resetForm = () => {
    setSelectedEmployee('');
    setHours('');
    setNotes('');
  };

  const handleAddOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedEmployee || !hours || !selectedDate) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please select an employee and enter the hours." });
      return;
    }
    
    setIsAdding(true);
    const overtimeHours = parseFloat(hours);
    const overtimeAmount = overtimeHours * OVERTIME_RATE;

    const overtimeData = {
      employeeId: selectedEmployee,
      date: Timestamp.fromDate(selectedDate),
      hours: overtimeHours,
      rate: OVERTIME_RATE,
      amount: overtimeAmount,
      notes,
    };
    
    const overtimeColRef = collection(firestore, 'overtime');
    await addDocumentNonBlocking(overtimeColRef, overtimeData);
    
    toast({ title: "Overtime Added", description: "The record has been saved." });
    resetForm();
    setIsAdding(false);
  };
  
  const handleDelete = (overtimeId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'overtime', overtimeId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Overtime Deleted", description: "The record has been removed." });
  };
  
  const handleEdit = (record: Overtime) => {
    setEditingRecordId(record.id);
    setEditableHours(String(record.hours));
    setEditableNotes(record.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditableHours('');
    setEditableNotes('');
  };

  const handleUpdate = (recordId: string) => {
    if (!firestore) return;
    const updatedHours = parseFloat(editableHours);
    if(isNaN(updatedHours) || updatedHours < 0) {
        toast({ variant: "destructive", title: "Invalid Hours", description: "Please enter a valid number for hours." });
        return;
    }

    const updatedAmount = updatedHours * OVERTIME_RATE;
    const docRef = doc(firestore, 'overtime', recordId);
    
    updateDocumentNonBlocking(docRef, {
        hours: updatedHours,
        amount: updatedAmount,
        notes: editableNotes,
    });
    
    toast({ title: "Record Updated", description: "The overtime record has been updated." });
    handleCancelEdit();
  };

  const { totalHours, totalAmount } = useMemo(() => {
    if (!overtimeRecords) return { totalHours: 0, totalAmount: 0 };
    return overtimeRecords.reduce(
      (acc, record) => {
        acc.totalHours += record.hours;
        acc.totalAmount += record.amount;
        return acc;
      },
      { totalHours: 0, totalAmount: 0 }
    );
  }, [overtimeRecords]);

  const getEmployeeName = (employeeId: string) => {
    return employees?.find(e => e.id === employeeId)?.name || '...';
  };

  const isLoading = isLoadingEmployees || isLoadingOvertime;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/ashley-expenses">
                <ArrowLeft />
                <span className="sr-only">Back to Ashley Expenses</span>
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Employee Overtime</h1>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <form onSubmit={handleAddOvertime}>
              <Card>
                <CardHeader>
                  <CardTitle>Add Overtime Record</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="employee">Employee</label>
                    <Select onValueChange={setSelectedEmployee} value={selectedEmployee} disabled={isLoadingEmployees}>
                      <SelectTrigger id="employee">
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingEmployees ? <SelectItem value="loading" disabled>Loading...</SelectItem> : sortedEmployees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="hours">Overtime Hours</label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                       <Input id="hours" type="number" value={hours} onChange={e => setHours(e.target.value)} required placeholder="e.g. 3" className="pl-8" step="0.5" min="0"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label>Rate</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                      <Input value={formatCurrency(OVERTIME_RATE)} readOnly disabled className="pl-8 font-semibold"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notes">Notes</label>
                    <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."/>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isAdding || !selectedEmployee || !hours} className="w-full">
                    <Plus className="mr-2 h-4 w-4"/> {isAdding ? 'Adding...' : 'Add Record'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Overtime for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}</CardTitle>
                <CardDescription>A list of all overtime records for the selected date.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead><User className="inline-block mr-2 h-4 w-4"/>Employee</TableHead>
                            <TableHead><Clock className="inline-block mr-2 h-4 w-4"/>Hours</TableHead>
                            <TableHead><DollarSign className="inline-block mr-2 h-4 w-4"/>Amount (IQD)</TableHead>
                            <TableHead><Notebook className="inline-block mr-2 h-4 w-4"/>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                            ))
                        ) : overtimeRecords && overtimeRecords.length > 0 ? (
                            overtimeRecords.map(record => (
                            <TableRow key={record.id} className={cn(editingRecordId === record.id && "bg-muted")}>
                                <TableCell className="font-medium">{getEmployeeName(record.employeeId)}</TableCell>
                                <TableCell>
                                    {editingRecordId === record.id ? (
                                        <Input type="number" value={editableHours} onChange={(e) => setEditableHours(e.target.value)} className="w-20 h-8" step="0.5" min="0" />
                                    ) : (
                                        record.hours
                                    )}
                                </TableCell>
                                <TableCell>{formatCurrency(editingRecordId === record.id ? parseFloat(editableHours || '0') * OVERTIME_RATE : record.amount)}</TableCell>
                                <TableCell>
                                    {editingRecordId === record.id ? (
                                        <Textarea value={editableNotes} onChange={(e) => setEditableNotes(e.target.value)} className="min-h-[40px]" />
                                    ) : (
                                        <span className="text-muted-foreground">{record.notes || '-'}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {editingRecordId === record.id ? (
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handleUpdate(record.id)}>
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(record)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                              <AlertDialogDescription>This action cannot be undone. This will permanently delete the overtime record.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDelete(record.id)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">No overtime records for this date.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
              {overtimeRecords && overtimeRecords.length > 0 && (
                <CardFooter className="flex justify-end pt-6 border-t">
                    <div className="w-full max-w-sm space-y-2 text-right">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Overtime Hours:</span>
                          <span className="font-bold">{totalHours.toFixed(1)} hrs</span>
                      </div>
                      <div className="flex justify-between text-lg">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
