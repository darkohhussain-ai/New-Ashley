
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Loader2, ChevronsRight, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import type { Employee, MarketingFeedback, EvaluationQuestion, AnswerOption } from '@/lib/types';
import { formatISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';


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

function ManageQuestionsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { evaluationQuestions, setEvaluationQuestions } = useAppContext();
    const { toast } = useToast();
    const [localQuestions, setLocalQuestions] = useState<EvaluationQuestion[]>([]);

    useEffect(() => {
        if (open) {
            setLocalQuestions(JSON.parse(JSON.stringify(evaluationQuestions)));
        }
    }, [open, evaluationQuestions]);

    const handleQuestionTextChange = (id: string, text: string) => {
        setLocalQuestions(current => current.map(q => q.id === id ? { ...q, text } : q));
    };

    const handleAnswerChange = (questionId: string, answerValue: number, newLabel: string) => {
        setLocalQuestions(current =>
            current.map(q => {
                if (q.id === questionId) {
                    return {
                        ...q,
                        answers: q.answers.map(ans =>
                            ans.value === answerValue ? { ...ans, label: newLabel } : ans
                        ) as [AnswerOption, AnswerOption, AnswerOption]
                    };
                }
                return q;
            })
        );
    };

    const handleSaveChanges = () => {
        setEvaluationQuestions(localQuestions);
        toast({ title: "Saved!", description: "Questions and answers have been updated." });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Manage Questions & Answers</DialogTitle>
                    <CardDescription>Edit the question text and the custom answers for each.</CardDescription>
                </DialogHeader>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
                    {localQuestions.map((q, index) => (
                        <div key={q.id} className="p-4 border rounded-lg space-y-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">Question {index + 1}</Label>
                                <Textarea value={q.text} onChange={(e) => handleQuestionTextChange(q.id, e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {q.answers.sort((a, b) => b.value - a.value).map(opt => (
                                    <div key={opt.value} className="space-y-2">
                                        <Label>Answer for Score {opt.value}</Label>
                                        <Input value={opt.label} onChange={(e) => handleAnswerChange(q.id, opt.value, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function MarketingFeedbackPage() {
    const { toast } = useToast();
    const { 
        employees, setEmployees, 
        marketingFeedbacks, setMarketingFeedbacks,
        evaluationQuestions
    } = useAppContext();

    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isManageQuestionsOpen, setManageQuestionsOpen] = useState(false);

    const marketingEmployees = useMemo(() => {
        return employees.filter(e => e.jobTitle === 'Marketing');
    }, [employees]);
    
    useEffect(() => {
        if(employees && marketingFeedbacks && evaluationQuestions) {
            setIsLoading(false);
        }
    }, [employees, marketingFeedbacks, evaluationQuestions]);

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
        if (Object.keys(responses).length !== evaluationQuestions.length) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please answer all questions.' });
            return;
        }

        setIsSubmitting(true);
        const totalScore = Object.values(responses).reduce((sum, value) => sum + value, 0);
        
        const feedbackData: MarketingFeedback = {
            id: crypto.randomUUID(),
            employeeId: selectedEmployee,
            date: formatISO(new Date()),
            responses: Object.entries(responses).map(([questionId, answer]) => ({ questionId, answer })),
            totalScore,
        };

        setMarketingFeedbacks([...marketingFeedbacks, feedbackData]);
        toast({ title: 'Success', description: 'Feedback submitted successfully.' });
        setSelectedEmployee('');
        setResponses({});
        setIsSubmitting(false);
    };

    const evaluationSummary = useMemo(() => {
        if (!marketingFeedbacks || !marketingEmployees) return [];
        
        const summary = marketingEmployees.map(emp => {
            const empEvals = marketingFeedbacks.filter(e => e.employeeId === emp.id);
            if (empEvals.length === 0) {
                return { employeeId: emp.id, name: emp.name, score: 0 };
            }
            const latestEval = empEvals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            return { employeeId: emp.id, name: emp.name, score: latestEval.totalScore };
        });

        return summary.sort((a, b) => b.score - a.score);
    }, [marketingFeedbacks, marketingEmployees]);
    
    const individualChartData = useMemo(() => {
        if (!selectedEmployee || !marketingFeedbacks || !evaluationQuestions) return [];
        
        const latestEval = marketingFeedbacks
            .filter(e => e.employeeId === selectedEmployee)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (!latestEval) return [];

        return latestEval.responses.map(res => {
            const questionText = evaluationQuestions.find(q => q.id === res.questionId)?.text || 'Unknown';
            return { name: questionText, score: res.answer };
        });
    }, [selectedEmployee, marketingFeedbacks, evaluationQuestions]);

    const answerRanking = useMemo(() => {
        if (!marketingFeedbacks || marketingFeedbacks.length === 0 || !evaluationQuestions) return [];
        const questionScores: Record<string, { total: number; count: number; avg: number }> = {};
        evaluationQuestions.forEach(q => (questionScores[q.id] = { total: 0, count: 0, avg: 0 }));

        marketingFeedbacks.forEach(ev => {
            ev.responses.forEach(res => {
                if (questionScores[res.questionId]) {
                    questionScores[res.questionId].total += res.answer;
                    questionScores[res.questionId].count += 1;
                }
            });
        });
        
        return Object.entries(questionScores).map(([id, data]) => ({
            id,
            text: evaluationQuestions.find(q => q.id === id)?.text || 'Unknown',
            avgScore: data.count > 0 ? data.total / data.count : 0,
        })).sort((a,b) => b.avgScore - a.avgScore);
    }, [marketingFeedbacks, evaluationQuestions]);

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <AddMarketingEmployeeDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} addEmployee={addMarketingEmployee} />
            <ManageQuestionsDialog open={isManageQuestionsOpen} onOpenChange={setManageQuestionsOpen} />
            <header className="flex items-center justify-between gap-4 mb-8">
                <div className='flex items-center gap-4'>
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/"><ArrowLeft /></Link>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold">Marketing Feedback</h1>
                </div>
                <div className='flex items-center gap-2'>
                    <Button variant="outline" onClick={() => setManageQuestionsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" /> Manage Questions
                    </Button>
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Employee
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feedback Form</CardTitle>
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
                                {evaluationQuestions.map((q, index) => (
                                    <div key={q.id} className="p-4 border rounded-lg">
                                        <p className="font-medium mb-3">{index + 1}. {q.text}</p>
                                        <RadioGroup onValueChange={(value) => handleResponseChange(q.id, value)} value={String(responses[q.id] || '')}>
                                            <div className="flex flex-wrap gap-4">
                                                {q.answers.sort((a,b) => b.value - a.value).map(opt => (
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
                                Submit Feedback
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Employee Rankings</CardTitle>
                             <CardDescription>Based on latest feedback scores.</CardDescription>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Question Rankings</CardTitle>
                            <CardDescription>Highest and lowest scoring questions across all employees.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isLoading ? <Loader2 className="animate-spin" /> : (
                               <Table>
                                   <TableHeader>
                                       <TableRow>
                                           <TableHead>Question</TableHead>
                                           <TableHead className="text-right">Avg. Score</TableHead>
                                       </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                        {answerRanking.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-sm">{item.text}</TableCell>
                                                <TableCell className="text-right font-medium">{item.avgScore.toFixed(2)}</TableCell>
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
                                    <p className="text-muted-foreground text-center">No feedback data to display.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

    

    