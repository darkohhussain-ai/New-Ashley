
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Loader2, ChevronsRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import type { Employee, EvaluationResponse } from '@/lib/types';
import { formatISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const questions = [
    { id: 'q1', text: 'Commitment to work' },
    { id: 'q2', text: 'Adherence to working hours' },
    { id: 'q3', text: 'Acceptance of responsibility' },
    { id: 'q4', text: 'Initiative and offering suggestions' },
    { id: 'q5', text: 'Relationship with colleagues' },
    { id: 'q6', text: 'Appearance and personal hygiene' },
    { id: 'q7', text: 'Speed of completion' },
    { id: 'q8', text: 'Work accuracy' },
    { id: 'q9', text: 'Learning speed' },
    { id: 'q10', text: 'Problem-solving ability' },
    { id: 'q11', text: 'Commitment to management directives' },
    { id: 'q12', text: 'Ability to work under pressure' },
    { id: 'q13', text: 'Trustworthiness' },
    { id: 'q14', text: 'Customer service' },
    { id: 'q15', text: 'Teamwork spirit' },
    { id: 'q16', text: 'Continuous development' },
];
const answerOptions = [
    { label: 'Excellent', value: 3 },
    { label: 'Good', value: 2 },
    { label: 'Needs Improvement', value: 1 },
];

function AddMarketingEmployeeDialog({ open, onOpenChange, addEmployee }: { open: boolean, onOpenChange: (open: boolean) => void, addEmployee: (employee: Omit<Employee, 'id'>) => void }) {
    const { toast } = useToast();
    const [name, setName] = useState("");

    const resetForm = () => {
        setName("");
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
          name: name.trim(),
          jobTitle: 'Marketing',
        };
        
        addEmployee(employeeData);
        toast({ title: "Employee Added", description: `${name} has been added as a Marketing employee.` });
        resetForm();
    };
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Add Marketing Employee</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Employee Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Jane Smith" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit">Add Employee</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function MarketingEvaluationPage() {
    const { toast } = useToast();
    const { employees, setEmployees, evaluations, setEvaluations } = useAppContext();

    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);

    const marketingEmployees = useMemo(() => {
        return employees.filter(e => e.jobTitle === 'Marketing');
    }, [employees]);
    
    useState(() => {
        if(employees && evaluations) {
            setIsLoading(false);
        }
    }, [employees, evaluations]);

    const addMarketingEmployee = (employeeData: Omit<Employee, 'id'>) => {
        const newEmployee: Employee = {
          id: crypto.randomUUID(),
          ...employeeData
        };
        setEmployees([...employees, newEmployee]);
    };

    const handleResponseChange = (questionId: string, value: string) => {
        setResponses(prev => ({ ...prev, [questionId]: parseInt(value) }));
    };
    
    const handleSubmit = async () => {
        if (!selectedEmployee) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an employee.' });
            return;
        }
        if (Object.keys(responses).length !== questions.length) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please answer all questions.' });
            return;
        }

        setIsSubmitting(true);
        const totalScore = Object.values(responses).reduce((sum, value) => sum + value, 0);
        
        const evaluationData: EvaluationResponse = {
            id: crypto.randomUUID(),
            employeeId: selectedEmployee,
            date: formatISO(new Date()),
            responses: Object.entries(responses).map(([questionId, answer]) => ({ questionId, answer })),
            totalScore,
        };

        setEvaluations([...evaluations, evaluationData]);
        toast({ title: 'Success', description: 'Evaluation submitted successfully.' });
        setSelectedEmployee('');
        setResponses({});
        setIsSubmitting(false);
    };

    const evaluationSummary = useMemo(() => {
        if (!evaluations || !marketingEmployees) return [];
        
        const summary = marketingEmployees.map(emp => {
            const empEvaluations = evaluations.filter(e => e.employeeId === emp.id);
            if (empEvaluations.length === 0) {
                return { employeeId: emp.id, name: emp.name, score: 0 };
            }
            // Use the most recent evaluation for simplicity
            const latestEval = empEvaluations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            return { employeeId: emp.id, name: emp.name, score: latestEval.totalScore };
        });

        return summary.sort((a, b) => b.score - a.score);
    }, [evaluations, marketingEmployees]);
    
    const individualChartData = useMemo(() => {
        if (!selectedEmployee || !evaluations) return [];
        
        const latestEval = evaluations
            .filter(e => e.employeeId === selectedEmployee)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (!latestEval) return [];

        return latestEval.responses.map(res => {
            const questionText = questions.find(q => q.id === res.questionId)?.text || 'Unknown';
            return { name: questionText, score: res.answer };
        });
    }, [selectedEmployee, evaluations]);

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <AddMarketingEmployeeDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} addEmployee={addMarketingEmployee} />
            <header className="flex items-center justify-between gap-4 mb-8">
                <div className='flex items-center gap-4'>
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/"><ArrowLeft /></Link>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold">Marketing Employee Evaluation</h1>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Marketing Employee
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Evaluation Form</CardTitle>
                            <CardDescription>Select an employee and answer the questions below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select an employee to evaluate..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {isLoading ? (
                                        <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                                    ) : (
                                        marketingEmployees?.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                                {questions.map((q, index) => (
                                    <div key={q.id} className="p-4 border rounded-lg">
                                        <p className="font-medium mb-3">{index + 1}. {q.text}</p>
                                        <RadioGroup onValueChange={(value) => handleResponseChange(q.id, value)} value={String(responses[q.id] || '')}>
                                            <div className="flex flex-wrap gap-4">
                                                {answerOptions.map(opt => (
                                                    <div key={opt.value} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={String(opt.value)} id={`${q.id}-${opt.value}`} />
                                                        <Label htmlFor={`${q.id}-${opt.value}`}>{opt.label}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                    </div>
                                ))}
                            </div>
                             <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <ChevronsRight className="mr-2"/>}
                                Submit Evaluation
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rankings</CardTitle>
                             <CardDescription>Overall scores and ranking.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isLoading ? <Loader2 className="animate-spin" /> : (
                               <Table>
                                   <TableHeader>
                                       <TableRow>
                                           <TableHead>Rank</TableHead>
                                           <TableHead>Employee</TableHead>
                                           <TableHead className="text-right">Score</TableHead>
                                       </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                        {evaluationSummary.map((item, index) => (
                                            <TableRow key={item.employeeId}>
                                                <TableCell className="font-bold">{index + 1}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right font-medium">{item.score}</TableCell>
                                            </TableRow>
                                        ))}
                                   </TableBody>
                               </Table>
                           )}
                        </CardContent>
                    </Card>

                    {selectedEmployee && (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {marketingEmployees?.find(e => e.id === selectedEmployee)?.name}'s Chart
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {individualChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={individualChartData} layout="vertical" margin={{ left: 80 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 3]} ticks={[1, 2, 3]} />
                                            <YAxis type="category" dataKey="name" width={100} fontSize={12} />
                                            <Tooltip />
                                            <Bar dataKey="score" fill="hsl(var(--primary))" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-muted-foreground text-center">No evaluation data to display.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                     <Card>
                        <CardHeader>
                            <CardTitle>Overall Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={evaluationSummary}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="score" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
