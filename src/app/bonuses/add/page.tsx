'use client';

import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
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

const AddBonusForm = memo(function AddBonusForm({ onAdd }: { onAdd: (data: Omit<Bonus, 'id' | 'date'>) => void }) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { employees, settings } = useAppContext();
  const { salarySettings } = settings;
  const { user, hasPermission } = useAuth();
  const isReadOnly = !hasPermission('page:admin');

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loadCount, setLoadCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing');
  }, [employees]);

  const sortedEmployees = useMemo(() => {
    if (!warehouseEmployees) return [];
    return [...warehouseEmployees].sort((a, b) => a.name.localeCompare(b.name));
  }, [warehouseEmployees]);

  const getEmployeeName = (id: string, useKurdish: boolean = false) => {
    const employee = employees?.find(e => e.id === id);
    if (!employee) return t('unknown');
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  };

  const handleAddBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!selectedEmployee || !loadCount || parseInt(loadCount) <= 0) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('add_bonus_validation_error') });
      return;
    }
    
    setIsSaving(true);
    const bonusData: Omit<Bonus, 'id' | 'date'> = {
      employeeId: selectedEmployee,
      loadCount: parseInt(loadCount),
      rate: salarySettings.bonusRate,
      totalAmount: parseInt(loadCount) * salarySettings.bonusRate,
      notes,
    };

    onAdd(bonusData);
    
    setSelectedEmployee('');
    setLoadCount('1');
    setNotes('');
    setIsSaving(false);
  };
  
  return (
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
                        {sortedEmployees.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.id} dir={language === 'ku' ? 'rtl' : 'ltr'}>{getEmployeeName(emp.id, language === 'ku')}</SelectItem>
                        ))
                        }
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
  );
});

export default function AddBonusPage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { user, hasPermission } = useAuth();

  const { employees, bonuses, setBonuses, settings, setActivityLogs } = useAppContext();
  const isReadOnly = !hasPermission('page:admin');

  const dateParam = searchParams.get('date');

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
  
  const dailyBonuses = useMemo(() => {
    if (!bonuses || !selectedDate) return [];
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return bonuses.filter(record => {
        const recordDate = parseISO(record.date);
        return isWithinInterval(recordDate, { start, end });
    }).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [bonuses, selectedDate]);

  const getEmployeeName = useCallback((id: string, useKurdish: boolean = false) => {
    const employee = employees?.find(e => e.id === id);
    if (!employee) return t('unknown');
    if (isReadOnly && user?.username !== `${employee.name.split(' ')[0]}${employee.employeeId || ''}`) return '***';
    return useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;
  }, [employees, t, isReadOnly, user]);
  
  const handleAddBonus = useCallback((bonusPayload: Omit<Bonus, 'id'|'date'>) => {
    if (!selectedDate) return;

    const bonusData: Bonus = {
      id: crypto.randomUUID(),
      date: selectedDate.toISOString(),
      ...bonusPayload,
    };

    setBonuses(prev => [...prev, bonusData]);
    toast({ title: t('bonus_added'), description: t('bonus_added_desc') });
    if(user) {
        const log: ActivityLog = { id: crypto.randomUUID(), userId: user.id, username: user.username, action: 'create', entity: 'Bonus', entityId: bonusData.id, description: `Added bonus for ${getEmployeeName(bonusData.employeeId)}`, timestamp: new Date().toISOString() };
        setActivityLogs(prev => [...prev, log]);
    }
  }, [selectedDate, setBonuses, toast, t, user, getEmployeeName, setActivityLogs]);

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
  
  return (
    <>
      <div className="hidden print:block">
        <ReportWrapper>
           { /* Content for printing, can be a simplified version */ }
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <AddBonusForm onAdd={handleAddBonus} />

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
                            dailyBonuses.map((record: Bonus) => (
                            <div key={record.id} className="py-3 flex justify-between items-start gap-4">
                                <>
                                    <div className="flex-1">
                                        <p className="flex items-center gap-2" dir={language === 'ku' ? 'rtl' : 'ltr'}><User className="h-4 w-4 text-primary" /> {getEmployeeName(record.employeeId, language === 'ku')}</p>
                                        <p className="text-sm text-muted-foreground">{record.loadCount} {t('loads')}</p>
                                        {record.notes && <p className="text-sm mt-1">{record.notes}</p>}
                                    </div>
                                    <div className='flex flex-col items-end'>
                                        <p className="font-semibold text-primary">{formatCurrency(record.totalAmount)}</p>
                                        {!isReadOnly && (
                                        <div className="flex gap-1 mt-1 print:hidden">
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
                                        )}
                                    </div>
                                </>
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
        </main>
      </div>
    </>
  );
}
