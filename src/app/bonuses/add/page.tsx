
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, User, Edit, Save, X, FileText, Truck, Printer, Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAppContext } from '@/context/app-provider';
import type { Bonus, AllPdfSettings, ActivityLog } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import { BonusReportPdf } from '@/components/reports/BonusReportPdf';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import * as XLSX from 'xlsx';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AddBonusPage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();

  const { employees, bonuses, setBonuses, settings, setActivityLogs } = useAppContext();
  const { salarySettings } = settings;

  const dateParam = searchParams.get('date');
  const isReadOnly = !hasPermission('page:admin');

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  useEffect(() => {
    const getInitialDate = () => {
      if (dateParam) {
        const parsedDate = parseISO(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      return new Date();
    };
    setSelectedDate(getInitialDate());
  }, [dateParam]);
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loadCount, setLoadCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editingRecord, setEditingRecord] = useState<Bonus | null>(null);
  
  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing');
  }, [employees]);

  const dailyBonuses = useMemo(() => {
    if (!bonuses || !selectedDate) return [];
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return bonuses.filter(record => {
        const recordDate = parseISO(record.date);
        return isWithinInterval(recordDate, { start, end });
    }).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [bonuses, selectedDate]);

  const sortedEmployees = useMemo(() => {
    if (!warehouseEmployees) return [];
    return [...warehouseEmployees].sort((a, b) => a.name.localeCompare(b.name));
  }, [warehouseEmployees]);

  const getEmployeeName = (id: string, useKurdish: boolean = false) => {
    const employee = employees?.find(e => e.id === id);
    if (!employee) return t('unknown');
    if (isReadOnly && user?.username !== `${employee.name.split(' ')[0]}${employee.employeeId || ''}`) return '***';
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };
  
  const resetForm = () => {
    setSelectedEmployee('');
    setLoadCount('1');
    setNotes('');
  };
  
  const startEditing = (record: Bonus) => {
    setEditingRecord(JSON.parse(JSON.stringify(record))); // Deep copy
  };
  
  const cancelEditing = () => {
    setEditingRecord(null);
  };
  
  const handleUpdateRecord = () => {
    if(!editingRecord || isReadOnly) return;
    
    setIsSaving(true);
    
    const updatedData = {
        ...editingRecord,
        totalAmount: editingRecord.loadCount * editingRecord.rate,
    };
    
    setBonuses(bonuses.map(rec => rec.id === updatedData.id ? updatedData : rec));
    toast({ title: t('save_changes'), description: t('bonus_record_updated') });
    if(user) {
        const log: ActivityLog = { id: crypto.randomUUID(), userId: user.id, username: user.username, action: 'update', entity: 'Bonus', entityId: updatedData.id, description: `Updated bonus for ${getEmployeeName(updatedData.employeeId)}`, timestamp: new Date().toISOString() };
        setActivityLogs(prev => [...prev, log]);
    }
    setEditingRecord(null);
    setIsSaving(false);
  };

  const handleAddBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!selectedEmployee || !loadCount || !selectedDate || parseInt(loadCount) <= 0) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('add_bonus_validation_error') });
      return;
    }
    
    setIsSaving(true);
    const bonusData: Bonus = {
      id: crypto.randomUUID(),
      employeeId: selectedEmployee,
      date: selectedDate.toISOString(),
      loadCount: parseInt(loadCount),
      rate: salarySettings.bonusRate,
      totalAmount: parseInt(loadCount) * salarySettings.bonusRate,
      notes,
    };

    setBonuses([...bonuses, bonusData]);
    toast({ title: t('bonus_added'), description: t('bonus_added_desc') });
    if(user) {
        const log: ActivityLog = { id: crypto.randomUUID(), userId: user.id, username: user.username, action: 'create', entity: 'Bonus', entityId: bonusData.id, description: `Added bonus for ${getEmployeeName(bonusData.employeeId)}`, timestamp: new Date().toISOString() };
        setActivityLogs(prev => [...prev, log]);
    }
    resetForm();
    setIsSaving(false);
  };

  const handleDelete = (record: Bonus) => {
    if (isReadOnly) return;
    setBonuses(bonuses.filter(rec => rec.id !== record.id));
    toast({ title: t('record_deleted'), description: t('bonus_record_deleted') });
    if(user) {
        const log: ActivityLog = { id: crypto.randomUUID(), userId: user.id, username: user.username, action: 'delete', entity: 'Bonus', entityId: record.id, description: `Deleted bonus for ${getEmployeeName(record.employeeId)}`, timestamp: new Date().toISOString() };
        setActivityLogs(prev => [...prev, log]);
    }
  };
  
  const { totalLoads, totalAmount } = useMemo(() => {
    if (!dailyBonuses) return { totalLoads: 0, totalAmount: 0 };
    return dailyBonuses.reduce(
        (acc, record) => {
            acc.totalLoads += record.loadCount;
            acc.totalAmount += record.totalAmount;
            return acc;
        }, { totalLoads: 0, totalAmount: 0 });
  }, [dailyBonuses]);


  const isLoading = !employees || !bonuses;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (dailyBonuses.length === 0) {
      toast({ variant: 'destructive', title: 'No data to export' });
      return;
    }
    const dataToExport = dailyBonuses.map(record => ({
      [t('employee')]: getEmployeeName(record.employeeId, language === 'ku'),
      [t('number_of_loads')]: record.loadCount,
      [t('total_bonus')]: record.totalAmount,
      [t('notes')]: record.notes || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Bonuses ${format(selectedDate || new Date(), 'yyyy-MM-dd')}`);
    XLSX.writeFile(workbook, `Daily_Bonuses_${format(selectedDate || new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (!selectedDate) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const PageContent = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className={cn("lg:col-span-1 print:hidden", isReadOnly && "opacity-50 pointer-events-none")}>
                <Card>
                <CardHeader>
                    <CardTitle>{t('add_bonus_record')}</CardTitle>
                    <CardDescription>{t('add_bonus_record_desc')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddBonus}>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="employee">{t('employee')}</label>
                        <Select onValueChange={setSelectedEmployee} value={selectedEmployee} disabled={isSaving || isReadOnly}>
                        <SelectTrigger id="employee">
                            <SelectValue placeholder={t('select_an_employee')} />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoading ? (
                            <SelectItem value="loading" disabled>{t('loading')}...</SelectItem>
                            ) : (
                            sortedEmployees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id} dir={language === 'ku' ? 'rtl' : 'ltr'}>{getEmployeeName(emp.id, language === 'ku')}</SelectItem>
                            ))
                            )}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="loadCount">{t('number_of_loads')}</label>
                        <div className="relative">
                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="loadCount" type="number" value={loadCount} onChange={e => setLoadCount(e.target.value)} required placeholder="e.g., 2" className="pl-8" disabled={isSaving || isReadOnly} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="notes">{t('notes')}</label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_optional')} disabled={isSaving || isReadOnly}/>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('bonus_rate', {rate: formatCurrency(salarySettings.bonusRate)})}
                    </p>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSaving || isReadOnly}>
                            <Plus className="mr-2 h-4 w-4" /> {t('add_record')}
                        </Button>
                    </CardFooter>
                </form>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                <CardHeader>
                    <div className="text-center">
                        <CardTitle className='text-2xl'>{t('bonus_records_for_date', {date: selectedDate ? format(selectedDate, 'PPP') : '...'})}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">{t('loading_records')}...</div>
                    ) : dailyBonuses && dailyBonuses.length > 0 ? (
                        dailyBonuses.map(record => (
                        <div key={record.id} className="py-3 flex justify-between items-start gap-4">
                            {editingRecord?.id === record.id ? (
                            <div className="flex-1 space-y-2 print:hidden">
                                <p dir={language === 'ku' ? 'rtl' : 'ltr'}>{getEmployeeName(record.employeeId, language==='ku')}</p>
                                <Input 
                                    type="number" 
                                    value={editingRecord.loadCount}
                                    onChange={(e) => setEditingRecord({...editingRecord, loadCount: parseInt(e.target.value) || 0})}
                                    className="h-8"
                                />
                                <Textarea 
                                    value={editingRecord.notes}
                                    onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                                    placeholder={t('notes_optional')}
                                />
                            </div>
                            ) : (
                            <div className="flex-1">
                                <p className="flex items-center gap-2" dir={language === 'ku' ? 'rtl' : 'ltr'}><User className="h-4 w-4 text-primary" /> {getEmployeeName(record.employeeId, language === 'ku')}</p>
                                <p className="text-sm text-muted-foreground">{record.loadCount} {t('loads')}</p>
                                {record.notes && <p className="text-sm mt-1">{record.notes}</p>}
                            </div>
                            )}
                            <div className='flex flex-col items-end'>
                                <p className="font-semibold text-primary">{formatCurrency(record.totalAmount)}</p>
                                {!isReadOnly && (
                                  editingRecord?.id === record.id ? (
                                      <div className="flex gap-1 mt-2 print:hidden">
                                          <Button size="icon" className="h-8 w-8" onClick={handleUpdateRecord} disabled={isSaving}><Save className="h-4 w-4"/></Button>
                                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                                      </div>
                                  ) : (
                                      <div className="flex gap-1 mt-1 print:hidden">
                                          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-8 w-8" onClick={() => startEditing(record)}>
                                              <Edit className="h-4 w-4"/>
                                          </Button>
                                          <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                                                      <Trash2 className="h-4 w-4"/>
                                                  </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                      <AlertDialogTitle>{t('delete_this_record')}</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                      {t('confirm_delete_bonus', {employeeName: getEmployeeName(record.employeeId, language === 'ku')})}
                                                      </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleDelete(record)}>{t('delete')}</AlertDialogAction>
                                                  </AlertDialogFooter>
                                              </AlertDialogContent>
                                          </AlertDialog>
                                      </div>
                                  )
                                )}
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">{t('no_bonus_records_for_date')}</div>
                    )}
                    </div>
                </CardContent>
                {dailyBonuses && dailyBonuses.length > 0 && (
                    <CardFooter className="flex justify-between bg-muted/50 py-4 rounded-b-lg">
                        <span>{t('total')}</span>
                        <div className='text-right'>
                             {isReadOnly ? (
                                <p className='font-bold'>***</p>
                             ) : (
                                <>
                                    <p>{totalLoads.toFixed(0)} {t('loads')}</p>
                                    <p className="text-primary">{formatCurrency(totalAmount)}</p>
                                </>
                             )}
                        </div>
                    </CardFooter>
                )}
                </Card>
            </div>
            </div>
  );

  return (
    <>
      <div className="hidden print:block">
        <ReportWrapper>
          <PageContent />
        </ReportWrapper>
      </div>
      <div className="min-h-screen bg-background text-foreground print:hidden">
        <header className="bg-card border-b p-4">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/bonuses">
                  <ArrowLeft />
                </Link>
              </Button>
              <h1 className="text-xl">{t('daily_bonuses')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-48 justify-start text-left", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>{t('pick_a_date')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar 
                      mode="single" 
                      selected={selectedDate} 
                      onSelect={(date) => {
                          if(date) setSelectedDate(date);
                          setIsCalendarOpen(false);
                      }} 
                      initialFocus 
                      captionLayout="dropdown-nav" fromYear={2020} toYear={2040} 
                  />
                  <div className="p-2 border-t">
                    <Input 
                        type="text"
                        placeholder="yyyy-mm-dd"
                        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                            try {
                                const newDate = parseISO(e.target.value);
                                if (!isNaN(newDate.getTime())) {
                                    setSelectedDate(newDate);
                                }
                            } catch {}
                        }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={handlePrint} disabled={isLoading || dailyBonuses.length === 0}><Printer className="h-4 w-4"/></Button>
              <Button variant="outline" size="icon" onClick={handleExportExcel} disabled={isLoading || dailyBonuses.length === 0}><FileDown className="h-4 w-4" /></Button>
            </div>
          </div>
        </header>

        <main className="w-full p-4 md:p-8">
            <PageContent />
        </main>
      </div>
    </>
  );
}
