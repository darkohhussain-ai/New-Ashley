"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Edit, User, Calendar as CalendarIcon, Upload, FileText } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { collection, doc } from "firebase/firestore"
import Image from 'next/image'

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
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Employees Dashboard</h1>
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
                <Image 
                  src={photoUrl || "https://picsum.photos/seed/placeholder/100/100"} 
                  alt="Employee photo"
                  width={100}
                  height={100}
                  className="rounded-full aspect-square object-cover"
                />
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
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={employmentStartDate}
                      onSelect={setEmploymentStartDate}
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
        <Card className="shadow-lg">
          <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : sortedEmployees.length > 0 ? sortedEmployees.map(v => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Image 
                      src={v.photoUrl || 'https://picsum.photos/seed/employee/40/40'}
                      alt={v.name}
                      width={40}
                      height={40}
                      className="rounded-full aspect-square object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{format(new Date(v.employmentStartDate), "PP")}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{v.notes}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(v)}>
                      <Edit className="h-4 w-4" />
                       <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No employees added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
