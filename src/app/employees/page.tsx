

"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import withAuth from "@/hooks/withAuth";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, formatISO, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Plus, User, Calendar as CalendarIcon, Edit, Trash2, Save, X, Upload, Download, Mail, Phone, Cake, Briefcase, Search, Building, DollarSign, Clock, Gift, Banknote, FileDown, Printer, Wand2, UserX } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { EmployeePdfCard } from "@/components/employees/employee-pdf-card"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/context/app-provider"
import type { Employee, Expense, Overtime, Bonus, CashWithdrawal, AllPdfSettings } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmployeeReportPdfHeader } from "@/components/employees/employee-report-pdf-header"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/hooks/use-translation"
import { translateNameToKurdish } from "@/ai/flows/translate-name-flow"
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const safeDate = (dateValue: string | undefined): Date | null => {
  if (!dateValue) return null;
  try {
    const parsed = parseISO(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};


const employeeRoles = ["Super Manager", "Manager", "IT", "Employee Supervisor", "Transport Supervisor", "Employee", "Marketing"];


function EmployeeDetailView({ employeeId, onDeselect }: { employeeId: string, onDeselect: () => void }) {
    const { t, language } = useTranslation();
    const { toast } = useToast();
    const { 
        employees, setEmployees,
        expenses,
        overtime,
        bonuses,
        withdrawals,
        settings
    } = useAppContext();
    const { pdfSettings } = settings;


    const employee = useMemo(() => employees.find(e => e.id === employeeId), [employees, employeeId]);
    const employeeExpenses = useMemo(() => expenses.filter(e => e.employeeId === employeeId), [expenses, employeeId]);
    const employeeOvertime = useMemo(() => overtime.filter(e => e.employeeId === employeeId), [overtime, employeeId]);
    const employeeBonuses = useMemo(() => bonuses.filter(b => b.employeeId === employeeId), [bonuses, employeeId]);
    const employeeWithdrawals = useMemo(() => withdrawals.filter(w => w.employeeId === employeeId), [withdrawals, employeeId]);


    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [kurdishName, setKurdishName] = useState('');
    const [uniqueId, setUniqueId] = useState('');
    const [role, setRole] = useState<Employee['role']>();
    const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(undefined);
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
    const [notes, setNotes] = useState('');
    
    const cardPdfRef = useRef<HTMLDivElement>(null);
    const reportPdfRef = useRef<HTMLDivElement>(null);
    const photoUploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (employee) {
            setName(employee.name);
            setKurdishName(employee.kurdishName || '');
            setUniqueId(employee.employeeId || '');
            setRole(employee.role);
            setEmploymentStartDate(safeDate(employee.employmentStartDate) || undefined);
            setDateOfBirth(safeDate(employee.dateOfBirth) || undefined);
            setEmail(employee.email || '');
            setPhone(employee.phone || '');
            setPhotoUrl(employee.photoUrl || undefined);
            setNotes(employee.notes || '');
        }
    }, [employee]);

    const { totalExpenses, sortedExpenses } = useMemo(() => {
        if (!employeeExpenses) return { totalExpenses: 0, sortedExpenses: [] };
        const total = employeeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const sorted = [...employeeExpenses]
            .filter(e => e.date && !isNaN(parseISO(e.date).getTime()))
            .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return { totalExpenses: total, sortedExpenses: sorted };
    }, [employeeExpenses]);

    const { totalOvertimeAmount, totalOvertimeHours, sortedOvertime } = useMemo(() => {
        if (!employeeOvertime) return { totalOvertimeAmount: 0, totalOvertimeHours: 0, sortedOvertime: [] };
        const totals = employeeOvertime.reduce((acc, ot) => {
            acc.totalAmount += ot.totalAmount;
            acc.totalHours += ot.hours;
            return acc;
        }, { totalAmount: 0, totalHours: 0 });
        const sorted = [...employeeOvertime]
            .filter(o => o.date && !isNaN(parseISO(o.date).getTime()))
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return { totalOvertimeAmount: totals.totalAmount, totalOvertimeHours: totals.totalHours, sortedOvertime: sorted };
    }, [employeeOvertime]);

    const { totalBonuses, sortedBonuses } = useMemo(() => {
        if (!employeeBonuses) return { totalBonuses: 0, sortedBonuses: [] };
        const total = employeeBonuses.reduce((sum, b) => sum + b.totalAmount, 0);
        const sorted = [...employeeBonuses]
            .filter(b => b.date && !isNaN(parseISO(b.date).getTime()))
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return { totalBonuses: total, sortedBonuses: sorted };
    }, [employeeBonuses]);

    const { totalWithdrawals, sortedWithdrawals } = useMemo(() => {
        if (!employeeWithdrawals) return { totalWithdrawals: 0, sortedWithdrawals: [] };
        const total = employeeWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        const sorted = [...employeeWithdrawals]
            .filter(w => w.date && !isNaN(parseISO(w.date).getTime()))
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        return { totalWithdrawals: total, sortedWithdrawals: sorted };
    }, [employeeWithdrawals]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setPhotoUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = () => {
        if (!employeeId || !name) return;

        const updatedData: Partial<Employee> = {
            name: name,
            kurdishName: kurdishName || null,
            employeeId: uniqueId || null,
            role: role || null,
            employmentStartDate: employmentStartDate ? employmentStartDate.toISOString() : null,
            dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
            email: email || null,
            phone: phone || null,
            photoUrl: photoUrl || null,
            notes: notes || null,
        };

        setEmployees(employees.map(emp => 
            emp.id === employeeId 
                ? { ...emp, ...updatedData } 
                : emp
        ));
        
        toast({ title: t('save_changes'), description: t('employee_details_updated') });
        setIsEditing(false);
    };
    
    const handleDelete = () => {
        if(!employeeId) return;
        setEmployees(employees.filter(e => e.id !== employeeId));
        toast({ title: t('employee_deleted'), description: t('employee_deleted_desc', {employeeName: employee?.name}) });
        onDeselect();
    }
    
    const handleToggleActiveStatus = () => {
        if (!employee) return;
        setEmployees(employees.map(e => e.id === employee.id ? { ...e, isActive: !e.isActive } : e));
        toast({
            title: employee.isActive ? 'Employee Deactivated' : 'Employee Reactivated',
            description: `${employee.name} has been ${employee.isActive ? 'deactivated' : 'reactivated'}.`
        })
    };

    const handlePrintCard = async () => {
        if (!cardPdfRef.current || !employee) return;

        const pdf = new jsPDF({ 
            orientation: 'landscape',
            unit: 'px', 
            format: [600, 360]
        });

        const canvas = await html2canvas(cardPdfRef.current, { scale: 3, useCORS: true, backgroundColor: null });
        const imgData = canvas.toDataURL('image/png');
        
        pdf.addImage(imgData, 'PNG', 0, 0, 600, 360);
        pdf.save(`${employee.name.replace(/ /g, '_')}_card.pdf`);
    };

    const handleDownloadReport = async () => {
        if (!reportPdfRef.current || !employee) return;
        
        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
        
        // 1. Add Header from the new component
        const headerCanvas = await html2canvas(reportPdfRef.current, { scale: 2, useCORS: true, backgroundColor: 'white' });
        const headerImgData = headerCanvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const headerRatio = headerCanvas.width / headerCanvas.height;
        const finalHeaderWidth = pdfWidth; // Use full width
        const finalHeaderHeight = finalHeaderWidth / headerRatio;
        pdf.addImage(headerImgData, 'PNG', 0, 0, finalHeaderWidth, finalHeaderHeight);

        let startY = finalHeaderHeight + 20;

        // 2. Add Tables for each financial section
        const addSection = (title: string, data: any[], columns: string[], bodyMapper: (item: any) => any[], total: number) => {
            if (data.length === 0) return;
            // Check if there is enough space, add new page if not
            if (startY + (data.length * 15) + 40 > pdf.internal.pageSize.getHeight()) {
                pdf.addPage();
                startY = 20;
            }

            pdf.setFontSize(14);
            pdf.text(title, 14, startY);
            startY += 10;
            autoTable(pdf, {
                startY,
                head: [columns],
                body: data.map(bodyMapper),
                foot: [['Total', '', formatCurrency(total)]],
                theme: 'striped',
                headStyles: { fillColor: pdfSettings.report.themeColor || '#22c55e', font: 'helvetica' },
                footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold', font: 'helvetica' },
            });
            startY = (pdf as any).lastAutoTable.finalY + 20;
        }

        addSection(t('expenses'), sortedExpenses, [t('date'), t('notes'), t('amount')], (e) => [format(parseISO(e.date), 'PP'), e.notes || '', formatCurrency(e.amount)], totalExpenses);
        addSection(t('overtime'), sortedOvertime, [t('date'), 'Hours', t('amount')], (o) => [format(parseISO(o.date), 'PP'), o.hours.toFixed(2), formatCurrency(o.totalAmount)], totalOvertimeAmount);
        addSection(t('bonuses'), sortedBonuses, [t('date'), 'Reason', t('amount')], (b) => [format(parseISO(b.date), 'PP'), b.notes || '', formatCurrency(b.totalAmount)], totalBonuses);
        addSection(t('cash_withdrawals'), sortedWithdrawals, [t('date'), t('notes'), t('amount')], (w) => [format(parseISO(w.date), 'PP'), w.notes || '', formatCurrency(w.amount)], totalWithdrawals);
        
        pdf.save(`${employee.name}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <User className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl">{t('employee_not_found')}</h2>
                <p className="text-muted-foreground">{t('employee_not_found_desc')}</p>
            </div>
        )
    }

    const safeEmploymentStartDate = safeDate(employee.employmentStartDate);
    const safeDateOfBirth = safeDate(employee.dateOfBirth);
    const displayName = language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;

    return (
        <>
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={cardPdfRef}><EmployeePdfCard employee={employee} settings={pdfSettings.card || {}} /></div>
                <div ref={reportPdfRef} style={{ width: '700px', background: 'white', color: 'black' }}>
                    <EmployeeReportPdfHeader
                        employee={employee}
                        settings={pdfSettings.report || {}}
                    />
                </div>
            </div>
            <div className="w-full h-full flex flex-col">
                <header className="flex items-center justify-between gap-2 p-4 border-b">
                    <Button variant="outline" size="icon" className="lg:hidden" onClick={onDeselect}>
                        <ArrowLeft />
                    </Button>
                    <div className="flex-1 flex items-center justify-end gap-2 flex-wrap">
                        {isEditing ? (
                            <>
                                <Button onClick={handleUpdate}><Save className="mr-2 h-4 w-4"/> {t('save_changes')}</Button>
                                <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4"/> {t('cancel')}</Button>
                            </>
                        ) : (
                            <>
                                <Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4"/> {t('edit')}</Button>
                                <Button onClick={handlePrintCard} variant="outline"><Printer className="mr-2 h-4 w-4" /> {t('print_card')}</Button>
                                <Button onClick={handleDownloadReport} variant="outline"><FileDown className="mr-2 h-4 w-4" /> {t('download_report')}</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className={cn(!employee.isActive && "text-destructive border-destructive/50")}>
                                            <UserX className="mr-2 h-4 w-4"/> {employee.isActive ? 'Deactivate' : 'Reactivate'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure you want to {employee.isActive ? 'deactivate' : 'reactivate'} {employee.name}?</AlertDialogTitle>
                                            <AlertDialogDescription>Deactivated employees will not appear in dropdown lists for new entries.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleToggleActiveStatus}>{employee.isActive ? 'Deactivate' : 'Reactivate'}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> {t('delete')}</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('are_you_sure_delete_employee')}</AlertDialogTitle>
                                            <AlertDialogDescription>{t('confirm_delete_employee_record', {employeeName: employee.name})}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete}>{t('continue')}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="flex-col md:flex-row gap-6 space-y-0 items-start">
                             <div className="relative">
                                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary/20">
                                    <AvatarImage src={(isEditing ? photoUrl : employee.photoUrl) || undefined} alt={employee.name} />
                                    <AvatarFallback><User className="w-16 h-16"/></AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 rounded-full h-10 w-10" onClick={() => photoUploadRef.current?.click()}>
                                        <Upload className="w-5 h-5"/>
                                        <input ref={photoUploadRef} type="file" onChange={handlePhotoUpload} accept="image/*" className="hidden"/>
                                    </Button>
                                )}
                            </div>
                            <div className="w-full">
                                {isEditing ? (
                                    <div className='space-y-4'>
                                        <Input className="text-2xl h-12" value={name} onChange={e => setName(e.target.value)} placeholder={t('employee_name')} />
                                        <div className="relative">
                                            <Input dir="rtl" className="text-2xl h-12" value={kurdishName} onChange={e => setKurdishName(e.target.value)} placeholder="ناو بە کوردی" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input value={uniqueId} onChange={e => setUniqueId(e.target.value)} placeholder={t('employee_id_optional')} />
                                            <Select value={role} onValueChange={(v: Employee['role']) => setRole(v)}>
                                                <SelectTrigger><SelectValue placeholder={t('select_a_role')} /></SelectTrigger>
                                                <SelectContent>
                                                    {employeeRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={cn("justify-start text-left", !employmentStartDate && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {employmentStartDate ? `${t('start_date_optional')}: ${format(employmentStartDate, 'PPP')}` : <span>{t('pick_a_date')}</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={employmentStartDate} onSelect={setEmploymentStartDate} initialFocus captionLayout="dropdown-nav" fromYear={1990} toYear={2040} /></PopoverContent>
                                            </Popover>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={cn("justify-start text-left", !dateOfBirth && "text-muted-foreground")}>
                                                        <Cake className="mr-2 h-4 w-4" />
                                                        {dateOfBirth ? `${t('dob_optional')}: ${format(dateOfBirth, 'PPP')}` : <span>{t('pick_a_date')}</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} initialFocus captionLayout="dropdown-nav" fromYear={1950} toYear={new Date().getFullYear()} /></PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-3xl md:text-4xl" dir={language === 'ku' ? 'rtl': 'ltr'}>{displayName}</CardTitle>
                                            {!employee.isActive && (
                                                <Badge variant="destructive" className="text-sm">INACTIVE</Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                            {employee.role && <CardDescription className="text-lg md:text-xl flex items-center gap-2">{employee.role}</CardDescription>}
                                        </div>
                                        <div className="mt-4 space-y-2 text-muted-foreground">
                                            {employee.employeeId && <p className="flex items-center gap-2 font-mono">{t('id_colon')} {employee.employeeId}</p>}
                                            {safeEmploymentStartDate && <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> {t('started_on', {date: format(safeEmploymentStartDate, 'MMMM d, yyyy')})}</p>}
                                            {safeDateOfBirth && <p className="flex items-center gap-2"><Cake className="w-4 h-4"/> {t('born_on', {date: format(safeDateOfBirth, 'MMMM d, yyyy')})}</p>}
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{t('email_optional')}</Label>
                                    {isEditing ? (
                                        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@example.com" className="pl-10" /></div>
                                    ) : ( <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/> {employee.email || t('no_email')}</p>)}
                                </div>
                                 <div className="space-y-2">
                                    <Label>{t('phone_optional')}</Label>
                                    {isEditing ? (
                                        <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0000-000-000" className="pl-10"/></div>
                                    ) : (<p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> {employee.phone || t('no_phone')}</p>)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('notes')}</Label>
                                {isEditing ? (
                                    <Textarea className="min-h-[120px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_optional')} />
                                ) : (<p className="whitespace-pre-wrap text-muted-foreground">{employee.notes || t('no_notes')}</p>)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-500"/> {t('expenses')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sortedExpenses.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader>
                                        <TableBody>{sortedExpenses.slice(0, 3).map(e => (<TableRow key={e.id}><TableCell>{format(parseISO(e.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(e.amount)}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                ) : <p className="text-sm text-center text-muted-foreground py-4">{t('no_expenses')}</p>}
                            </CardContent>
                            {sortedExpenses.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 text-sm"><span className="text-muted-foreground">{t('total_colon')}</span><span className="text-blue-500">{formatCurrency(totalExpenses)}</span></CardFooter>}
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-500"/> {t('overtime')}
                                    </CardTitle>
                                    <Badge variant="outline">{totalOvertimeHours.toFixed(2)} {t('hours_short')}</Badge>
                                </div>
                                <CardDescription>{t('this_month_colon', {month: format(new Date(), 'MMMM yyyy')})}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sortedOvertime.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader>
                                        <TableBody>{sortedOvertime.slice(0, 3).map(o => (<TableRow key={o.id}><TableCell>{format(parseISO(o.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(o.totalAmount)}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                ) : <p className="text-sm text-center text-muted-foreground py-4">{t('no_overtime_this_month')}</p>}
                            </CardContent>
                            {sortedOvertime.length > 0 && 
                                <CardFooter className="justify-end gap-2 bg-muted/50 text-sm">
                                    <span className="text-muted-foreground">{t('months_total_colon')}</span>
                                    <span className="text-orange-500">{formatCurrency(totalOvertimeAmount)}</span>
                                </CardFooter>
                            }
                        </Card>

                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-green-500"/> {t('bonuses')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sortedBonuses.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader>
                                        <TableBody>{sortedBonuses.slice(0, 3).map(b => (<TableRow key={b.id}><TableCell>{format(parseISO(b.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(b.totalAmount)}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                ) : <p className="text-sm text-center text-muted-foreground py-4">{t('no_bonuses')}</p>}
                            </CardContent>
                            {sortedBonuses.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 text-sm"><span className="text-muted-foreground">{t('total_colon')}</span><span className="text-green-500">{formatCurrency(totalBonuses)}</span></CardFooter>}
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5 text-rose-500"/> {t('cash_withdrawals')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sortedWithdrawals.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader>
                                        <TableBody>{sortedWithdrawals.slice(0, 3).map(w => (<TableRow key={w.id}><TableCell>{format(parseISO(w.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(w.amount)}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                ) : <p className="text-sm text-center text-muted-foreground py-4">{t('no_withdrawals')}</p>}
                            </CardContent>
                            {sortedWithdrawals.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 text-sm"><span className="text-muted-foreground">{t('total_colon')}</span><span className="text-rose-500">{formatCurrency(totalWithdrawals)}</span></CardFooter>}
                        </Card>
                    </div>

                </div>
            </div>
        </>
    )
}

function AddEmployeeDialog({ open, onOpenChange, addEmployee }: { open: boolean, onOpenChange: (open: boolean) => void, addEmployee: (employee: Omit<Employee, 'id'>) => void }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [kurdishName, setKurdishName] = useState("");
    const [uniqueId, setUniqueId] = useState("");
    const [role, setRole] = useState<Employee['role']>();
    const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>();
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | undefined>();
    const [notes, setNotes] = useState("");

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
    };

    const resetForm = () => {
        setName(""); setKurdishName(""); setUniqueId(""); setRole(undefined); setEmploymentStartDate(undefined); setDateOfBirth(undefined);
        setEmail(""); setPhone(""); setPhotoUrl(undefined); setNotes("");
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
          name,
          kurdishName: kurdishName || null,
          employeeId: uniqueId || null,
          role: role || null,
          photoUrl: photoUrl || `https://picsum.photos/seed/${name.replace(/\s/g, '-')}/400`,
          email: email || null,
          phone: phone || null,
          notes: notes || null,
          employmentStartDate: employmentStartDate?.toISOString() || null,
          dateOfBirth: dateOfBirth?.toISOString() || null,
          createdAt: formatISO(new Date()),
          isActive: true,
        };
        
        addEmployee(employeeData);
        toast({ title: t('employee_added'), description: t('employee_added_desc', {employeeName: name}) });
        resetForm();
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setPhotoUrl(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>{t('add_new_employee')}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24"><AvatarImage src={photoUrl} /><AvatarFallback><User className="w-12 h-12" /></AvatarFallback></Avatar>
                        <Input id="photo" type="file" onChange={handlePhotoUpload} accept="image/*" />
                    </div>
                    <div className="space-y-2"><Label htmlFor="name">{t('employee_name')}</Label><Input id="name" value={name} onChange={handleNameChange} required placeholder="e.g. John Doe" /></div>
                    <div className="space-y-2 relative">
                        <Label htmlFor="kurdishName">ناو بە کوردی</Label>
                        <Input id="kurdishName" value={kurdishName} onChange={e => setKurdishName(e.target.value)} dir="rtl" placeholder="بۆ نموونە، جۆن دۆ" className="pr-10"/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="employeeId">{t('employee_id_optional')}</Label><Input id="employeeId" value={uniqueId} onChange={e => setUniqueId(e.target.value)} placeholder="e.g. 10234" /></div>
                        <div className="space-y-2"><Label htmlFor="role">{t('role_optional')}</Label>
                            <Select onValueChange={(v: Employee['role']) => setRole(v)} value={role}>
                                <SelectTrigger id="role"><SelectValue placeholder={t('select_a_role')} /></SelectTrigger>
                                <SelectContent>
                                    {employeeRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>{t('email_optional')}</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@example.com" className="pl-10" /></div></div>
                        <div className="space-y-2"><Label>{t('phone_optional')}</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0000-000-000" className="pl-10"/></div></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>{t('start_date_optional')}</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left",!employmentStartDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{employmentStartDate ? format(employmentStartDate, "PPP") : <span>{t('pick_a_date')}</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={employmentStartDate} onSelect={setEmploymentStartDate} captionLayout="dropdown-nav" fromYear={1990} toYear={2040} initialFocus/></PopoverContent></Popover></div>
                        <div className="space-y-2"><Label>{t('dob_optional')}</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left",!dateOfBirth && "text-muted-foreground")}><Cake className="mr-2 h-4 w-4" />{dateOfBirth ? format(dateOfBirth, "PPP") : <span>{t('pick_a_date')}</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} captionLayout="dropdown-nav" fromYear={1950} toYear={new Date().getFullYear()} initialFocus/></PopoverContent></Popover></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="notes">{t('notes_optional')}</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_optional_long')} /></div>
                    <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="secondary">{t('cancel')}</Button></DialogClose><Button type="submit">{t('add_employee')}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function EmployeesPage() {
  const { t, language } = useTranslation();
  const { employees, setEmployees } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      ...employeeData
    };
    setEmployees([...employees, newEmployee]);
  };

  useEffect(() => {
    if (employees) {
      setIsLoading(false);
    }
  }, [employees]);


  const { warehouseEmployees, marketingEmployees } = useMemo(() => {
    if (!employees) return { warehouseEmployees: [], marketingEmployees: [] };

    const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.kurdishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortEmployees = (a: Employee, b: Employee) => {
        // Employee with ID '01' always comes first
        if (a.employeeId === '01') return -1;
        if (b.employeeId === '01') return 1;

        // Then sort by employee ID numerically
        const idA = a.employeeId ? parseInt(a.employeeId, 10) : Infinity;
        const idB = b.employeeId ? parseInt(b.employeeId, 10) : Infinity;

        if (idA !== idB) {
            return idA - idB;
        }

        // Fallback to alphabetical sorting by name
        return a.name.localeCompare(b.name);
    };

    const warehouse = filtered
        .filter(e => e.role !== 'Marketing')
        .sort(sortEmployees);

    const marketing = filtered
        .filter(e => e.role === 'Marketing')
        .sort((a,b) => a.name.localeCompare(b.name));

    return { warehouseEmployees: warehouse, marketingEmployees: marketing };
}, [employees, searchQuery]);


  useEffect(() => {
    const allSorted = [...warehouseEmployees, ...marketingEmployees];
    // Only auto-select on desktop if no employee is currently selected.
    if (!isMobile && !selectedEmployeeId && allSorted.length > 0) {
      setSelectedEmployeeId(allSorted[0].id);
    }
    // This part handles when a selected employee is filtered out or deleted.
    if (selectedEmployeeId && !allSorted.some(e => e.id === selectedEmployeeId)) {
        // Select the first available employee, or null if the list is now empty.
        setSelectedEmployeeId(allSorted[0]?.id || null);
    }
  }, [warehouseEmployees, marketingEmployees, selectedEmployeeId, isMobile]);
  
  const renderEmployeeList = (list: Employee[], title: string) => (
    <>
      <div className="px-3 py-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
        <Separator className="mt-1"/>
      </div>
      {list.map(emp => {
        const displayName = language === 'ku' && emp.kurdishName ? emp.kurdishName : emp.name;
        return (
          <button key={emp.id} onClick={() => setSelectedEmployeeId(emp.id)} className={cn("w-full text-left p-3 rounded-lg transition-colors flex items-center gap-4",
              selectedEmployeeId === emp.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              !emp.isActive && 'bg-red-100 dark:bg-red-900/30'
          )}>
              <Avatar className="w-10 h-10"><AvatarImage src={emp.photoUrl || undefined} /><AvatarFallback>{emp.name.charAt(0)}</AvatarFallback></Avatar>
              <div>
                  <p className="font-semibold" dir={language === 'ku' ? 'rtl' : 'ltr'}>{displayName}</p>
                  <div className={cn("text-xs flex items-center gap-1.5", selectedEmployeeId === emp.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {emp.employeeId && <span className='font-mono'>ID: {emp.employeeId}</span>}
                    {emp.employeeId && emp.role && <span>&middot;</span>}
                    {emp.role && <span>{emp.role}</span>}
                    {!emp.isActive && <Badge variant="destructive" className="ml-2">Inactive</Badge>}
                  </div>
              </div>
          </button>
        )
      })}
    </>
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
        <AddEmployeeDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} addEmployee={addEmployee} />
        <header className="bg-card border-b p-4">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild><Link href="/"><ArrowLeft /></Link></Button>
                    <h1 className="text-xl">{t('employees')}</h1>
                </div>
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
            <aside className={cn(
                "w-full flex-col border-r lg:w-full lg:max-w-xs",
                selectedEmployeeId && isMobile ? "hidden" : "flex",
                !selectedEmployeeId && !isMobile && "flex",
                selectedEmployeeId && !isMobile && "hidden lg:flex"
            )}>
                <div className="p-4 space-y-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t('search_name_or_id')} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                     <Button onClick={() => setAddDialogOpen(true)} className="w-full"><Plus className="mr-2 h-4 w-4" /> {t('add_employee')}</Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                         <div className="p-4 space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                    ) : (warehouseEmployees.length > 0 || marketingEmployees.length > 0) ? (
                        <div className="p-2 space-y-1">
                            {warehouseEmployees.length > 0 && renderEmployeeList(warehouseEmployees, t('warehouse'))}
                            {marketingEmployees.length > 0 && renderEmployeeList(marketingEmployees, 'Marketing')}
                        </div>
                    ) : (
                         <div className="text-center p-8">
                            <User className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">{t('no_employees_found')}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{t('no_employees_found_desc')}</p>
                        </div>
                    )}
                </div>
            </aside>
            
            <main className={cn(
                "flex-1 overflow-y-auto",
                 selectedEmployeeId ? "block" : "hidden lg:flex lg:items-center lg:justify-center"
            )}>
                {selectedEmployeeId ? (
                    <EmployeeDetailView employeeId={selectedEmployeeId} onDeselect={() => setSelectedEmployeeId(null)}/>
                ) : (
                    !isLoading && (
                        <div className="text-center">
                            <Building className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-2 text-2xl">{t('employees')}</h2>
                            <p className="text-muted-foreground">{t('select_an_employee_to_view')}</p>
                        </div>
                    )
                )}
            </main>
        </div>
    </div>
  )
}

export default withAuth(EmployeesPage);
