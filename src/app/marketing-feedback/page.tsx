
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Loader2, ChevronsRight, Plus, Settings, LayoutDashboard, FileText, FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import type { Employee, MarketingFeedback, EvaluationQuestion, AnswerOption } from '@/lib/types';
import { format, formatISO, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MarketingFeedbackPdfCard } from '@/components/marketing/marketing-feedback-pdf-card';
import useLocalStorage from '@/hooks/use-local-storage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import html2canvas from 'html2canvas';


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
          role: 'Marketing',
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
    const defaultLogo = "https://picsum.photos/seed/1/300/100";
    const [logoSrc] = useLocalStorage('app-logo', defaultLogo);
    const [customFontBase64] = useLocalStorage<string | null>('custom-font-base64', null);


    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isManageQuestionsOpen, setManageQuestionsOpen] = useState(false);
    
    const pdfCardRef = useRef<HTMLDivElement>(null);

    const marketingEmployees = useMemo(() => {
        return employees.filter(e => e.role === 'Marketing');
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
            const totalScore = empEvals.reduce((sum, currentEval) => sum + currentEval.totalScore, 0);
            return { employeeId: emp.id, name: emp.name, score: totalScore };
        });

        return summary.sort((a, b) => b.score - a.score);
    }, [marketingFeedbacks, marketingEmployees]);
    
    const perQuestionRankings = useMemo(() => {
        if (!marketingFeedbacks.length || !marketingEmployees.length || !evaluationQuestions.length) return [];
    
        return evaluationQuestions.map(question => {
            const employeeScores = marketingEmployees.map(employee => {
                const latestEval = marketingFeedbacks
                    .filter(fb => fb.employeeId === employee.id)
                    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
    
                if (!latestEval) {
                    return { name: employee.name, score: 0 };
                }
    
                const response = latestEval.responses.find(r => r.questionId === question.id);
                const score = response ? response.answer : 0;
                
                return { name: employee.name, score: score };
            });

            return {
                questionId: question.id,
                questionText: question.text,
                scores: employeeScores.sort((a, b) => b.score - a.score),
            };
        });
    }, [marketingFeedbacks, marketingEmployees, evaluationQuestions]);

    const handleDownloadPdf = async () => {
        if (!marketingFeedbacks.length) {
            toast({ title: "No Data", description: "There is no data to export." });
            return;
        }

        const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
        if (customFontBase64) {
            const fontName = "CustomFont";
            const fontStyle = "normal";
            const fontBase64 = customFontBase64.split(',')[1];
            doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
            doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
            doc.setFont(fontName);
        }

        // 1. Add Header Page
        if (pdfCardRef.current) {
            const headerCanvas = await html2canvas(pdfCardRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
            const headerImgData = headerCanvas.toDataURL('image/png');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const headerRatio = headerCanvas.width / headerCanvas.height;
            const finalHeaderWidth = pdfWidth - 28;
            const finalHeaderHeight = finalHeaderWidth / headerRatio;
            doc.addImage(headerImgData, 'PNG', 14, 14, finalHeaderWidth, finalHeaderHeight);
        }
        
        let startY = 160;

        // 2. Add Overall Employee Rankings table
        if (evaluationSummary.length > 0) {
            doc.setFontSize(14);
            doc.text("Overall Employee Rankings", 14, startY);
            startY += 15;

            autoTable(doc, {
                startY: startY,
                head: [['Rank', 'Employee', 'Total Score']],
                body: evaluationSummary.map((item, index) => [index + 1, item.name, item.score]),
                theme: 'striped',
                headStyles: { fillColor: [40, 40, 40] },
                didParseCell: function (data) {
                    if (customFontBase64) {
                        data.cell.styles.font = "CustomFont";
                    }
                }
            });
            startY = (doc as any).lastAutoTable.finalY + 20;
        }

        // 3. Add Per-Question Rankings
        if (perQuestionRankings && perQuestionRankings.length > 0) {
            perQuestionRankings.forEach(q => {
                 if (startY + (q.scores.length * 20) > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    startY = 20;
                }
                doc.setFontSize(14);
                doc.text(q.questionText, 14, startY);
                startY += 15;

                autoTable(doc, {
                    startY: startY,
                    head: [['Rank', 'Employee', 'Score']],
                    body: q.scores.map((s, index) => [index + 1, s.name, s.score]),
                    theme: 'striped',
                    headStyles: { fillColor: [40, 40, 40] },
                    didParseCell: function (data) {
                        if (customFontBase64) {
                            data.cell.styles.font = "CustomFont";
                        }
                    }
                });
                startY = (doc as any).lastAutoTable.finalY + 20;
            });
        }
        
        doc.save(`Marketing_Feedback_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };


    const handleDownloadExcel = () => {
        if (!marketingFeedbacks.length) {
             toast({ title: "No Data", description: "There is no data to export."});
            return;
        }
        const wb = XLSX.utils.book_new();

        // Sheet 1: Employee Rankings
        const rankingsData = evaluationSummary.map((item, index) => ({
            Rank: index + 1,
            Employee: item.name,
            'Total Score': item.score,
        }));
        const rankingsWs = XLSX.utils.json_to_sheet(rankingsData);
        XLSX.utils.book_append_sheet(wb, rankingsWs, 'Employee Rankings');

        // Sheet 2: Per Question Rankings
        if (perQuestionRankings && perQuestionRankings.length > 0) {
            const questionRankingsData = perQuestionRankings.flatMap(q => 
                q.scores.map(s => ({
                    Question: q.questionText,
                    Employee: s.name,
                    Score: s.score
                }))
            );
            const questionsWs = XLSX.utils.json_to_sheet(questionRankingsData);
            XLSX.utils.book_append_sheet(wb, questionsWs, 'Per Question Rankings');
        }

        // Sheet 3: Raw Data
        const rawData = marketingFeedbacks.map(fb => {
            const employee = employees.find(e => e.id === fb.employeeId);
            const base = {
                Date: format(parseISO(fb.date), 'yyyy-MM-dd'),
                Employee: employee?.name || 'Unknown',
                'Total Score': fb.totalScore,
            };
            fb.responses.forEach(res => {
                const question = evaluationQuestions.find(q => q.id === res.questionId);
                (base as any)[question?.text || res.questionId] = res.answer;
            });
            return base;
        });
        const rawDataWs = XLSX.utils.json_to_sheet(rawData);
        XLSX.utils.book_append_sheet(wb, rawDataWs, 'Raw Feedback Data');

        XLSX.writeFile(wb, `Marketing_Feedback_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };


    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
             <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={pdfCardRef}>
                    <MarketingFeedbackPdfCard
                        logoSrc={logoSrc}
                        totalEvaluations={marketingFeedbacks.length}
                    />
                </div>
            </div>
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
            
            <Tabs defaultValue="dashboard">
                <TabsList className="mb-6">
                    <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2" />Dashboard</TabsTrigger>
                    <TabsTrigger value="form"><FileText className="mr-2" />Feedback Form</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                    <div className="flex justify-end mb-4 gap-2">
                        <Button variant="outline" onClick={handleDownloadPdf}><FileDown className="mr-2 h-4 w-4"/> PDF</Button>
                        <Button variant="outline" onClick={handleDownloadExcel}><FileSpreadsheet className="mr-2 h-4 w-4"/> Excel</Button>
                    </div>
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle>Total Evaluations</CardTitle>
                                    <CardDescription>Total number of feedback forms submitted.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-5xl font-bold">{marketingFeedbacks.length}</p>
                                </CardContent>
                            </Card>
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Overall Employee Rankings</CardTitle>
                                    <CardDescription>Based on the summation of all feedback scores.</CardDescription>
                                </CardHeader>
                                <CardContent className="max-h-[250px] overflow-y-auto">
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Employee</TableHead><TableHead className="text-right">Total Score</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {evaluationSummary.map((item, index) => (
                                                <TableRow key={item.employeeId}><TableCell className="font-bold">{index + 1}</TableCell><TableCell>{item.name}</TableCell><TableCell className="text-right font-medium">{item.score}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                </CardContent>
                            </Card>
                        </div>

                         <Card>
                            <CardHeader>
                                <CardTitle>Per-Question Employee Rankings</CardTitle>
                                <CardDescription>See how employees rank on each specific question based on their latest evaluation.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {perQuestionRankings && perQuestionRankings.map((q, index) => (
                                        <AccordionItem value={`item-${index}`} key={q.questionId}>
                                            <AccordionTrigger>{q.questionText}</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Rank</TableHead>
                                                                <TableHead>Employee</TableHead>
                                                                <TableHead className="text-right">Score</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {q.scores.map((s, rankIndex) => (
                                                                <TableRow key={s.name}>
                                                                    <TableCell className="font-medium">{rankIndex + 1}</TableCell>
                                                                    <TableCell>{s.name}</TableCell>
                                                                    <TableCell className="text-right">{s.score}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="form">
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
                                    <CardTitle>Overall Employee Rankings</CardTitle>
                                    <CardDescription>Based on the summation of all feedback scores.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Rank</TableHead>
                                                <TableHead>Employee</TableHead>
                                                <TableHead className="text-right">Total Score</TableHead>
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
                                            {marketingEmployees?.find(e => e.id === selectedEmployee)?.name}'s Latest Scores
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground text-center">No feedback data to display.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    
