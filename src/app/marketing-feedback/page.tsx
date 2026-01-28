'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Loader2, ChevronsRight, Plus, Settings, LayoutDashboard, FileText, Trash2, Edit, Save, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/app-provider';
import type { Employee, MarketingFeedback, EvaluationQuestion, AnswerOption } from '@/lib/types';
import { format, formatISO, parseISO, isToday } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingReportPdf } from '@/components/marketing/MarketingReportPdf';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Progress } from '@/components/ui/progress';
import withAuth from '@/hooks/withAuth';
import { ReportWrapper } from '@/components/reports/ReportWrapper';


function AddMarketingEmployeeDialog({ open, onOpenChange, addEmployee }: { open: boolean, onOpenChange: (open: boolean) => void, addEmployee: (employee: Omit<Employee, 'id'>) => void }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [kurdishName, setKurdishName] = useState("");

    const resetForm = () => {
        setName("");
        setKurdishName("");
        onOpenChange(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast({
                variant: 'destructive',
                title: t('name_is_required'),
                description: t('please_enter_name'),
            });
            return;
        }

        const employeeData: Omit<Employee, 'id'> = { 
          name: name.trim(),
          kurdishName: kurdishName.trim() || undefined,
          role: 'Marketing',
          createdAt: formatISO(new Date()),
        };
        
        addEmployee(employeeData);
        toast({ title: t('employee_added'), description: t('employee_added_desc', { employeeName: name }) });
        resetForm();
    };
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('add_employee')}</DialogTitle>
                  <DialogDescription>Add a new employee to the marketing team.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('employee_name')}</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Jane Smith" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="kurdish-name">ناو بە کوردی (ئارەزوومەندانە)</Label>
                        <Input id="kurdish-name" value={kurdishName} onChange={e => setKurdishName(e.target.value)} dir="rtl" placeholder="بۆ نموونە، ژیندا سۆران" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">{t('cancel')}</Button></DialogClose>
                        <Button type="submit">{t('add_employee')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ManageQuestionsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { evaluationQuestions, setEvaluationQuestions } = useAppContext();
    const { t } = useTranslation();
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
        toast({ title: t('saved'), description: t('questions_updated') });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t('manage_questions_answers')}</DialogTitle>
                    <DialogDescription>{t('manage_questions_answers_desc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
                    {localQuestions.map((q, index) => (
                        <div key={q.id} className="p-4 border rounded-lg space-y-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">{t('question')} {index + 1}</Label>
                                <Textarea value={q.text} onChange={(e) => handleQuestionTextChange(q.id, e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {q.answers.sort((a, b) => b.value - a.value).map(opt => (
                                    <div key={opt.value} className="space-y-2">
                                        <Label>{t('answer_for_score', { score: opt.value })}</Label>
                                        <Input value={opt.label} onChange={(e) => handleAnswerChange(q.id, opt.value, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">{t('cancel')}</Button></DialogClose>
                    <Button onClick={handleSaveChanges}>{t('save_changes')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EditSubmissionDialog({ feedback, onOpenChange, open }: { feedback: MarketingFeedback | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const { t } = useTranslation();
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
        toast({ title: t('success'), description: t('feedback_submission_updated') });
        setIsSaving(false);
        onOpenChange(false);
    };

    if (!feedback) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('edit_feedback_submission')}</DialogTitle>
                    <DialogDescription>
                        {t('editing_submission_from', { date: format(parseISO(feedback.date), 'PPP') })}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 pt-4">
                    {evaluationQuestions.map((q, index) => (
                        <div key={q.id} className="p-4 border rounded-lg">
                            <p className="font-medium mb-3">{q.text}</p>
                            <RadioGroup onValueChange={(value) => handleLocalResponseChange(q.id, value)} value={String(localResponses[q.id] || '')}>
                                <div className="flex flex-wrap gap-4">
                                    {q.answers.sort((a,b) => b.value - a.value).map(opt => (
                                        <Label key={opt.value} htmlFor={`edit-${q.id}-${opt.value}`} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                                            <RadioGroupItem value={String(opt.value)} id={`edit-${q.id}-${opt.value}`} />
                                            <span>{t(opt.label.toLowerCase().replace(/ /g, '_')) || opt.label}</span>
                                        </Label>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">{t('cancel')}</Button></DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save_changes')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function MarketingFeedbackPage() {
    const { toast } = useToast();
    const { t, language } = useTranslation();
    const { 
        employees, setEmployees, 
        marketingFeedbacks, setMarketingFeedbacks,
        evaluationQuestions,
        settings
    } = useAppContext();
    const { appLogo: logoSrc, customFont: customFontBase64 } = settings;

    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isManageQuestionsOpen, setManageQuestionsOpen] = useState(false);
    const [editingFeedback, setEditingFeedback] = useState<MarketingFeedback | null>(null);

    const [responses, setResponses] = useState<Record<string, number>>({});
    const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
    
    const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<string | null>(null);

    const marketingEmployees = useMemo(() => {
        return employees.filter(e => e.role === 'Marketing').sort((a, b) => {
            const dateA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
            return dateA - dateB;
        });
    }, [employees]);
    
    useEffect(() => {
        if(marketingEmployees.length > 0 && !currentEmployeeId) {
            setCurrentEmployeeId(marketingEmployees[0].id);
        }
         if(marketingEmployees.length > 0 && !selectedEmployeeForHistory) {
            setSelectedEmployeeForHistory(marketingEmployees[0].id);
        }
    }, [marketingEmployees, currentEmployeeId, selectedEmployeeForHistory]);

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
    
    const handleSaveSubmission = () => {
        if (!currentEmployeeId) {
            toast({ variant: 'destructive', title: "No Employee Selected", description: "Please select an employee before saving." });
            return;
        }

        if (Object.keys(responses).length === 0) {
            toast({ variant: 'destructive', title: "No Answers", description: "Please answer at least one question before saving." });
            return;
        }

        const today = new Date();
        const existingFeedbackIndex = marketingFeedbacks.findIndex(fb => fb.employeeId === currentEmployeeId && isToday(parseISO(fb.date)));
        
        if (existingFeedbackIndex > -1) {
            // Update existing feedback for today by merging new answers
            setMarketingFeedbacks(prevFeedbacks => 
                prevFeedbacks.map((fb, index) => {
                    if (index === existingFeedbackIndex) {
                        const newResponsesMap = new Map(fb.responses.map(r => [r.questionId, r.answer]));
                        Object.entries(responses).forEach(([qId, ans]) => newResponsesMap.set(qId, ans));
                        
                        const updatedResponses = Array.from(newResponsesMap.entries()).map(([questionId, answer]) => ({ questionId, answer }));
                        const newTotalScore = updatedResponses.reduce((sum, r) => sum + r.answer, 0);

                        return {
                            ...fb,
                            responses: updatedResponses,
                            totalScore: newTotalScore,
                        };
                    }
                    return fb;
                })
            );
        } else {
            // Create a new feedback record for today
            const totalScore = Object.values(responses).reduce((sum, val) => sum + val, 0);
            const feedbackData: MarketingFeedback = {
                id: crypto.randomUUID(),
                employeeId: currentEmployeeId,
                date: formatISO(today, { representation: 'date' }),
                responses: Object.entries(responses).map(([questionId, answer]) => ({ questionId, answer })),
                totalScore,
            };
            setMarketingFeedbacks(prev => [...prev, feedbackData]);
        }
        
        toast({ title: "Feedback Saved", description: "The answers have been successfully saved." });
        setResponses({}); // Clear the form for the next entry
    };


    const handleDeleteSubmission = (feedbackId: string) => {
        setMarketingFeedbacks(current => current.filter(fb => fb.id !== feedbackId));
        toast({ title: t('deleted'), description: t('feedback_submission_removed') });
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
                questionText: question.text,
                scores: employeeScores.sort((a, b) => b.score - a.score),
            };
        });
    }, [marketingFeedbacks, marketingEmployees, evaluationQuestions, language]);
    
    const employeeHistory = useMemo(() => {
      if (!selectedEmployeeForHistory) return [];
      return marketingFeedbacks
          .filter(fb => fb.employeeId === selectedEmployeeForHistory)
          .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [marketingFeedbacks, selectedEmployeeForHistory]);

    const getRowClass = (index: number) => {
        switch (index) {
            case 0: return "bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/60";
            case 1: return "bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/60";
            case 2: return "bg-orange-100 dark:bg-orange-900/50 hover:bg-orange-100/80 dark:hover:bg-orange-900/60";
            default: return "";
        }
    };
    
    const currentEmployee = marketingEmployees.find(emp => emp.id === currentEmployeeId);


    return (
        <>
            <div className="hidden print:block">
                <ReportWrapper>
                    <MarketingReportPdf
                        logoSrc={logoSrc}
                        totalEvaluations={marketingFeedbacks.length}
                        evaluationSummary={evaluationSummary}
                        perQuestionRankings={perQuestionRankings || []}
                    />
                </ReportWrapper>
            </div>
            <div className="h-screen bg-background text-foreground flex flex-col print:hidden">
                <AddMarketingEmployeeDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} addEmployee={addMarketingEmployee} />
                <ManageQuestionsDialog open={isManageQuestionsOpen} onOpenChange={setManageQuestionsOpen} />
                <EditSubmissionDialog feedback={editingFeedback} open={!!editingFeedback} onOpenChange={(open) => !open && setEditingFeedback(null)} />

                <header className="flex items-center justify-between gap-4 mb-8 p-4 md:p-8 border-b">
                    <div className='flex items-center gap-4'>
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/"><ArrowLeft /></Link>
                        </Button>
                        <h1 className="text-2xl md:text-3xl">{t('marketing_feedback')}</h1>
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
                
                <main className="flex-1 overflow-y-auto px-4 md:px-8">
                    <Tabs defaultValue="dashboard">
                        <TabsList className="mb-6 grid grid-cols-2">
                            <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2" />{t('dashboard')}</TabsTrigger>
                            <TabsTrigger value="form"><FileText className="mr-2" />{t('feedback_form')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard">
                            <div className="flex justify-end mb-4 gap-2">
                                <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/> {t('print')}</Button>
                            </div>
                            <div className="space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('employee_performance')}</CardTitle>
                                        <CardDescription>{t('employee_performance_desc', { maxScore })}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="max-h-[300px] overflow-y-auto">
                                    {isLoading ? <Loader2 className="animate-spin" /> : (
                                        <Table>
                                            <TableHeader><TableRow><TableHead>{t('rank')}</TableHead><TableHead>{t('employee')}</TableHead><TableHead className="text-right">{t('total_score')}</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {evaluationSummary.map((item, index) => (
                                                    <TableRow key={item.employeeId} className={cn(getRowClass(index))}>
                                                        <TableCell className="font-semibold">{index + 1}</TableCell>
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
                        
                        <TabsContent value="form" className="space-y-6">
                        <Card>
                                <CardHeader>
                                    <CardTitle>{t('feedback_form')}</CardTitle>
                                    <CardDescription>{t('feedback_form_batch_desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {isLoading ? (
                                        <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin" /></div>
                                    ) : marketingEmployees.length === 0 ? (
                                        <div className="text-center py-10">
                                            <p>{t('no_marketing_employees')}</p>
                                            <Button onClick={() => setAddDialogOpen(true)} className="mt-4">
                                                <Plus className="mr-2 h-4 w-4" /> {t('add_employee')}
                                            </Button>
                                        </div>
                                    ) : (
                                    <div className="space-y-4">
                                    <div className="p-4 border rounded-lg bg-muted/30 flex-col md:flex-row flex justify-between items-center">
                                            <div className="space-y-2 mb-4 md:mb-0">
                                                <Label htmlFor="employee-select">{t('select_an_employee')}</Label>
                                                <Select onValueChange={setCurrentEmployeeId} value={currentEmployeeId || ''}>
                                                    <SelectTrigger id="employee-select" className="w-[300px]">
                                                        <SelectValue placeholder="Select an employee..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {marketingEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {currentEmployee && <p className="text-sm text-muted-foreground">{t('showing_questions_for', { employeeName: currentEmployee.name })}</p>}
                                        </div>
                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                                            {evaluationQuestions.map((q) => (
                                                <div key={q.id} className="p-4 border rounded-lg">
                                                    <p className="font-medium mb-3">{t(q.text.toLowerCase().replace(/ /g, '_')) || q.text}</p>
                                                    <RadioGroup 
                                                        onValueChange={(value) => handleResponseChange(q.id, value)} 
                                                        value={String(responses[q.id] || '')}
                                                    >
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                            {q.answers.sort((a,b) => b.value - a.value).map(opt => (
                                                                <Label key={opt.value} htmlFor={`${q.id}-${opt.value}-${currentEmployeeId}`} className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted cursor-pointer flex-1 justify-center border has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                                                                    <RadioGroupItem value={String(opt.value)} id={`${q.id}-${opt.value}-${currentEmployeeId}`} />
                                                                    <span>{t(opt.label.toLowerCase().replace(/ /g, '_')) || opt.label}</span>
                                                                </Label>
                                                            ))}
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            ))}
                                        </div>
                                        <Button onClick={handleSaveSubmission} className="w-full">
                                            <Save className="mr-2 h-4 w-4" /> Save Submission
                                        </Button>
                                    </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('historical_submissions')}</CardTitle>
                                    <CardDescription>{t('historical_submissions_desc')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <Select onValueChange={setSelectedEmployeeForHistory} value={selectedEmployeeForHistory || ''}>
                                            <SelectTrigger className="w-[300px]">
                                                <SelectValue placeholder="Select an employee to view history..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {marketingEmployees.map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {selectedEmployeeForHistory && (
                                    <div className="max-h-[400px] overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t('date')}</TableHead>
                                                    <TableHead className='text-right'>{t('total_score')}</TableHead>
                                                    <TableHead className="text-right"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {employeeHistory.length > 0 ? employeeHistory.map(fb => (
                                                    <TableRow key={fb.id}>
                                                        <TableCell>{format(parseISO(fb.date), 'PPP')}</TableCell>
                                                        <TableCell className="text-right">{fb.totalScore}</TableCell>
                                                        <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => setEditingFeedback(fb)}><Edit className="h-4 w-4" /></Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                                                    <AlertDialogDescription>{t('confirm_delete_submission', {employeeName: employees.find(e => e.id === fb.employeeId)?.name, date: format(parseISO(fb.date), 'PPP')})}</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteSubmission(fb.id)}>{t('delete')}</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center h-24">{t('no_history_for_employee')}</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </>
    );
}

export default withAuth(MarketingFeedbackPage);
