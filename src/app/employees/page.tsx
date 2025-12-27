"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useCollection, useDoc, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { collection, doc, Timestamp, writeBatch } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Plus, User, Calendar as CalendarIcon, Edit, Trash2, Save, X, Upload, Download, Mail, Phone, Cake, Briefcase, Search, Building } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { EmployeePdfCard } from "@/components/employees/employee-pdf-card"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import useLocalStorage from '@/hooks/use-local-storage'
import { Skeleton } from "@/components/ui/skeleton"


type Employee = {
  id: string;
  name: string;
  jobTitle?: string;
  employmentStartDate?: Timestamp | Date;
  dateOfBirth?: Timestamp | Date;
  email?: string;
  phone?: string;
  photoUrl?: string;
  notes?: string;
}

const safeDate = (dateValue: Timestamp | Date | undefined): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof (dateValue as Timestamp).toDate === 'function') {
    return (dateValue as Timestamp).toDate();
  }
  const parsed = new Date(dateValue as any);
  return isNaN(parsed.getTime()) ? null : parsed;
};

function EmployeeDetailView({ employeeId, onDeselect }: { employeeId: string, onDeselect: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();

    const employeeRef = useMemoFirebase(() => (firestore && employeeId && user ? doc(firestore, 'employees', employeeId) : null), [firestore, employeeId, user]);
    const { data: employee, isLoading } = useDoc<Employee>(employeeRef);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(undefined);
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [notes, setNotes] = useState('');
    
    const defaultLogo = "https://images.unsplash.com/photo-1748326650737-33500fdfda30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGxvZ298ZW58MHx8fHwxNzY2MzgxMzI1fDA&ixlib=rb-4.1.0&q=80&w=1080";
    const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
    
    const pdfCardRef = useRef<HTMLDivElement>(null);
    const photoUploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (employee) {
            setName(employee.name);
            setJobTitle(employee.jobTitle || '');
            setEmploymentStartDate(safeDate(employee.employmentStartDate) || undefined);
            setDateOfBirth(safeDate(employee.dateOfBirth) || undefined);
            setEmail(employee.email || '');
            setPhone(employee.phone || '');
            setPhotoUrl(employee.photoUrl || '');
            setNotes(employee.notes || '');
        }
    }, [employee]);

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
        if (!firestore || !employeeId || !name) return;
        
        const updatedData: Partial<Employee> = {
            name,
            jobTitle,
            employmentStartDate: employmentStartDate ? Timestamp.fromDate(employmentStartDate) : undefined,
            email,
            phone,
            photoUrl,
            notes,
        };

        if (dateOfBirth) {
            updatedData.dateOfBirth = Timestamp.fromDate(dateOfBirth);
        }

        const docRef = doc(firestore, 'employees', employeeId);
        updateDocumentNonBlocking(docRef, updatedData);
        
        toast({ title: "Success", description: "Employee details updated." });
        setIsEditing(false);
    };
    
    const handleDelete = () => {
        if(!firestore || !employeeId) return;
        const docRef = doc(firestore, 'employees', employeeId);
        deleteDocumentNonBlocking(docRef);
        toast({ title: "Employee Deleted", description: `${employee?.name} has been removed.` });
        onDeselect();
    }

    const handleDownloadPdf = async () => {
        if (!pdfCardRef.current || !employee) return;
        const canvas = await html2canvas(pdfCardRef.current, { scale: 3, useCORS: true, backgroundColor: null });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${employee.name.replace(/ /g, '_')}_card.pdf`);
    };

    if (isLoading || isUserLoading) {
        return <div className="p-8 w-full"><Skeleton className="h-[400px] w-full" /></div>;
    }
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
                <div className="flex-1 overflow-y-auto p-6">
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
                                        <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Job Title" />
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
                                        <CardDescription className="text-lg md:text-xl mt-2 flex items-center gap-2"><Briefcase className="w-5 h-5"/>{employee.jobTitle || 'No title'}</CardDescription>
                                        <div className="mt-4 space-y-2 text-muted-foreground">
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
                </div>
            </div>
        </>
    )
}

function AddEmployeeDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const employeesRef = useMemoFirebase(() => (firestore && user ? collection(firestore, "employees") : null), [firestore, user]);
    const { toast } = useToast();
    
    const [name, setName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>();
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | undefined>();
    const [notes, setNotes] = useState("");

    const resetForm = () => {
        setName(""); setJobTitle(""); setEmploymentStartDate(undefined); setDateOfBirth(undefined);
        setEmail(""); setPhone(""); setPhotoUrl(undefined); setNotes("");
        onOpenChange(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not Authenticated',
                description: 'You must be logged in to add an employee.',
            });
            return;
        }

        if (!name.trim() || !firestore || !employeesRef) {
            toast({
                variant: 'destructive',
                title: 'Name is required',
                description: 'Please enter a name for the employee.',
            });
            return;
        }

        const employeeData: Partial<Omit<Employee, 'id'>> = { 
          name,
          photoUrl: photoUrl || `https://picsum.photos/seed/${name.replace(/\s/g, '-')}/400`
        };

        if (jobTitle) employeeData.jobTitle = jobTitle;
        if (email) employeeData.email = email;
        if (phone) employeeData.phone = phone;
        if (notes) employeeData.notes = notes;
        if (employmentStartDate) employeeData.employmentStartDate = Timestamp.fromDate(employmentStartDate);
        if (dateOfBirth) employeeData.dateOfBirth = Timestamp.fromDate(dateOfBirth);
        
        addDocumentNonBlocking(employeesRef, employeeData);
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
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24"><AvatarImage src={photoUrl} /><AvatarFallback><User className="w-12 h-12" /></AvatarFallback></Avatar>
                        <Input id="photo" type="file" onChange={handlePhotoUpload} accept="image/*" />
                    </div>
                    <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" /></div>
                    <div className="space-y-2"><Label htmlFor="jobTitle">Job Title (Optional)</Label><Input id="jobTitle" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Graphic Designer" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Email (Optional)</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@example.com" className="pl-10" /></div></div>
                        <div className="space-y-2"><Label>Phone (Optional)</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0000-000-000" className="pl-10"/></div></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Start Date (Optional)</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!employmentStartDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{employmentStartDate ? format(employmentStartDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={employmentStartDate} onSelect={setEmploymentStartDate} captionLayout="dropdown-nav" fromYear={1990} toYear={2040} initialFocus/></PopoverContent></Popover></div>
                        <div className="space-y-2"><Label>Date of Birth (Optional)</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!dateOfBirth && "text-muted-foreground")}><Cake className="mr-2 h-4 w-4" />{dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} captionLayout="dropdown-nav" fromYear={1950} toYear={new Date().getFullYear()} initialFocus/></PopoverContent></Popover></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="notes">Notes (Optional)</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Specializes in frontend development." /></div>
                    <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Add Employee</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function EmployeesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const employeesRef = useMemoFirebase(() => (firestore && user ? collection(firestore, "employees") : null), [firestore, user]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesRef);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dataSeeded = useLocalStorage('employee-data-seeded-v1', false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const seedData = async () => {
      if (!firestore || !employeesRef || isSeeding || dataSeeded[0]) return;
      
      const existingEmployees = employees || [];
      if(existingEmployees.length > 0) {
        dataSeeded[1](true); // Mark as seeded if there's already data.
        return;
      }

      setIsSeeding(true);
      toast({ title: 'Adding Employees', description: 'Populating the employee list from the image...' });

      const newEmployees = [
        { name: 'كامه ران عمر روؤف', date: '15/9/2025' },
        { name: 'دانه ر محمد باسام', date: '20/5/2024' },
        { name: 'داركو حيدر حسين', date: '1/5/2025' },
        { name: 'را بهر محمد محمود', date: '20/4/2024' },
        { name: 'راژان سالح فه تاح', date: '13/7/2024' },
        { name: 'سه روه ت قادر محمد', date: '16/10/2024' },
        { name: 'گوفار سه ردار احمد', date: '1/2/2025' },
        { name: 'محمد حاميد محمد', date: '3/10/2024' },
        { name: 'عيماد سه باح نوری', date: '15/11/2023' },
        { name: 'ريبين سه باح نوری', date: '22/6/2024' },
        { name: 'ره وه ند نجات محمد حسن', date: '10/5/2025' },
        { name: 'سه هه ند مه ریوان حمه سعيد', date: '1/1/2024' },
        { name: 'شادومان یادگار رحیم', date: '30/9/2024' },
        { name: 'هه ردی ئازاد ئه حمه د', date: '13/5/2025' },
        { name: 'هه قال حبيب حمه ره زا', date: '13/5/2025' },
        { name: 'تاری مه ولود حه مه', date: '10/5/2025' },
        { name: 'کارزان دارا به کر', date: '13/5/2025' },
      ];

      const parseDate = (dateString: string) => {
        const parts = dateString.split('/');
        // Month is 0-indexed in JS Date, so parts[1] - 1
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      };

      try {
        const batch = writeBatch(firestore);
        newEmployees.forEach(emp => {
          const newDocRef = doc(collection(firestore, 'employees'));
          const employeeData: Partial<Omit<Employee, 'id'>> = {
            name: emp.name,
            employmentStartDate: Timestamp.fromDate(parseDate(emp.date)),
            photoUrl: `https://picsum.photos/seed/${emp.name.replace(/\s/g, '-')}/400`
          };
          batch.set(newDocRef, employeeData);
        });

        await batch.commit();
        toast({ title: 'Success!', description: 'All employees have been added.' });
        dataSeeded[1](true);
      } catch (error) {
        console.error('Error seeding data:', error);
        toast({ variant: 'destructive', title: 'Seeding Failed', description: 'Could not add the employees.' });
      } finally {
        setIsSeeding(false);
      }
    };
    if (user) { // Only run when user is available
      seedData();
    }
  }, [firestore, employeesRef, user, employees, dataSeeded, isSeeding, toast]);


  const sortedAndFilteredEmployees = useMemo(() => {
    if (!employees) return [];
    const filtered = employees.filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchQuery]);

  // Automatically select the first employee if none is selected and data is available
  useEffect(() => {
    if (!selectedEmployeeId && sortedAndFilteredEmployees.length > 0) {
      setSelectedEmployeeId(sortedAndFilteredEmployees[0].id);
    }
  }, [sortedAndFilteredEmployees, selectedEmployeeId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
        <AddEmployeeDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
        <header className="bg-card border-b p-4">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild><Link href="/"><ArrowLeft /></Link></Button>
                    <h1 className="text-xl font-bold">Employees</h1>
                </div>
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
            {/* Left Column: Employee List */}
            <aside className="w-full max-w-xs border-r flex flex-col">
                <div className="p-4 space-y-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search employees..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                     <Button onClick={() => setAddDialogOpen(true)} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading || isUserLoading || isSeeding ? (
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
                                            {emp.jobTitle || 'No Title'}
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
            
            {/* Right Column: Employee Details */}
            <main className="flex-1 flex items-center justify-center overflow-y-auto">
                {selectedEmployeeId ? (
                    <EmployeeDetailView employeeId={selectedEmployeeId} onDeselect={() => setSelectedEmployeeId(null)}/>
                ) : (
                    !(isLoading || isUserLoading || isSeeding) && (
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
