
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, Clock, User, Edit, Save, X } from 'lucide-react';
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
  totalAmount: number;
  notes?: string;
};

const OVERTIME_RATE = 5000; // Default: 5,000 IQD per hour

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function OvertimePage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editingRecord, setEditingRecord] = useState<Overtime | null>(null);

  // Data fetching
  const employeesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'employees') : null), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);

  const overtimeQuery = useMemoFirebase(() => {
    if (!firestore || !selectedDate) return null;
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return query(collection(firestore, 'overtime'), where('date', '>=', start), where('date', '<=', end));
  }, [firestore, selectedDate]);

  const { data: overtimeRecords, isLoading: isLoadingOvertime } = useCollection<Overtime>(overtimeQuery);

  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.name || '...';
  
  const resetForm = () => {
    setSelectedEmployee('');
    setHours('');
    setNotes('');
  };
  
  const startEditing = (record: Overtime) => {
    setEditingRecord(record);
  };
  
  const cancelEditing = () => {
    setEditingRecord(null);
  };
  
  const handleUpdateRecord = () => {
    if(!firestore || !editingRecord) return;
    
    setIsSaving(true);
    const docRef = doc(firestore, 'overtime', editingRecord.id);
    
    const updatedData = {
        hours: editingRecord.hours,
        notes: editingRecord.notes,
        totalAmount: editingRecord.hours * editingRecord.rate,
    };
    
    updateDocumentNonBlocking(docRef, updatedData)
        .then(() => {
            toast({ title: 'Success', description: 'Overtime record updated.' });
            setEditingRecord(null);
        })
        .catch(e => {
            console.error("Update error: ", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update record.' });
        })
        .finally(() => setIsSaving(false));
  };


  const handleAddOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedEmployee || !hours || !selectedDate) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please select an employee and enter the hours.' });
      return;
    }
    
    setIsSaving(true);
    const overtimeData = {
      employeeId: selectedEmployee,
      date: Timestamp.fromDate(selectedDate),
      hours: parseFloat(hours),
      rate: OVERTIME_RATE,
      totalAmount: parseFloat(hours) * OVERTIME_RATE,
      notes,
    };

    addDocumentNonBlocking(collection(firestore, 'overtime'), overtimeData)
      .then(() => {
        toast({ title: 'Overtime Added', description: 'The record has been added.' });
        resetForm();
      })
      .catch((e) => {
        console.error("Add error: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add record.' });
      })
      .finally(() => setIsSaving(false));
  };

  const handleDelete = (recordId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'overtime', recordId);
    deleteDocumentNonBlocking(docRef)
      .then(() => {
        toast({ title: 'Record Deleted', description: 'The overtime record has been removed.' });
      })
      .catch((e) => {
        console.error("Delete error: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete record.' });
      });
  };

  const { totalHours, totalAmount } = useMemo(() => {
    if (!overtimeRecords) return { totalHours: 0, totalAmount: 0 };
    return overtimeRecords.reduce(
      (acc, record) => {
        acc.totalHours += record.hours;
        acc.totalAmount += record.totalAmount;
        return acc;
      },
      { totalHours: 0, totalAmount: 0 }
    );
  }, [overtimeRecords]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/ashley-expenses">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Employee Overtime</h1>
          </div>
          <div className="w-48">
             <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add Overtime Record</CardTitle>
                <CardDescription>Select an employee and enter their overtime hours for the selected date.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAddOvertime}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="employee">Employee</label>
                    <Select onValueChange={setSelectedEmployee} value={selectedEmployee} disabled={isSaving}>
                      <SelectTrigger id="employee">
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingEmployees ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          sortedEmployees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="hours">Overtime Hours</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="hours" type="number" value={hours} onChange={e => setHours(e.target.value)} required placeholder="e.g., 2.5" className="pl-8" disabled={isSaving} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notes">Notes</label>
                    <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes about the overtime" disabled={isSaving}/>
                  </div>
                   <p className="text-sm text-muted-foreground">
                    Overtime rate: {formatCurrency(OVERTIME_RATE)} / hour
                  </p>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Overtime Records for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {isLoadingOvertime ? (
                    <div className="p-8 text-center text-muted-foreground">Loading records...</div>
                  ) : overtimeRecords && overtimeRecords.length > 0 ? (
                    overtimeRecords.map(record => (
                      <div key={record.id} className="py-3 flex justify-between items-start gap-4">
                        {editingRecord?.id === record.id ? (
                           <div className="flex-1 space-y-2">
                               <p className="font-bold">{getEmployeeName(record.employeeId)}</p>
                               <Input 
                                 type="number" 
                                 value={editingRecord.hours}
                                 onChange={(e) => setEditingRecord({...editingRecord, hours: parseFloat(e.target.value) || 0})}
                                 className="h-8"
                               />
                               <Textarea 
                                 value={editingRecord.notes}
                                 onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                                 placeholder="Notes..."
                               />
                           </div>
                        ) : (
                           <div className="flex-1">
                            <p className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {getEmployeeName(record.employeeId)}</p>
                            <p className="text-sm text-muted-foreground">{record.hours} hours</p>
                            {record.notes && <p className="text-sm mt-1">{record.notes}</p>}
                          </div>
                        )}
                        <div className='flex flex-col items-end'>
                            <p className="font-semibold text-primary">{formatCurrency(record.totalAmount)}</p>
                            {editingRecord?.id === record.id ? (
                                <div className="flex gap-1 mt-2">
                                    <Button size="icon" className="h-8 w-8" onClick={handleUpdateRecord} disabled={isSaving}><Save className="h-4 w-4"/></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                                </div>
                            ) : (
                                <div className="flex gap-1 mt-1">
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
                                                <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This will permanently delete the overtime record for {getEmployeeName(record.employeeId)}.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(record.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">No overtime records for this date.</div>
                  )}
                </div>
              </CardContent>
              {overtimeRecords && overtimeRecords.length > 0 && (
                <CardFooter className="flex justify-between font-bold bg-muted/50 py-4 rounded-b-lg">
                  <span>Total</span>
                  <div className='text-right'>
                     <p>{totalHours.toFixed(2)} hours</p>
                     <p className="text-primary">{formatCurrency(totalAmount)}</p>
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
