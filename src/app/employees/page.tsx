
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, User, Calendar as CalendarIcon, Briefcase, Mail, Phone, Cake } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { collection, Timestamp } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Employee = {
  id: string;
  name: string;
  jobTitle?: string;
  employmentStartDate: Timestamp;
  dateOfBirth?: Timestamp;
  email?: string;
  phone?: string;
  photoUrl?: string;
  notes?: string;
}

export default function EmployeesPage() {
  const firestore = useFirestore();
  const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, "employees") : null, [firestore]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesRef);
  
  const [name, setName] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(new Date());
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [notes, setNotes] = useState("")
  
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !employmentStartDate || !firestore) return;

    const employeeData: Partial<Employee> = {
      name,
      jobTitle,
      employmentStartDate: Timestamp.fromDate(employmentStartDate),
      notes,
      email,
      phone,
      photoUrl: photoUrl || `https://picsum.photos/seed/${name}/200/200`
    };
    if (dateOfBirth) {
        employeeData.dateOfBirth = Timestamp.fromDate(dateOfBirth);
    }
    
    addDocumentNonBlocking(employeesRef!, employeeData);
    
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setJobTitle("")
    setEmploymentStartDate(new Date())
    setDateOfBirth(undefined)
    setEmail("")
    setPhone("")
    setPhotoUrl(undefined)
    setNotes("")
    setOpen(false)
  }
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  }

  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);


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
            <h1 className="text-2xl md:text-3xl font-bold">Employees Dashboard</h1>
          </div>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </DialogTrigger>
        </header>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={photoUrl} alt="Employee photo" />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
               <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="photo">Employee Photo</Label>
                  <Input id="photo" type="file" onChange={handlePhotoUpload} accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input id="jobTitle" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Graphic Designer" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@example.com" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0000-000-000" className="pl-10"/>
                  </div>
                </div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!employmentStartDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {employmentStartDate ? format(employmentStartDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={employmentStartDate} onSelect={setEmploymentStartDate} captionLayout="dropdown-nav" fromYear={1990} toYear={2040} initialFocus/>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!dateOfBirth && "text-muted-foreground")}>
                        <Cake className="mr-2 h-4 w-4" />
                        {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} captionLayout="dropdown-nav" fromYear={1950} toYear={new Date().getFullYear()} initialFocus/>
                    </PopoverContent>
                  </Popover>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Specializes in frontend development." />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Add Employee</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      <main>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted"></div>
                        <div className="w-full space-y-2">
                            <div className="h-6 w-3/4 rounded bg-muted"></div>
                            <div className="h-4 w-1/2 rounded bg-muted"></div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                         <div className="h-4 w-full rounded bg-muted"></div>
                         <div className="h-4 w-3/4 rounded bg-muted"></div>
                    </CardContent>
                </Card>
            ))}
          </div>
        ) : sortedEmployees.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedEmployees.map(v => (
              <Link key={v.id} href={`/employees/${v.id}`} className="group">
                <Card className="flex flex-col h-full transition-all duration-200 group-hover:border-primary group-hover:shadow-lg">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={v.photoUrl} alt={v.name} />
                      <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{v.name}</CardTitle>
                      <CardDescription>
                        {v.jobTitle || 'No Title'}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                     <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Started: {v.employmentStartDate && typeof v.employmentStartDate.toDate === 'function' ? format(v.employmentStartDate.toDate(), "PP") : 'N/A'}
                     </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Employees Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Get started by adding your first employee.</p>
              <div className="mt-6">
                   <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Employee
                      </Button>
                    </DialogTrigger>
              </div>
            </div>
          </Dialog>
        )}
      </main>
    </Dialog>
    </div>
  )
}
