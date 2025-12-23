"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Edit, User, Calendar as CalendarIcon, Briefcase, FileText } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { collection, doc } from "firebase/firestore"
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Employee = {
  id: string
  name: string
  employmentStartDate: Date | number
  photoUrl?: string
  notes?: string
}

export default function EmployeesPage() {
  const firestore = useFirestore();
  const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, "employees") : null, [firestore]);
  const { data: employees, isLoading } = useCollection<Employee>(employeesRef);
  
  const [isEditing, setIsEditing] = useState<Employee | null>(null)
  
  const [name, setName] = useState("")
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("")
  
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !employmentStartDate || !firestore) return;

    // In a real app, you would upload the photoFile to Firebase Storage and get a URL.
    // For this prototype, we'll simulate it or use a placeholder.
    // If a new photo is selected, we'll use a local object URL for preview, but this won't be saved to Firestore.
    // The actual photoUrl would come from a real upload service.
    const employeeData = {
      name,
      employmentStartDate: employmentStartDate.getTime(),
      notes,
      photoUrl: isEditing?.photoUrl || 'https://picsum.photos/seed/employee/100/100' // Placeholder
    };
    
    if (isEditing) {
      const docRef = doc(firestore, "employees", isEditing.id);
      updateDocumentNonBlocking(docRef, employeeData);
    } else {
      addDocumentNonBlocking(employeesRef!, employeeData);
    }
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setEmploymentStartDate(undefined)
    setPhotoUrl("")
    setPhotoFile(null)
    setNotes("")
    setIsEditing(null)
    setOpen(false)
  }

  const handleEdit = (employee: Employee) => {
    setIsEditing(employee)
    setName(employee.name)
    setEmploymentStartDate(new Date(employee.employmentStartDate))
    setPhotoUrl(employee.photoUrl || "")
    setNotes(employee.notes || "")
    setOpen(true)
  }

  const handleDelete = (id: string) => {
    if(!firestore) return;
    const docRef = doc(firestore, "employees", id);
    deleteDocumentNonBlocking(docRef);
  }
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file);
      // Create a temporary URL for preview
      setPhotoUrl(URL.createObjectURL(file));
    }
  }

  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
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
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if(!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Employee" : "Add New Employee"}</DialogTitle>
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
                <Label htmlFor="date">Employment Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !employmentStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {employmentStartDate ? format(employmentStartDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={employmentStartDate}
                      onSelect={setEmploymentStartDate}
                      captionLayout="dropdown-nav"
                      fromYear={1990}
                      toYear={2040}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Specializes in frontend development." />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">{isEditing ? "Save Changes" : "Add Employee"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>
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
                    <CardFooter className="flex justify-end gap-2">
                         <div className="h-8 w-16 rounded bg-muted"></div>
                         <div className="h-8 w-16 rounded bg-muted"></div>
                    </CardFooter>
                </Card>
            ))}
          </div>
        ) : sortedEmployees.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedEmployees.map(v => (
              <Card key={v.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={v.photoUrl} alt={v.name} />
                    <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{v.name}</CardTitle>
                    <CardDescription>
                      Started: {format(new Date(v.employmentStartDate), "PP")}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {v.notes || "No notes for this employee."}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-muted/50 p-3 mt-auto">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(v)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(v.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
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
        )}
      </main>
    </div>
  )
}
