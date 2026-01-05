'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Loader2, ChevronsRight, Plus, Settings, LayoutDashboard, FileText, FileDown, FileSpreadsheet, Trash2, Edit } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { shapeText } from '@/lib/pdf-utils';


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

function EditSubmissionDialog({ feedback, onOpenChange, open }: { feedback: MarketingFeedback | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const { evaluationQuestions, marketingFeedbacks, setMarketingFeedbacks } = useAppContext();
    const [isSaving, setIsSaving] = useState(false);
    const [localResponses, setLocalResponses] = useState<Record<string, number>>({});

    useEffect(() => {
        if (feedback) {
            const initialResponses = feedback.responses.reduce((acc, res) => {
                acc[res.questionId] = res.answer;
                return acc;
            }, {} as Record<string, number>);
            setLocalResponses(initialResponses);
        }
    }, [feedback]);

    const handleLocalResponseChange = (questionId: string, value: string) => {
        setLocalResponses(prev => ({ ...prev, [questionId]: parseInt(value) }));
    };

    const handleSave = () => {
        if (!feedback) return;

        setIsSaving(true);
        const newTotalScore = Object.values(localResponses).reduce((sum, val) => sum + val, 0);

        const updatedFeedback: MarketingFeedback = {
            ...feedback,
            totalScore: newTotalScore,
            responses: Object.entries(localResponses).map(([questionId, answer]) => ({ questionId, answer }))
        };
        
        setMarketingFeedbacks(current => current.map(fb => fb.id === updatedFeedback.id ? updatedFeedback : fb));
        toast({ title: "Success!", description: "The feedback submission has been updated." });
        setIsSaving(false);
        onOpenChange(false);
    };

    if (!feedback) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Feedback Submission</DialogTitle>
                    <CardDescription>
                        Editing submission from {format(parseISO(feedback.date), 'PPP')}
                    </CardDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 pt-4">
                    {evaluationQuestions.map((q, index) => (
                        <div key={q.id} className="p-4 border rounded-lg">
                            <p className="font-medium mb-3">{index + 1}. {q.text}</p>
                            <RadioGroup onValueChange={(value) => handleLocalResponseChange(q.id, value)} value={String(localResponses[q.id] || '')}>
                                <div className="flex flex-wrap gap-4">
                                    {q.answers.sort((a,b) => b.value - a.value).map(opt => (
                                        <div key={opt.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={String(opt.value)} id={`edit-${q.id}-${opt.value}`} />
                                            <Label htmlFor={`edit-${q.id}-${opt.value}`}>{opt.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function MarketingFeedbackPage() {
    const { toast } = useToast();
    const { t, language } = useTranslation();
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
    const [editingFeedback, setEditingFeedback] = useState<MarketingFeedback | null>(null);

    
    const pdfCardRef = useRef<HTMLDivElement>(null);

    const marketingEmployees = useMemo(() => {
        return employees.filter(e => e.role === 'Marketing').sort((a,b) => a.name.localeCompare(b.name));
    }, [employees]);
    
    useEffect(() => {
        if(employees && marketingFeedbacks && evaluationQuestions) {
            setIsLoading(false);
        }
    }, [employees, marketingFeedbacks, evaluationQuestions]);
    
    useEffect(() => {
      // If there are employees but none is selected, select the first one.
      if (marketingEmployees.length > 0 && !selectedEmployee) {
        setSelectedEmployee(marketingEmployees[0].id);
      }
    }, [marketingEmployees, selectedEmployee])

    const employeeSubmissions = useMemo(() => {
      if (!selectedEmployee) return [];
      return marketingFeedbacks
        .filter(fb => fb.employeeId === selectedEmployee)
        .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    }, [marketingFeedbacks, selectedEmployee])

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

    const handleDeleteSubmission = (feedbackId: string) => {
        setMarketingFeedbacks(current => current.filter(fb => fb.id !== feedbackId));
        toast({ title: 'Deleted', description: 'The feedback submission has been removed.' });
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
        // Don't reset selected employee
        setResponses({});
        setIsSubmitting(false);
    };

    const maxScore = useMemo(() => {
        return evaluationQuestions.length * 3;
    }, [evaluationQuestions]);

    const evaluationSummary = useMemo(() => {
        if (!marketingFeedbacks || !marketingEmployees) return [];
        
        const summary = marketingEmployees.map(emp => {
            const empEvals = marketingFeedbacks.filter(e => e.employeeId === emp.id);
            const totalScore = empEvals.reduce((sum, currentEval) => sum + currentEval.totalScore, 0);
            return { employeeId: emp.id, name: language === 'ku' && emp.kurdishName ? emp.kurdishName : emp.name, score: totalScore };
        });

        return summary.sort((a, b) => b.score - a.score);
    }, [marketingFeedbacks, marketingEmployees, language]);
    
    const perQuestionRankings = useMemo(() => {
        if (!marketingFeedbacks.length || !marketingEmployees.length || !evaluationQuestions.length) return [];
    
        return evaluationQuestions.map(question => {
            const employeeScores = marketingEmployees.map(employee => {
                const allEvalsForEmployee = marketingFeedbacks.filter(fb => fb.employeeId === employee.id);
                
                const totalScoreForQuestion = allEvalsForEmployee.reduce((sum, currentEval) => {
                    const response = currentEval.responses.find(r => r.questionId === question.id);
                    return sum + (response ? response.answer : 0);
                }, 0);

                return { name: language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name, score: totalScoreForQuestion };
            });

            return {
                questionId: question.id,
                questionText: t(question.id) || question.text,
                scores: employeeScores.sort((a, b) => b.score - a.score),
            };
        });
    }, [marketingFeedbacks, marketingEmployees, evaluationQuestions, t, language]);

    const handleDownloadPdf = async () => {
        if (!marketingFeedbacks.length) {
            toast({ title: "No Data", description: "There is no data to export." });
            return;
        }

        const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
        const useKurdish = language === 'ku';

        if (customFontBase64 && useKurdish) {
            const fontName = "CustomFont";
            const fontStyle = "normal";
            const fontBase64 = customFontBase64.split(',')[1];
            doc.addFileToVFS(`${fontName}.ttf`, fontBase64);
            doc.addFont(`${fontName}.ttf`, fontName, fontStyle);
            doc.setFont(fontName);
        }

        if (pdfCardRef.current) {
            const headerCanvas = await html2canvas(pdfCardRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
            const headerImgData = headerCanvas.toDataURL('image/png');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const headerRatio = headerCanvas.width / headerCanvas.height;
            const finalHeaderWidth = pdfWidth;
            const finalHeaderHeight = finalHeaderWidth / headerRatio;
            doc.addImage(headerImgData, 'PNG', 0, 0, finalHeaderWidth, finalHeaderHeight);
        }

        doc.addPage();
        if (evaluationSummary.length > 0) {
            doc.setFontSize(16);
            doc.text(shapeText(t('employee_performance')), useKurdish ? doc.internal.pageSize.width - 14 : 14, 22, { align: useKurdish ? 'right' : 'left' });
            autoTable(doc, {
                startY: 30,
                head: [[shapeText(t('rank') || 'Rank'), shapeText(t('employee')), shapeText(t('total_score'))]],
                body: evaluationSummary.map((item, index) => [index + 1, shapeText(item.name), item.score]),
                theme: 'striped',
                styles: { font: (customFontBase64 && useKurdish) ? 'CustomFont' : 'helvetica', halign: useKurdish ? 'right' : 'left' },
                headStyles: { fillColor: [40, 40, 40] },
                didDrawCell: (data) => {
                    if (data.section === 'body') {
                        if (data.row.index === 0) { doc.setFillColor(255, 251, 204); }
                        else if (data.row.index === 1) { doc.setFillColor(229, 231, 235); }
                        else if (data.row.index === 2) { doc.setFillColor(255, 237, 213); }
                    }
                },
            });
        }
        
        if (perQuestionRankings && perQuestionRankings.length > 0) {
            perQuestionRankings.forEach((q) => {
                doc.addPage();
                doc.setFontSize(16);
                doc.text(shapeText(q.questionText), useKurdish ? doc.internal.pageSize.width - 14 : 14, 22, { maxWidth: doc.internal.pageSize.getWidth() - 28, align: useKurdish ? 'right' : 'left' });
                autoTable(doc, {
                    startY: 40,
                    head: [[shapeText(t('rank') || 'Rank'), shapeText(t('employee')), shapeText(t('total_score'))]],
                    body: q.scores.map((s, rankIndex) => [rankIndex + 1, shapeText(s.name), s.score]),
                    theme: 'striped',
                    styles: { font: (customFontBase64 && useKurdish) ? 'CustomFont' : 'helvetica', halign: useKurdish ? 'right' : 'left' },
                    headStyles: { fillColor: [40, 40, 40] },
                });
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

        const rankingsData = evaluationSummary.map((item, index) => ({
            Rank: index + 1,
            Employee: item.name,
            'Total Score': item.score,
        }));
        const rankingsWs = XLSX.utils.json_to_sheet(rankingsData);
        XLSX.utils.book_append_sheet(wb, rankingsWs, 'Employee Rankings');

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

        const rawData = marketingFeedbacks.map(fb => {
            const employee = employees.find(e => e.id === fb.employeeId);
            const base: Record<string, any> = {
                Date: format(parseISO(fb.date), 'yyyy-MM-dd'),
                Employee: employee ? (language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name) : 'Unknown',
                'Total Score': fb.totalScore,
            };
            fb.responses.forEach(res => {
                const question = evaluationQuestions.find(q => q.id === res.questionId);
                base[question ? (t(question.id) || question.text) : res.questionId] = res.answer;
            });
            return base;
        });
        const rawDataWs = XLSX.utils.json_to_sheet(rawData);
        XLSX.utils.book_append_sheet(wb, rawDataWs, 'Raw Feedback Data');

        XLSX.writeFile(wb, `Marketing_Feedback_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const getRowClass = (index: number) => {
        switch (index) {
            case 0: return "bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/60";
            case 1: return "bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/60";
            case 2: return "bg-orange-100 dark:bg-orange-900/50 hover:bg-orange-100/80 dark:hover:bg-orange-900/60";
            default: return "";
        }
    };


    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
             <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={pdfCardRef} style={{ width: '700px' }}>
                    <MarketingFeedbackPdfCard
                        logoSrc={logoSrc}
                        totalEvaluations={marketingFeedbacks.length}
                        evaluationSummary={evaluationSummary}
                    />
                </div>
            </div>
            <AddMarketingEmployeeDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} addEmployee={addMarketingEmployee} />
            <ManageQuestionsDialog open={isManageQuestionsOpen} onOpenChange={setManageQuestionsOpen} />
            <EditSubmissionDialog feedback={editingFeedback} open={!!editingFeedback} onOpenChange={(open) => !open && setEditingFeedback(null)} />

            <header className="flex items-center justify-between gap-4 mb-8">
                <div className='flex items-center gap-4'>
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/"><ArrowLeft /></Link>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold">{t('marketing_feedback')}</h1>
                </div>
                <div className='flex items-center gap-2'>
                    <Button variant="outline" onClick={() => setManageQuestionsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" /> {t('manage_questions')}
                    </Button>
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> {t('add_employee')}
                    </Button>
                </div>
            </header>
            
            <Tabs defaultValue="dashboard">
                <TabsList className="mb-6">
                    <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2" />{t('dashboard')}</TabsTrigger>
                    <TabsTrigger value="form"><FileText className="mr-2" />{t('feedback_form')}</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                    <div className="flex justify-end mb-4 gap-2">
                        <Button variant="outline" onClick={handleDownloadPdf}><FileDown className="mr-2 h-4 w-4"/> PDF</Button>
                        <Button variant="outline" onClick={handleDownloadExcel}><FileSpreadsheet className="mr-2 h-4 w-4"/> Excel</Button>
                    </div>
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('employee_performance')}</CardTitle>
                                <CardDescription>{t('employee_performance_desc', {maxScore})}</CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-[300px] overflow-y-auto">
                            {isLoading ? <Loader2 className="animate-spin" /> : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>{t('rank')}</TableHead><TableHead>{t('employee')}</TableHead><TableHead className="text-right">{t('total_score')}</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {evaluationSummary.map((item, index) => (
                                            <TableRow key={item.employeeId} className={cn(getRowClass(index))}>
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
                                <CardTitle>{t('per_question_rankings')}</CardTitle>
                                <CardDescription>{t('per_question_rankings_desc')}</CardDescription>
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
                                                                <TableHead>{t('rank')}</TableHead>
                                                                <TableHead>{t('employee')}</TableHead>
                                                                <TableHead className="text-right">{t('total_score')}</TableHead>
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
                                    <CardTitle>{t('feedback_form')}</CardTitle>
                                    <CardDescription>{t('feedback_form_desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('select_employee_to_evaluate')} />
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
                                                <p className="font-medium mb-3">{index + 1}. {t(q.id) || q.text}</p>
                                                <RadioGroup onValueChange={(value) => handleResponseChange(q.id, value)} value={String(responses[q.id] || '')}>
                                                    <div className="flex flex-wrap gap-4">
                                                        {q.answers.sort((a,b) => b.value - a.value).map(opt => (
                                                            <div key={opt.value} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={String(opt.value)} id={`${q.id}-${opt.value}`} />
                                                                <Label htmlFor={`${q.id}-${opt.value}`}>{t(opt.label.toLowerCase().replace(/ /g, '_')) || opt.label}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <ChevronsRight className="mr-2"/>}
                                        {t('submit_feedback')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('submissions_for')} {marketingEmployees.find(e => e.id === selectedEmployee)?.name || '...'}</CardTitle>
                                    <CardDescription>{t('submissions_for_desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="max-h-[70vh] overflow-y-auto">
                                    {isLoading ? <Loader2 className="animate-spin" /> : employeeSubmissions.length > 0 ? (
                                        <div className="space-y-3">
                                            {employeeSubmissions.map(fb => (
                                                <div key={fb.id} className="border p-3 rounded-lg flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold text-sm">{format(parseISO(fb.date), 'PPP')}</p>
                                                        <p className="text-xs text-muted-foreground">{t('score_colon')} {fb.totalScore} / {maxScore}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingFeedback(fb)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {t('confirm_delete_submission_date', {date: format(parseISO(fb.date), 'PPP')})}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteSubmission(fb.id)}>{t('delete')}</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ): (
                                        <p className="text-center text-sm text-muted-foreground py-8">{t('no_submissions_found')}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
