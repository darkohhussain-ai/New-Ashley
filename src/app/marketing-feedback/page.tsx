
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
import { format, formatISO, parseISO, isToday } from 'date-fns';
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
import { Progress } from '@/components/ui/progress';


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
                <DialogHeader><DialogTitle>{t('add_employee')}</DialogTitle></DialogHeader>
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
                    <CardDescription>{t('manage_questions_answers_desc')}</CardDescription>
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
                    <CardDescription>
                        {t('editing_submission_from', { date: format(parseISO(feedback.date), 'PPP') })}
                    </CardDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 pt-4">
                    {evaluationQuestions.map((q, index) => (
                        <div key={q.id} className="p-4 border rounded-lg">
                            <p className="font-medium mb-3">{index + 1}. {q.text}</p>
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


    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isManageQuestionsOpen, setManageQuestionsOpen] = useState(false);
    const [editingFeedback, setEditingFeedback] = useState<MarketingFeedback | null>(null);

    const [responses, setResponses] = useState<Record<string, Record<string, number>>>({});
    const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const questionsPerSet = 6;
    
    const pdfCardRef = useRef<HTMLDivElement>(null);

    const marketingEmployees = useMemo(() => {
        return employees.filter(e => e.role === 'Marketing').sort((a, b) => {
            const dateA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
            return dateA - dateB;
        });
    }, [employees]);
    
    const questionSets = useMemo(() => {
        const sets = [];
        for (let i = 0; i < evaluationQuestions.length; i += questionsPerSet) {
            sets.push(evaluationQuestions.slice(i, i + questionsPerSet));
        }
        return sets;
    }, [evaluationQuestions]);

    const currentQuestionSet = questionSets[currentSetIndex] || [];
    const currentEmployee = marketingEmployees[currentEmployeeIndex];

     const totalSteps = marketingEmployees.length * questionSets.length;
    const currentStep = (currentSetIndex * marketingEmployees.length) + currentEmployeeIndex + 1;
    const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

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
        if (!currentEmployee) return;
        setResponses(prev => ({
            ...prev,
            [currentEmployee.id]: {
                ...prev[currentEmployee.id],
                [questionId]: parseInt(value)
            }
        }));
    };
    
    const handleNextEmployee = () => {
        if (currentEmployeeIndex < marketingEmployees.length - 1) {
            setCurrentEmployeeIndex(prev => prev + 1);
        }
    };
    
    const handlePrevEmployee = () => {
        if (currentEmployeeIndex > 0) {
            setCurrentEmployeeIndex(prev => prev - 1);
        }
    };

    const handleSaveAndContinue = () => {
        if (!currentEmployee) return;
        setIsSubmitting(true);
        const today = new Date();

        // An array to hold promises for UI updates
        const updatePromises: Promise<void>[] = [];

        marketingEmployees.forEach(employee => {
            const employeeResponses = responses[employee.id];
            if (!employeeResponses) return;

            const existingFeedbackIndex = marketingFeedbacks.findIndex(fb => fb.employeeId === employee.id && isToday(parseISO(fb.date)));
            
            const newResponsesForSet = currentQuestionSet
                .map(q => ({ questionId: q.id, answer: employeeResponses[q.id] }))
                .filter(r => r.answer !== undefined);

            if (newResponsesForSet.length === 0) return;

            if (existingFeedbackIndex > -1) {
                // Update existing feedback
                const promise = new Promise<void>(resolve => {
                    setMarketingFeedbacks(prevFeedbacks => {
                        const newFeedbacks = [...prevFeedbacks];
                        const existing = newFeedbacks[existingFeedbackIndex];
                        const updatedResponses = [
                            ...existing.responses.filter(r => !newResponsesForSet.some(nr => nr.questionId === r.questionId)),
                            ...newResponsesForSet
                        ];
                        const newTotalScore = updatedResponses.reduce((sum, r) => sum + r.answer, 0);

                        newFeedbacks[existingFeedbackIndex] = {
                            ...existing,
                            responses: updatedResponses,
                            totalScore: newTotalScore,
                        };
                        return newFeedbacks;
                    });
                    resolve();
                });
                updatePromises.push(promise);

            } else {
                // Create new feedback
                const totalScore = newResponsesForSet.reduce((sum, r) => sum + r.answer, 0);
                const feedbackData: MarketingFeedback = {
                    id: crypto.randomUUID(),
                    employeeId: employee.id,
                    date: formatISO(today),
                    responses: newResponsesForSet,
                    totalScore,
                };
                 const promise = new Promise<void>(resolve => {
                    setMarketingFeedbacks(prev => [...prev, feedbackData]);
                    resolve();
                });
                updatePromises.push(promise);
            }
        });
        
        Promise.all(updatePromises).then(() => {
            toast({ title: t('progress_saved'), description: t('feedback_for_current_set_saved') });
            if (currentSetIndex < questionSets.length - 1) {
                setCurrentSetIndex(prev => prev + 1);
                setCurrentEmployeeIndex(0);
            } else {
                // This is the final save
                 toast({ title: t('evaluation_complete'), description: t('all_feedback_has_been_saved') });
            }
            setIsSubmitting(false);
        });
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

    const handleDownloadPdf = async () => {
        if (!marketingFeedbacks.length) {
            toast({ title: t('no_data'), description: t('no_data_to_export') });
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
                head: [[shapeText(t('rank')), shapeText(t('employee')), shapeText(t('total_score'))]],
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
                    head: [[shapeText(t('rank')), shapeText(t('employee')), shapeText(t('total_score'))]],
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
             toast({ title: t('no_data'), description: t('no_data_to_export') });
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
                Employee: employee ? (language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name) : t('unknown'),
                'Total Score': fb.totalScore,
            };
            fb.responses.forEach(res => {
                const question = evaluationQuestions.find(q => q.id === res.questionId);
                base[question ? (question.text) : res.questionId] = res.answer;
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

    const isCurrentSetAnsweredForAllEmployees = useMemo(() => {
        if (!currentQuestionSet.length || !marketingEmployees.length) return false;
        
        return marketingEmployees.every(emp => 
            currentQuestionSet.every(q => 
                responses[emp.id] && responses[emp.id][q.id] !== undefined
            )
        );
    }, [responses, currentQuestionSet, marketingEmployees]);


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
                
                <TabsContent value="form">
                   <Card>
                        <CardHeader>
                            <CardTitle>{t('feedback_form')}</CardTitle>
                            <div className="flex justify-between items-center">
                                <CardDescription>{t('feedback_form_batch_desc')}</CardDescription>
                                <span className="text-sm text-muted-foreground">{currentStep} / {totalSteps}</span>
                            </div>
                            <Progress value={progressPercentage} className="w-full" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin" /></div>
                            ) : !currentEmployee ? (
                                <div className="text-center py-10">
                                    <p>{t('no_marketing_employees')}</p>
                                    <Button onClick={() => setAddDialogOpen(true)} className="mt-4">
                                        <Plus className="mr-2 h-4 w-4" /> {t('add_employee')}
                                    </Button>
                                </div>
                            ) : (
                            <>
                                <div className="p-4 border rounded-lg bg-muted/30">
                                    <h3 className="font-bold text-lg text-primary">{currentEmployee.name}</h3>
                                    <p className="text-sm text-muted-foreground">{t('question_set', {
                                        start: (currentSetIndex * questionsPerSet) + 1,
                                        end: (currentSetIndex * questionsPerSet) + currentQuestionSet.length
                                    })}</p>
                                </div>
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                                    {currentQuestionSet.map((q, index) => (
                                        <div key={q.id} className="p-4 border rounded-lg">
                                            <p className="font-medium mb-3">{(currentSetIndex * questionsPerSet) + index + 1}. {q.text}</p>
                                            <RadioGroup 
                                                onValueChange={(value) => handleResponseChange(q.id, value)} 
                                                value={String(responses[currentEmployee.id]?.[q.id] || '')}
                                            >
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    {q.answers.sort((a,b) => b.value - a.value).map(opt => (
                                                        <Label key={opt.value} htmlFor={`${q.id}-${opt.value}-${currentEmployee.id}`} className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted cursor-pointer flex-1 justify-center border has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                                                            <RadioGroupItem value={String(opt.value)} id={`${q.id}-${opt.value}-${currentEmployee.id}`} />
                                                            <span>{t(opt.label.toLowerCase().replace(/ /g, '_')) || opt.label}</span>
                                                        </Label>
                                                    ))}
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center">
                                    <Button onClick={handlePrevEmployee} disabled={currentEmployeeIndex === 0}>{t('previous_employee')}</Button>
                                    <span>{currentEmployee.name} ({currentEmployeeIndex + 1} / {marketingEmployees.length})</span>
                                    <Button onClick={handleNextEmployee} disabled={currentEmployeeIndex === marketingEmployees.length - 1}>{t('next_employee')}</Button>
                                </div>
                                {isCurrentSetAnsweredForAllEmployees && (
                                     <Button onClick={handleSaveAndContinue} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <ChevronsRight className="mr-2"/>}
                                        {currentSetIndex < questionSets.length - 1 ? t('save_and_continue') : t('save_and_finish')}
                                    </Button>
                                )}
                            </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
