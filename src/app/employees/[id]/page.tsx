
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import withAuth from "@/hooks/withAuth";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Edit, Trash2, Save, X, Upload, Mail, Phone, Cake, Calendar as CalendarIcon, DollarSign, Clock, Gift, Banknote, FileDown, Printer, UserX, User, Loader2, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/context/app-provider"
import type { Employee, Expense, Overtime, Bonus, CashWithdrawal } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"
import { useStorage } from "@/firebase";
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { EmployeeReportPdf } from "@/components/employees/EmployeeReportPdf";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const employeeRoles: Exclude<Employee['role'], null | undefined>[] = [
    'Super Manager', 
    'Manager', 
    'IT', 
    'Employee Supervisor', 
    'Transport Supervisor', 
    'Employee', 
    'Marketing'
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const safeDate = (dateValue: string | undefined | null): Date | null => {
  if (!dateValue) return null;
  try {
    const parsed = parseISO(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

function EmployeeDetailPage() {
  const { t, language } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const {
    employees, setEmployees,
    expenses, overtime, bonuses, withdrawals,
    isLoading: isAppLoading, settings
  } = useAppContext();
  
  const { toast } = useToast();
  const storage = useStorage();

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
  
  const photoUploadRef = useRef<HTMLInputElement>(null);

  const selectedEmployee = useMemo(() => employees?.find(e => e.id === employeeId), [employees, employeeId]);

  useEffect(() => {
    if (selectedEmployee) {
        setName(selectedEmployee.name);
        setKurdishName(selectedEmployee.kurdishName || '');
        setUniqueId(selectedEmployee.employeeId || '');
        setRole(selectedEmployee.role);
        setEmploymentStartDate(safeDate(selectedEmployee.employmentStartDate) || undefined);
        setDateOfBirth(safeDate(selectedEmployee.dateOfBirth) || undefined);
        setEmail(selectedEmployee.email || '');
        setPhone(selectedEmployee.phone || '');
        setPhotoUrl(selectedEmployee.photoUrl || undefined);
        setNotes(selectedEmployee.notes || '');
        setIsEditing(false); // Reset editing state when selection changes
    }
  }, [selectedEmployee]);
  
  // --- Individual Employee Logic ---
  const { totalExpenses, sortedExpenses } = useMemo(() => {
    if (!employeeId) return { totalExpenses: 0, sortedExpenses: [] };
    const empExpenses = expenses.filter(e => e.employeeId === employeeId);
    const total = empExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const sorted = [...empExpenses].filter(e => e.date && !isNaN(parseISO(e.date).getTime())).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return { totalExpenses: total, sortedExpenses: sorted };
  }, [expenses, employeeId]);

  const { totalOvertimeAmount, totalOvertimeHours, sortedOvertime } = useMemo(() => {
    if (!employeeId) return { totalOvertimeAmount: 0, totalOvertimeHours: 0, sortedOvertime: [] };
    const empOvertime = overtime.filter(e => e.employeeId === employeeId);
    const totals = empOvertime.reduce((acc, ot) => { acc.totalAmount += ot.totalAmount; acc.totalHours += ot.hours; return acc; }, { totalAmount: 0, totalHours: 0 });
    const sorted = [...empOvertime].filter(o => o.date && !isNaN(parseISO(o.date).getTime())).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return { totalOvertimeAmount: totals.totalAmount, totalOvertimeHours: totals.totalHours, sortedOvertime: sorted };
  }, [overtime, employeeId]);

  const { totalBonuses, sortedBonuses } = useMemo(() => {
    if (!employeeId) return { totalBonuses: 0, sortedBonuses: [] };
    const empBonuses = bonuses.filter(b => b.employeeId === employeeId);
    const total = empBonuses.reduce((sum, b) => sum + b.totalAmount, 0);
    const sorted = [...empBonuses].filter(b => b.date && !isNaN(parseISO(b.date).getTime())).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return { totalBonuses: total, sortedBonuses: sorted };
  }, [bonuses, employeeId]);

  const { totalWithdrawals, sortedWithdrawals } = useMemo(() => {
    if (!employeeId) return { totalWithdrawals: 0, sortedWithdrawals: [] };
    const empWithdrawals = withdrawals.filter(w => w.employeeId === employeeId);
    const total = empWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const sorted = [...empWithdrawals].filter(w => w.date && !isNaN(parseISO(w.date).getTime())).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return { totalWithdrawals: total, sortedWithdrawals: sorted };
  }, [withdrawals, employeeId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedEmployee) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const localUrl = event.target?.result as string;
            if (localUrl) {
                setPhotoUrl(localUrl);
                const filePath = `employees/${selectedEmployee.id}/photo.png`;
                const sRef = storageRef(storage, filePath);
                
                const uploadToast = toast({ title: "Uploading...", description: "Your new photo is being uploaded." });
                uploadString(sRef, localUrl, 'data_url').then(() => getDownloadURL(sRef)).then(downloadURL => {
                    setPhotoUrl(downloadURL);
                    uploadToast.update({ id: uploadToast.id, title: "Upload Complete", description: "Photo updated. Click Save to apply changes." });
                }).catch(err => {
                    console.error("Error uploading/getting URL", err);
                    uploadToast.update({ id: uploadToast.id, variant: 'destructive', title: "Upload Failed", description: "Could not save the photo." });
                });
            }
        };
        reader.readAsDataURL(file);
  };
  
  const handleUpdate = () => {
    if (!employeeId || !name) return;
    const updatedData: Partial<Employee> = {
        name, kurdishName: kurdishName || null, employeeId: uniqueId || null, role: role || null,
        employmentStartDate: employmentStartDate ? employmentStartDate.toISOString() : null,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
        email: email || null, phone: phone || null, photoUrl: photoUrl || null, notes: notes || null,
    };
    setEmployees(employees.map(emp => emp.id === employeeId ? { ...emp, ...updatedData } : emp));
    toast({ title: t('save_changes'), description: t('employee_details_updated') });
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if(!employeeId) return;
    setEmployees(employees.filter(e => e.id !== employeeId));
    toast({ title: t('employee_deleted'), description: t('employee_deleted_desc', {employeeName: selectedEmployee?.name}) });
    router.push('/employees');
  };
  
  const handleToggleActiveStatus = () => {
    if (!selectedEmployee) return;
    setEmployees(employees.map(e => e.id === selectedEmployee.id ? { ...e, isActive: !e.isActive } : e));
    toast({ title: employeeIsActive ? 'Employee Deactivated' : 'Employee Reactivated', description: `${selectedEmployee.name} has been ${employeeIsActive ? 'deactivated' : 'reactivated'}.` })
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcelForDetail = () => {
    if (!selectedEmployee) return;

    const wb = XLSX.utils.book_new();

    const profileData = [
        { "Field": t('employee_name'), "Value": selectedEmployee.name }, { "Field": t('kurdish_name'), "Value": selectedEmployee.kurdishName || t('na') },
        { "Field": t('id_colon'), "Value": selectedEmployee.employeeId || t('na') }, { "Field": t('role_optional'), "Value": selectedEmployee.role || t('na') },
        { "Field": t('email_optional'), "Value": selectedEmployee.email || t('na') }, { "Field": t('phone_optional'), "Value": selectedEmployee.phone || t('na') },
        { "Field": t('joined_date'), "Value": selectedEmployee.employmentStartDate ? format(parseISO(selectedEmployee.employmentStartDate), 'yyyy-MM-dd') : t('na') },
        { "Field": t('dob'), "Value": selectedEmployee.dateOfBirth ? format(parseISO(selectedEmployee.dateOfBirth), 'yyyy-MM-dd') : t('na') },
    ];
    const wsProfile = XLSX.utils.json_to_sheet(profileData, { skipHeader: true });
    XLSX.utils.book_append_sheet(wb, wsProfile, "Profile");

    if (sortedExpenses.length > 0) { 
        const expensesData = sortedExpenses.map(e => ({ [t('date')]: format(parseISO(e.date), 'yyyy-MM-dd'), [t('amount')]: e.amount, [t('notes')]: e.notes || '' }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), t('expenses')); 
    }

    if (sortedOvertime.length > 0) { 
        const overtimeData = sortedOvertime.map(o => ({ [t('date')]: format(parseISO(o.date), 'yyyy-MM-dd'), [t('overtime_hours')]: o.hours, [t('amount')]: o.totalAmount, [t('notes')]: o.notes || '' }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overtimeData), t('overtime')); 
    }

    if (sortedBonuses.length > 0) { 
        const bonusesData = sortedBonuses.map(b => ({ [t('date')]: format(parseISO(b.date), 'yyyy-MM-dd'), [t('number_of_loads')]: b.loadCount, [t('amount')]: b.totalAmount, [t('notes')]: b.notes || '' }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bonusesData), t('bonuses')); 
    }

    if (sortedWithdrawals.length > 0) { 
        const withdrawalsData = sortedWithdrawals.map(w => ({ [t('date')]: format(parseISO(w.date), 'yyyy-MM-dd'), [t('amount')]: w.amount, [t('notes')]: w.notes || '' }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(withdrawalsData), t('cash_withdrawals')); 
    }
    
    if (wb.SheetNames.length > 0) {
        XLSX.writeFile(wb, `${selectedEmployee.name}_Financials_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } else {
        toast({ title: t('no_data_to_export'), description: "This employee has no data to export." });
    }
  };

  const handleGeneratePdf = () => {
    if (!selectedEmployee) return;

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
    });

    const fontName = 'CustomAppFont';
    if (settings.customFont) {
        try {
            const base64Font = settings.customFont.split(',')[1];
            doc.addFileToVFS(`${fontName}.ttf`, base64Font);
            doc.addFont(`${fontName}.ttf`, fontName, 'normal');
            doc.setFont(fontName);
        } catch (e) {
            console.error("Error with custom font:", e);
            doc.setFont('helvetica');
        }
    } else {
        doc.setFont('helvetica');
    }
    
    const displayName = language === 'ku' && selectedEmployee.kurdishName ? selectedEmployee.kurdishName : selectedEmployee.name;

    doc.setFontSize(22);
    doc.text(t('employee_report'), doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(displayName, doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    let startY = 80;

    autoTable(doc, {
        body: [
            [{ content: t('contact_information'), colSpan: 2, styles: { fontStyle: 'bold' } }],
            [t('email_optional'), selectedEmployee.email || t('na')],
            [t('phone_optional'), selectedEmployee.phone || t('na')],
            [{ content: t('employment_details'), colSpan: 2, styles: { fontStyle: 'bold', paddingTop: 10 } }],
            [t('id_no'), selectedEmployee.employeeId || t('na')],
            [t('role_optional'), selectedEmployee.role || t('na')],
            [t('joined_date'), selectedEmployee.employmentStartDate ? format(parseISO(selectedEmployee.employmentStartDate), 'PPP') : t('na')],
            [t('dob'), selectedEmployee.dateOfBirth ? format(parseISO(selectedEmployee.dateOfBirth), 'PPP') : t('na')],
        ],
        startY: startY,
        theme: 'plain',
        styles: { font: fontName, fontSize: 9 }
    });

    startY = (doc as any).lastAutoTable.finalY + 20;

    const addFinancialSection = (title: string, data: any[], columns: string[], rows: (item: any) => (string|number)[]) => {
        if (data.length === 0) return;
        if (startY > doc.internal.pageSize.getHeight() - 100) {
            doc.addPage();
            startY = 40;
        }
        doc.setFontSize(14);
        doc.text(title, 40, startY);
        startY += 15;

        autoTable(doc, {
            head: [columns],
            body: data.map(rows),
            startY: startY,
            theme: 'striped',
            styles: { font: fontName, fontSize: 9 },
            headStyles: { fillColor: '#3B82F6' },
        });
        startY = (doc as any).lastAutoTable.finalY + 20;
    };
    
    addFinancialSection(
      t('expenses'), 
      sortedExpenses, 
      [t('date'), t('notes'), t('amount')], 
      (item: Expense) => [format(parseISO(item.date), 'PPP'), item.notes || '', formatCurrency(item.amount)]
    );
    addFinancialSection(
      t('overtime'), 
      sortedOvertime, 
      [t('date'), t('overtime_hours'), t('notes'), t('amount')], 
      (item: Overtime) => [format(parseISO(item.date), 'PPP'), item.hours.toFixed(2), item.notes || '', formatCurrency(item.totalAmount)]
    );
    addFinancialSection(
      t('bonuses'), 
      sortedBonuses, 
      [t('date'), t('number_of_loads'), t('notes'), t('amount')], 
      (item: Bonus) => [format(parseISO(item.date), 'PPP'), item.loadCount, item.notes || '', formatCurrency(item.totalAmount)]
    );
    addFinancialSection(
      t('cash_withdrawals'), 
      sortedWithdrawals, 
      [t('date'), t('notes'), t('amount')], 
      (item: CashWithdrawal) => [format(parseISO(item.date), 'PPP'), item.notes || '', formatCurrency(item.amount)]
    );

    doc.save(`${selectedEmployee.name}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  const employeeIsActive = selectedEmployee?.isActive ?? true;

  if (isAppLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!selectedEmployee) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center">
        <User className="h-24 w-24 text-muted-foreground mb-4" />
        <h2 className="text-2xl">{t('employee_not_found')}</h2>
        <p className="text-muted-foreground mb-6">{t('employee_not_found_desc')}</p>
        <Button asChild>
          <Link href="/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employee List
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="hidden print:block">
           {selectedEmployee && (
                 <EmployeeReportPdf 
                    employee={selectedEmployee}
                    settings={settings}
                    expenses={{items: sortedExpenses, total: totalExpenses}}
                    overtime={{items: sortedOvertime, total: totalOvertimeAmount}}
                    bonuses={{items: sortedBonuses, total: totalBonuses}}
                    withdrawals={{items: sortedWithdrawals, total: totalWithdrawals}}
                />
            )}
      </div>
      
      <div className="min-h-screen bg-background text-foreground flex flex-col print:hidden">
            <header className="flex items-center justify-between gap-2 p-4 border-b bg-card">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/employees"><ArrowLeft /></Link>
                    </Button>
                     <h1 className="text-xl font-semibold">{selectedEmployee.name}</h1>
                </div>
                <div className="flex-1 flex items-center justify-end gap-2 flex-wrap">
                    {isEditing ? (
                        <>
                            <Button onClick={handleUpdate}><Save className="mr-2 h-4 w-4"/> {t('save_changes')}</Button>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4"/> {t('cancel')}</Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4"/> {t('edit')}</Button>
                            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> {t('print')}</Button>
                            <Button variant="outline" onClick={handleGeneratePdf}><FileText className="mr-2 h-4 w-4"/> {t('pdf')}</Button>
                            <Button variant="outline" onClick={handleExportExcelForDetail}><FileDown className="mr-2 h-4 w-4"/> {t('excel')}</Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className={cn(!employeeIsActive && "text-destructive border-destructive/50")}>
                                        <UserX className="mr-2 h-4 w-4"/> {employeeIsActive ? 'Deactivate' : 'Reactivate'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure you want to {employeeIsActive ? 'deactivate' : 'reactivate'} {selectedEmployee.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>Deactivated employees will not appear in dropdown lists for new entries.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleToggleActiveStatus}>{employeeIsActive ? 'Deactivate' : 'Reactivate'}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> {t('delete')}</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('are_you_sure_delete_employee')}</AlertDialogTitle>
                                        <AlertDialogDescription>{t('confirm_delete_employee_record', {employeeName: selectedEmployee.name})}</AlertDialogDescription>
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
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 container mx-auto">
                 <Card className="border-0 shadow-none">
                    <CardHeader className="flex-col md:flex-row gap-6 space-y-0 items-start">
                        <div className="relative">
                            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary/20">
                                <AvatarImage src={photoUrl || undefined} alt={name} />
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
                                    <Input dir="rtl" className="text-2xl h-12" value={kurdishName} onChange={e => setKurdishName(e.target.value)} placeholder="ناو بە کوردی" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input value={uniqueId} onChange={e => setUniqueId(e.target.value)} placeholder={t('employee_id_optional')} />
                                        <Select value={role || undefined} onValueChange={(v: Employee['role']) => setRole(v)}>
                                            <SelectTrigger><SelectValue placeholder={t('select_a_role')} /></SelectTrigger>
                                            <SelectContent>{employeeRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("justify-start text-left", !employmentStartDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{employmentStartDate ? `${t('start_date_optional')}: ${format(employmentStartDate, 'PPP')}` : <span>{t('pick_a_date')}</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={employmentStartDate} onSelect={setEmploymentStartDate} initialFocus captionLayout="dropdown-nav" fromYear={1990} toYear={2040} /></PopoverContent></Popover>
                                        <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("justify-start text-left", !dateOfBirth && "text-muted-foreground")}><Cake className="mr-2 h-4 w-4" />{dateOfBirth ? `${t('dob_optional')}: ${format(dateOfBirth, 'PPP')}` : <span>{t('pick_a_date')}</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} initialFocus captionLayout="dropdown-nav" fromYear={1950} toYear={new Date().getFullYear()} /></PopoverContent></Popover>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-3xl md:text-4xl" dir={language === 'ku' ? 'rtl': 'ltr'}>{language === 'ku' && kurdishName ? kurdishName : name}</CardTitle>
                                        {!employeeIsActive && <Badge variant="destructive" className="text-sm">INACTIVE</Badge>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                        {role && <CardDescription className="text-lg md:text-xl flex items-center gap-2">{role}</CardDescription>}
                                    </div>
                                    <div className="mt-4 space-y-2 text-muted-foreground">
                                        {uniqueId && <p className="flex items-center gap-2 font-mono">{t('id_colon')} {uniqueId}</p>}
                                        {employmentStartDate && <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> {t('started_on', {date: format(employmentStartDate, 'MMMM d, yyyy')})}</p>}
                                        {dateOfBirth && <p className="flex items-center gap-2"><Cake className="w-4 h-4"/> {t('born_on', {date: format(dateOfBirth, 'MMMM d, yyyy')})}</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label>{t('email_optional')}</Label>{isEditing ? <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@example.com" className="pl-10" /></div> : <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/> {email || t('no_email')}</p>}</div>
                            <div className="space-y-2"><Label>{t('phone_optional')}</Label>{isEditing ? <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0000-000-000" className="pl-10"/></div> : <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> {phone || t('no_phone')}</p>}</div>
                        </div>
                        <div className="space-y-2"><Label>{t('notes')}</Label>{isEditing ? <Textarea className="min-h-[120px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_optional_long')} /> : <p className="whitespace-pre-wrap text-muted-foreground">{notes || t('no_notes')}</p>}</div>
                    </CardContent>
                </Card>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-500"/> {t('expenses')}</CardTitle></CardHeader><CardContent>{sortedExpenses.length > 0 ? <Table><TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader><TableBody>{sortedExpenses.slice(0, 3).map(e => (<TableRow key={e.id}><TableCell>{format(parseISO(e.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(e.amount)}</TableCell></TableRow>))}</TableBody></Table> : <p className="text-sm text-center text-muted-foreground py-4">{t('no_expenses')}</p>}</CardContent>{sortedExpenses.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 text-sm"><span className="text-muted-foreground">{t('total_colon')}</span><span className="text-blue-500">{formatCurrency(totalExpenses)}</span></CardFooter>}</Card>
                    <Card><CardHeader><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500"/> {t('overtime')}</CardTitle><Badge variant="outline">{totalOvertimeHours.toFixed(2)} {t('hours_short')}</Badge></div></CardHeader><CardContent>{sortedOvertime.length > 0 ? <Table><TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader><TableBody>{sortedOvertime.slice(0, 3).map(o => (<TableRow key={o.id}><TableCell>{format(parseISO(o.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(o.totalAmount)}</TableCell></TableRow>))}</TableBody></Table> : <p className="text-sm text-center text-muted-foreground py-4">{t('no_overtime_this_month')}</p>}</CardContent>{sortedOvertime.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 text-sm"><span className="text-muted-foreground">{t('months_total_colon')}</span><span className="text-orange-500">{formatCurrency(totalOvertimeAmount)}</span></CardFooter>}</Card>
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-green-500"/> {t('bonuses')}</CardTitle></CardHeader><CardContent>{sortedBonuses.length > 0 ? <Table><TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader><TableBody>{sortedBonuses.slice(0, 3).map(b => (<TableRow key={b.id}><TableCell>{format(parseISO(b.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(b.totalAmount)}</TableCell></TableRow>))}</TableBody></Table> : <p className="text-sm text-center text-muted-foreground py-4">{t('no_bonuses')}</p>}</CardContent>{sortedBonuses.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 text-sm"><span className="text-muted-foreground">{t('total_colon')}</span><span className="text-green-500">{formatCurrency(totalBonuses)}</span></CardFooter>}</Card>
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5 text-rose-500"/> {t('cash_withdrawals')}</CardTitle></CardHeader><CardContent>{sortedWithdrawals.length > 0 ? <Table><TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader><TableBody>{sortedWithdrawals.slice(0, 3).map(w => (<TableRow key={w.id}><TableCell>{format(parseISO(w.date), 'PP')}</TableCell><TableCell className="text-right">{formatCurrency(w.amount)}</TableCell></TableRow>))}</TableBody></Table> : <p className="text-sm text-center text-muted-foreground py-4">{t('no_withdrawals')}</p>}</CardContent>{sortedWithdrawals.length > 0 && <CardFooter className="justify-end gap-2 bg-muted/50 text-sm"><span className="text-muted-foreground">{t('total_colon')}</span><span className="text-rose-500">{formatCurrency(totalWithdrawals)}</span></CardFooter>}</Card>
                </div>
            </main>
      </div>
    </>
  )
}

export default withAuth(EmployeeDetailPage);


    