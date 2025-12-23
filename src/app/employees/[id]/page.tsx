
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import { ArrowLeft, User, Calendar as CalendarIcon, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type Employee = {
  id: string;
  name: string;
  employmentStartDate: Timestamp;
  photoUrl?: string;
  notes?: string;
};

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const employeeId = params.id as string;

  const firestore = useFirestore();
  const employeeRef = useMemoFirebase(() => (firestore && employeeId ? doc(firestore, 'employees', employeeId) : null), [firestore, employeeId]);
  const { data: employee, isLoading } = useDoc<Employee>(employeeRef);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmploymentStartDate(employee.employmentStartDate.toDate());
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
    if (!firestore || !employeeId || !name || !employmentStartDate) return;
    
    const updatedData = {
        name,
        employmentStartDate: Timestamp.fromDate(employmentStartDate),
        photoUrl,
        notes,
    };

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
      router.push('/employees');
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-8"></div>
            <Card>
                <CardHeader className="flex-row gap-6 space-y-0">
                     <div className="w-24 h-24 rounded-full bg-muted"></div>
                     <div className="w-full space-y-2">
                        <div className="h-8 w-1/2 rounded bg-muted"></div>
                        <div className="h-5 w-1/3 rounded bg-muted"></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 mt-4">
                    <div className="h-5 w-full rounded bg-muted"></div>
                    <div className="h-5 w-full rounded bg-muted"></div>
                    <div className="h-20 w-full rounded bg-muted"></div>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <User className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Employee Not Found</h2>
        <p className="text-muted-foreground mb-6">The employee you're looking for doesn't seem to exist.</p>
        <Button asChild>
          <Link href="/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/employees">
            <ArrowLeft />
          </Link>
        </Button>
        <div className='flex items-center gap-2'>
            {isEditing ? (
                <>
                    <Button onClick={handleUpdate}><Save className="mr-2 h-4 w-4"/> Save Changes</Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4"/> Cancel</Button>
                </>
            ) : (
                <>
                    <Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4"/> Edit</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete {employee.name}'s record from the database.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </div>
      </header>

      <Card>
        <CardHeader className="flex-col md:flex-row gap-6 space-y-0">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary/20">
            <AvatarImage src={isEditing ? photoUrl : employee.photoUrl} alt={employee.name} />
            <AvatarFallback>
                <User className="w-16 h-16"/>
            </AvatarFallback>
          </Avatar>
          <div className="w-full">
            {isEditing ? (
                <div className='space-y-4'>
                    <Input className="text-2xl font-bold h-12" value={name} onChange={e => setName(e.target.value)} placeholder="Employee Name" />
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !employmentStartDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {employmentStartDate ? format(employmentStartDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={employmentStartDate} onSelect={setEmploymentStartDate} initialFocus captionLayout="dropdown-nav" fromYear={1990} toYear={2040} />
                        </PopoverContent>
                    </Popover>
                    <div className="space-y-2">
                      <Label htmlFor="photo-url">Photo URL</Label>
                      <Input id="photo-url" placeholder="Paste an image URL" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photo-upload">Or Upload Photo</Label>
                      <Input id="photo-upload" type="file" onChange={handlePhotoUpload} accept="image/*" />
                    </div>
                </div>
            ) : (
                <>
                    <CardTitle className="text-3xl md:text-4xl font-bold">{employee.name}</CardTitle>
                    <CardDescription className="text-lg md:text-xl mt-2 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5"/>
                        Started on {format(employee.employmentStartDate.toDate(), 'MMMM d, yyyy')}
                    </CardDescription>
                </>
            )}
          </div>
        </CardHeader>
        <CardContent className="mt-6">
            <Label className='text-sm text-muted-foreground'>Notes</Label>
            {isEditing ? (
                <Textarea className="mt-1 min-h-[120px] text-base" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about the employee..."/>
            ) : (
                <p className="text-base mt-1 whitespace-pre-wrap">{employee.notes || 'No additional notes.'}</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
