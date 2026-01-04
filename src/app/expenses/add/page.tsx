
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, Calendar as CalendarIcon, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import type { Employee, Expense, ExpenseReport } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

type NewExpenseItem = Omit<Expense, 'id' | 'expenseReportId'> & { tempId: number };

export default function AddExpenseReportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { employees, expenses, setExpenses, expenseReports, setExpenseReports } = useAppContext();

  const [reportName, setReportName] = useState('');
  const [reportDate, setReportDate] = useState<Date | undefined>(undefined);
  const [items, setItems] = useState<NewExpenseItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Only set the date on the client-side
    setReportDate(new Date());
  }, []);

  const warehouseEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role !== 'Marketing').sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const handleAddItem = () => {
    setItems(prev => [...prev, { tempId: Date.now(), employeeId: '', amount: 0, notes: '' }]);
  };

  const handleItemChange = (index: number, field: keyof NewExpenseItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (tempId: number) => {
    setItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  const handleSaveReport = () => {
    if (!reportName.trim() || !reportDate || items.length === 0) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('missing_information_desc_expense') });
      return;
    }

    if (items.some(item => !item.employeeId || item.amount <= 0)) {
      toast({ variant: 'destructive', title: t('invalid_items'), description: t('invalid_items_desc') });
      return;
    }

    setIsSaving(true);
    const reportId = crypto.randomUUID();
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const newReport: ExpenseReport = {
      id: reportId,
      reportName,
      reportDate: formatISO(reportDate),
      totalAmount,
    };

    const newExpenseItems: Expense[] = items.map(item => {
      const { tempId, ...rest } = item;
      return {
        ...rest,
        id: crypto.randomUUID(),
        expenseReportId: reportId,
      };
    });

    setExpenseReports([...expenseReports, newReport]);
    setExpenses([...expenses, ...newExpenseItems]);

    toast({ title: t('report_saved'), description: t('report_saved_desc', {reportName}) });
    router.push('/expenses/archive');
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/expenses"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{t('new_expense_report')}</h1>
        </div>
        <Button onClick={handleSaveReport} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
          {t('save_report')}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('report_details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">{t('report_name')}</Label>
                <Input id="report-name" value={reportName} onChange={e => setReportName(e.target.value)} placeholder={t('report_name_placeholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('report_date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !reportDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportDate ? format(reportDate, 'PPP') : <span>{t('pick_a_date')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={reportDate} onSelect={setReportDate} /></PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('expense_items')}</CardTitle>
                <CardDescription>{t('expense_items_desc')}</CardDescription>
              </div>
              <Button variant="outline" onClick={handleAddItem}><Plus className="mr-2"/>{t('add_item')}</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('employee')}</TableHead>
                      <TableHead>{t('amount_iqd')}</TableHead>
                      <TableHead>{t('notes')}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length > 0 ? items.map((item, index) => (
                      <TableRow key={item.tempId}>
                        <TableCell className="min-w-[200px]">
                          <Select value={item.employeeId} onValueChange={v => handleItemChange(index, 'employeeId', v)}>
                            <SelectTrigger><SelectValue placeholder={t('select_an_employee')} /></SelectTrigger>
                            <SelectContent>
                              {warehouseEmployees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <Input type="number" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.valueAsNumber)} placeholder="0" />
                        </TableCell>
                        <TableCell className="min-w-[250px]">
                          <Textarea value={item.notes} onChange={e => handleItemChange(index, 'notes', e.target.value)} placeholder={t('notes_optional')} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.tempId)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">{t('no_expense_items_added')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
             <CardFooter className="justify-end font-bold text-lg bg-muted/50 p-4">
                {t('total')}: {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0))}
             </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
