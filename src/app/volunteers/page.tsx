"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react"
import useLocalStorage from "@/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

type Employee = {
  id: string
  name: string
  role: string
  contact: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useLocalStorage<Employee[]>("employees", [])
  const [isEditing, setIsEditing] = useState<Employee | null>(null)
  
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [contact, setContact] = useState("")
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !role || !contact) return;

    if (isEditing) {
      setEmployees(employees.map(v => v.id === isEditing.id ? { ...v, name, role, contact } : v))
    } else {
      setEmployees([...employees, { id: Date.now().toString(), name, role, contact }])
    }
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setRole("")
    setContact("")
    setIsEditing(null)
    setOpen(false)
  }

  const handleEdit = (employee: Employee) => {
    setIsEditing(employee)
    setName(employee.name)
    setRole(employee.role)
    setContact(employee.contact)
    setOpen(true)
  }

  const handleDelete = (id: string) => {
    setEmployees(employees.filter(v => v.id !== id))
  }

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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={role} onChange={e => setRole(e.target.value)} required placeholder="e.g. Team Lead" />
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input id="contact" value={contact} onChange={e => setContact(e.target.value)} required placeholder="e.g. john.doe@example.com" />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length > 0 ? employees.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.role}</TableCell>
                  <TableCell>{v.contact}</TableCell>
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    No employees added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  )
}
