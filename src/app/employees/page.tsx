
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Plus, User, Calendar as CalendarIcon, Edit, Trash2, Save, X, Upload, Download, Mail, Phone, Cake, Briefcase, Search, Building, DollarSign, Clock, Gift, Banknote, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { EmployeePdfCard } from "@/components/employees/employee-pdf-card"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import useLocalStorage from '@/hooks/use-local-storage'
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/context/app-provider"
import type { Employee, Expense, Overtime, Bonus, CashWithdrawal } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const safeDate = (dateValue: string | undefined): Date | null => {
  if (!dateValue) return null;
  const parsed = parseISO(dateValue);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const employeeRoles = ["Manager", "IT", "Employee Supervisor", "Transport Supervisor", "Employee", "Marketing"];


function EmployeeDetailView({ employeeId, onDeselect }: { employeeId: string, onDeselect: () => void }) {
    const { toast } = useToast();
    const { 
        employees, setEmployees,
        expenses,
        overtime,
        bonuses,
        withdrawals,
    } = useAppContext();

    const employee = useMemo(() => employees.find(e => e.id === employeeId), [employees, employeeId]);
    const employeeExpenses = useMemo(() => expenses.filter(e => e.employeeId === employeeId), [expenses, employeeId]);
    const employeeOvertime = useMemo(() => overtime.filter(e => e.employeeId === employeeId), [overtime, employeeId]);
    const employeeBonuses = useMemo(() => bonuses.filter(e => e.employeeId === employeeId), [bonuses, employeeId]);
    const employeeWithdrawals = useMemo(() => withdrawals.filter(e => e.employeeId === employeeId), [withdrawals, employeeId]);


    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [uniqueId, setUniqueId] = useState('');
    const [role, setRole] = useState<Employee['role']>();
    const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(undefined);
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [notes, setNotes] = useState('');
    
    const defaultLogo = "https://picsum.photos/seed/ashley-logo/300/100";
    const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
    
    const pdfCardRef = useRef<HTMLDivElement>(null);
    const photoUploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (employee) {
            setName(employee.name);
            setUniqueId(employee.employeeId || '');
            setRole(employee.role);
            setEmploymentStartDate(safeDate(employee.employmentStartDate) || undefined);
            setDateOfBirth(safeDate(employee.dateOfBirth) || undefined);
            setEmail(employee.email || '');
            setPhone(employee.phone || '');
            setPhotoUrl(employee.photoUrl || '');
            setNotes(employee.notes || '');
        }
    }, [employee]);

    const { totalExpenses, sortedExpenses } = useMemo(() => {
        if (!employeeExpenses) return { totalExpenses: 0, sortedExpenses: [] };
        const total = employeeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const sorted = [...employeeExpenses].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return { totalExpenses: total, sortedExpenses: sorted };
    }, [employeeExpenses]);

    const { totalOvertimeAmount, totalOvertimeHours, sortedOvertime } = useMemo(() => {
        if (!employeeOvertime) return { totalOvertimeAmount: 0, totalOvertimeHours: 0, sortedOvertime: [] };
        const totals = employeeOvertime.reduce((acc, ot) => {
            acc.totalAmount += ot.totalAmount;
            acc.totalHours += ot.hours;
            return acc;
        }, { totalAmount: 0, totalHours: 0 });
        const sorted = [...employeeOvertime].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return { totalOvertimeAmount: totals.totalAmount, totalOvertimeHours: totals.totalHours, sortedOvertime: sorted };
    }, [employeeOvertime]);

    const { totalBonuses, sortedBonuses } = useMemo(() => {
        if (!employeeBonuses) return { totalBonuses: 0, sortedBonuses: [] };
        const total = employeeBonuses.reduce((sum, b) => sum + b.amount, 0);
        const sorted = [...employeeBonuses].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return { totalBonuses: total, sortedBonuses: sorted };
    }, [employeeBonuses]);

    const { totalWithdrawals, sortedWithdrawals } = useMemo(() => {
        if (!employeeWithdrawals) return { totalWithdrawals: 0, sortedWithdrawals: [] };
        const total = employeeWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        const sorted = [...employeeWithdrawals].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return { totalWithdrawals: total, sortedWithdrawals: sorted };
    }, [employeeWithdrawals]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setPhotoUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = () => {
        if (!employeeId || !name) return;
        
        const updatedData: Partial<Employee> = {
            name,
            employeeId: uniqueId,
            role,
            employmentStartDate: employmentStartDate ? employmentStartDate.toISOString() : undefined,
            dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
            email,
            phone,
            photoUrl,
            notes,
        };

        setEmployees(employees.map(emp => emp.id === employeeId ? { ...emp, ...updatedData } : emp));
        
        toast({ title: "Success", description: "Employee details updated." });
        setIsEditing(false);
    };
    
    const handleDelete = () => {
        if(!employeeId) return;
        setEmployees(employees.filter(e => e.id !== employeeId));
        toast({ title: "Employee Deleted", description: `${employee?.name} has been removed.` });
        onDeselect();
    }

    const handleDownloadPdf = async () => {
        if (!pdfCardRef.current || !employee) return;
        const canvas = await html2canvas(pdfCardRef.current, { scale: 3, useCORS: true, backgroundColor: null });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({ 
            orientation: 'landscape',
            unit: 'px', 
            format: [600, 360]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 600, 360);
        pdf.save(`${employee.name.replace(/ /g, '_')}_card.pdf`);
    };

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <User className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold">Employee Not Found</h2>
                <p className="text-muted-foreground">The employee you're looking for may have been deleted.</p>
            </div>
        )
    }

    const safeEmploymentStartDate = safeDate(employee.employmentStartDate);
    const safeDateOfBirth = safeDate(employee.dateOfBirth);

    return (
        <>
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={pdfCardRef}><EmployeePdfCard employee={employee} logoSrc={logoSrc} /></div>
            </div>
            <div className="w-full h-full flex flex-col">
                <header className="flex items-center justify-end gap-2 p-4 border-b">
                    {isEditing ? (
                        <>
                            <Button onClick={handleUpdate}><Save className="mr-2 h-4 w-4"/> Save</Button>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4"/> Cancel</Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4"/> Edit</Button>
                            <Button onClick={handleDownloadPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> PDF</Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete {employee.name}'s record.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </header>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="flex-col md:flex-row gap-6 space-y-0 items-start">
                             <div className="relative">
                                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary/20">
                                    <AvatarImage src={isEditing ? photoUrl : employee.photoUrl} alt={employee.name} />
                                    <AvatarFallback><User className="w-16 h-16"/></AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 rounded-full h-10 w-10" onClick={() => photoUploadRef.current?.click()}>
                                        <Upload className="w-5 h-5"/>
                                        <input ref={photoUploadRef} type="file" onChange={handlePhotoUpload} accept="image/*" className="hidden"/>
                                    </Button>
                                )}
                            </div>
                            <div className="w-full">
                                {isEditing ? (
                                    <div className='space-y-4'>
                                        <Input className="text-2xl font-bold h-12" value={name} onChange={e => setName(e.target.value)} placeholder="Employee Name" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input value={uniqueId} onChange={e => setUniqueId(e.target.value)} placeholder="Employee ID Number" />
                                            <Select value={role} onValueChange={(v: Employee['role']) => setRole(v)}>
                                                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                                <SelectContent>
                                                    {employeeRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={cn("justify-start text-left font-normal", !employmentStartDate && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {employmentStartDate ? `Started: ${format(employmentStartDate, 'PPP')}` : <span>Pick start date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={employmentStartDate} onSelect={setEmploymentStartDate} initialFocus captionLayout="dropdown-nav" fromYear={1990} toYear={2040} /></PopoverContent>
                                            </Popover>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={cn("justify-start text-left font-normal", !dateOfBirth && "text-muted-foreground")}>
                                                        <Cake className="mr-2 h-4 w-4" />
                                                        {dateOfBirth ? `Born: ${format(dateOfBirth, 'PPP')}` : <span>Pick birth date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} initialFocus captionLayout="dropdown-nav" fromYear={1950} toYear={new Date().getFullYear()} /></PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <CardTitle className="text-3xl md:text-4xl font-bold">{employee.name}</CardTitle>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                            {employee.role && <CardDescription className="text-lg md:text-xl flex items-center gap-2"><Shield className="w-5 h-5"/>{employee.role}</CardDescription>}
                                        </div>
                                        <div className="mt-4 space-y-2 text-muted-foreground">
                                            {employee.employeeId && <p className="flex items-center gap-2 font-mono">ID: {employee.employeeId}</p>}
                                            {safeEmploymentStartDate && <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> Started on {format(safeEmploymentStartDate, 'MMMM d, yyyy')}</p>}
                                            {safeDateOfBirth && <p className="flex items-center gap-2"><Cake className="w-4 h-4"/> Born on {format(safeDateOfBirth, 'MMMM d, yyyy')}</p>}
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    {isEditing ? (
                                        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@example.com" className="pl-10" /></div>
                                    ) : ( <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/> {employee.email || 'No email'}</p>)}
                                </div>
                                 <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    {isEditing ? (
                                        <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0000-000-000" className="pl-10"/></div>
                                    ) : (<p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> {employee.phone || 'No phone'}</p>)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                {isEditing ? (
                                    <Textarea className="min-h-[120px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..."/>
                                ) : (<p className="whitespace-pre-wrap text-muted-foreground">{employee.notes || 'No notes.'}</p>)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-500"/> Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sortedExpenses.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                        <TableBody>{sortedExpenses.slice(0, 3).map(e => (<TableRow key={e.id}><TableCell>{format(parseISO(e.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(e.amount)}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                ) : <p className="text-sm text-center text-muted-foreground py-4">No expenses.</p>}
                            </CardContent>
                            {sortedExpenses.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 font-bold text-sm"><span className="text-muted-foreground">Total:</span><span className="text-blue-500">{formatCurrency(totalExpenses)}</span></CardFooter>}
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-500"/> Overtime
                                    </CardTitle>
                                    <Badge variant="outline">{totalOvertimeHours.toFixed(2)} hrs</Badge>
                                </div>
                                <CardDescription>This Month: {format(new Date(), 'MMMM yyyy')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sortedOvertime.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                        <TableBody>{sortedOvertime.slice(0, 3).map(o => (<TableRow key={o.id}><TableCell>{format(parseISO(o.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(o.totalAmount)}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                ) : <p className="text-sm text-center text-muted-foreground py-4">No overtime this month.</p>}
                            </CardContent>
                            {sortedOvertime.length > 0 && 
                                <CardFooter className="justify-end gap-2 bg-muted/50 font-bold text-sm">
                                    <span className="text-muted-foreground">Month's Total:</span>
                                    <span className="text-orange-500">{formatCurrency(totalOvertimeAmount)}</span>
                                </CardFooter>
                            }
                        </Card>

                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-green-500"/> Bonuses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sortedBonuses.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                        <TableBody>{sortedBonuses.slice(0, 3).map(b => (<TableRow key={b.id}><TableCell>{format(parseISO(b.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(b.amount)}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                ) : <p className="text-sm text-center text-muted-foreground py-4">No bonuses.</p>}
                            </CardContent>
                            {sortedBonuses.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 font-bold text-sm"><span className="text-muted-foreground">Total:</span><span className="text-green-500">{formatCurrency(totalBonuses)}</span></CardFooter>}
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5 text-rose-500"/> Cash Withdrawals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sortedWithdrawals.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                        <TableBody>{sortedWithdrawals.slice(0, 3).map(w => (<TableRow key={w.id}><TableCell>{format(parseISO(w.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(w.amount)}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                ) : <p className="text-sm text-center text-muted-foreground py-4">No withdrawals.</p>}
                            </CardContent>
                            {sortedWithdrawals.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 font-bold text-sm"><span className="text-muted-foreground">Total:</span><span className="text-rose-500">{formatCurrency(totalWithdrawals)}</span></CardFooter>}
                        </Card>
                    </div>

                </div>
            </div>
        </>
    )
}

function AddEmployeeDialog({ open, onOpenChange, addEmployee }: { open: boolean, onOpenChange: (open: boolean) => void, addEmployee: (employee: Omit<Employee, 'id'>) => void }) {
    const { toast } = useToast();
    
    const [name, setName] = useState("");
    const [uniqueId, setUniqueId] = useState("");
    const [role, setRole] = useState<Employee['role']>();
    const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>();
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | undefined>();
    const [notes, setNotes] = useState("");

    const resetForm = () => {
        setName(""); setUniqueId(""); setRole(undefined); setEmploymentStartDate(undefined); setDateOfBirth(undefined);
        setEmail(""); setPhone(""); setPhotoUrl(undefined); setNotes("");
        onOpenChange(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Name is required',
                description: 'Please enter a name for the employee.',
            });
            return;
        }

        const employeeData: Omit<Employee, 'id'> = { 
          name,
          employeeId: uniqueId || undefined,
          role: role,
          photoUrl: photoUrl || `https://picsum.photos/seed/${name.replace(/\s/g, '-')}/400`,
          email: email || undefined,
          phone: phone || undefined,
          notes: notes || undefined,
          employmentStartDate: employmentStartDate?.toISOString(),
          dateOfBirth: dateOfBirth?.toISOString(),
        };
        
        addEmployee(employeeData);
        toast({ title: "Employee Added", description: `${name} has been added to the list.` });
        resetForm();
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setPhotoUrl(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24"><AvatarImage src={photoUrl} /><AvatarFallback><User className="w-12 h-12" /></AvatarFallback></Avatar>
                        <Input id="photo" type="file" onChange={handlePhotoUpload} accept="image/*" />
                    </div>
                    <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="employeeId">Employee ID (Optional)</Label><Input id="employeeId" value={uniqueId} onChange={e => setUniqueId(e.target.value)} placeholder="e.g. 10234" /></div>
                        <div className="space-y-2"><Label htmlFor="role">Role (Optional)</Label>
                            <Select onValueChange={(v: Employee['role']) => setRole(v)} value={role}>
                                <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                <SelectContent>
                                    {employeeRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Email (Optional)</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@example.com" className="pl-10" /></div></div>
                        <div className="space-y-2"><Label>Phone (Optional)</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0000-000-000" className="pl-10"/></div></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Start Date (Optional)</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!employmentStartDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{employmentStartDate ? format(employmentStartDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={employmentStartDate} onSelect={setEmploymentStartDate} captionLayout="dropdown-nav" fromYear={1990} toYear={2040} initialFocus/></PopoverContent></Popover></div>
                        <div className="space-y-2"><Label>Date of Birth (Optional)</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!dateOfBirth && "text-muted-foreground")}><Cake className="mr-2 h-4 w-4" />{dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} captionLayout="dropdown-nav" fromYear={1950} toYear={new Date().getFullYear()} initialFocus/></PopoverContent></Popover></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="notes">Notes (Optional)</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Specializes in frontend development." /></div>
                    <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Add Employee</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function EmployeesPage() {
  const { employees, setEmployees } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      ...employeeData
    };
    setEmployees([...employees, newEmployee]);
  };

  useEffect(() => {
    if (employees) {
      setIsLoading(false);
    }
  }, [employees]);


  const sortedAndFilteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
        const aIsMarketing = a.role === 'Marketing';
        const bIsMarketing = b.role === 'Marketing';

        if (!aIsMarketing && bIsMarketing) {
            return -1; // Warehouse employees come first
        }
        if (aIsMarketing && !bIsMarketing) {
            return 1; // Marketing employees come after
        }
        
        // If both are same type (both warehouse or both marketing), sort by name
        return a.name.localeCompare(b.name);
    });
  }, [employees, searchQuery]);

  useEffect(() => {
    if (!selectedEmployeeId && sortedAndFilteredEmployees.length > 0) {
      setSelectedEmployeeId(sortedAndFilteredEmployees[0].id);
    }
    if (selectedEmployeeId && !sortedAndFilteredEmployees.some(e => e.id === selectedEmployeeId)) {
        setSelectedEmployeeId(sortedAndFilteredEmployees[0]?.id || null);
    }
  }, [sortedAndFilteredEmployees, selectedEmployeeId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
        <AddEmployeeDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} addEmployee={addEmployee} />
        <header className="bg-card border-b p-4">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild><Link href="/"><ArrowLeft /></Link></Button>
                    <h1 className="text-xl font-bold">Employees</h1>
                </div>
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
            <aside className="w-full max-w-xs border-r flex flex-col">
                <div className="p-4 space-y-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search employees..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                     <Button onClick={() => setAddDialogOpen(true)} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                         <div className="p-4 space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                    ) : sortedAndFilteredEmployees.length > 0 ? (
                        <div className="p-2 space-y-1">
                            {sortedAndFilteredEmployees.map(emp => (
                                <button key={emp.id} onClick={() => setSelectedEmployeeId(emp.id)} className={cn("w-full text-left p-3 rounded-lg transition-colors flex items-center gap-4",
                                    selectedEmployeeId === emp.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                )}>
                                    <Avatar className="w-10 h-10"><AvatarImage src={emp.photoUrl} /><AvatarFallback>{emp.name.charAt(0)}</AvatarFallback></Avatar>
                                    <div>
                                        <p className="font-semibold">{emp.name}</p>
                                        <p className={cn("text-xs", selectedEmployeeId === emp.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                            {emp.role || 'No Role'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center p-8">
                            <User className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No Employees Found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Try a different search or add a new employee.</p>
                        </div>
                    )}
                </div>
            </aside>
            
            <main className="flex-1 flex items-center justify-center overflow-y-auto">
                {selectedEmployeeId ? (
                    <EmployeeDetailView employeeId={selectedEmployeeId} onDeselect={() => setSelectedEmployeeId(null)}/>
                ) : (
                    !isLoading && (
                        <div className="text-center">
                            <Building className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-bold">Select an Employee</h2>
                            <p className="text-muted-foreground">Choose an employee from the list to view their details.</p>
                        </div>
                    )
                )}
            </main>
        </div>
    </div>
  )
}
