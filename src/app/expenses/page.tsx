
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, FilePlus, Archive, Calendar as CalendarIcon, PieChart as PieChartIcon, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#FF8042', '#00C49F', '#FFBB28'];

function ExpensesDashboardPage() {
    const { t } = useTranslation();
    const { expenses } = useAppContext();

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    
    const menuItems = [
        { title: t('add_daily_expense'), icon: FilePlus, href: "/expenses/add", color: "bg-blue-500" },
        { title: t('expense_report_archive'), icon: Archive, href: "/expenses/archive", color: "bg-teal-500" },
        { title: t('monthly_expense_report'), icon: CalendarIcon, href: "/expenses/monthly-report", color: "bg-orange-500" },
    ];

    const monthlyExpenseData = useMemo(() => {
        if (!expenses || !selectedDate) return { expenseTypeData: [] };

        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);

        const filteredExpenses = expenses.filter(e => e.date && isWithinInterval(parseISO(e.date), { start, end }));

        const expenseTypeSummary = filteredExpenses.reduce((acc, expense) => {
            let type = expense.expenseType || 'Uncategorized';
            if (type === 'Taxi Expenses' && expense.expenseSubType) {
                type = expense.expenseSubType;
            } else if (type === 'Taxi Expenses') {
                type = 'other_taxi';
            }
            acc[type] = (acc[type] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        const expenseTypeData = Object.entries(expenseTypeSummary).map(([name, value]) => ({
            name: t(name.toLowerCase().replace(/[\s()]/g, '_')) || name,
            value
        }));
        
        return { expenseTypeData };
    }, [expenses, selectedDate, t]);
    
    const grandTotal = useMemo(() => monthlyExpenseData.expenseTypeData.reduce((sum, item) => sum + item.value, 0), [monthlyExpenseData.expenseTypeData]);
    
    const handlePrint = () => window.print();

    const DashboardContent = () => (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon /> {t('expense_breakdown')}</CardTitle>
                <CardDescription>{t('monthly_overview_desc', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardDescription>
            </CardHeader>
            <CardContent>
                {monthlyExpenseData.expenseTypeData.length > 0 ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead className="w-[40%]">Visualization</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlyExpenseData.expenseTypeData.map((item, index) => {
                                const percentage = grandTotal > 0 ? (item.value / grandTotal) * 100 : 0;
                                return (
                                    <TableRow key={item.name} className="odd:bg-table-row-secondary even:bg-table-row-primary">
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{formatCurrency(item.value)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={percentage} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                     <div className="text-center py-16">
                        <p className="text-muted-foreground">{t('no_expenses_found_for_month', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : '' })}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
      <>
        <div className="hidden print:block">
            <ReportWrapper>
                <DashboardContent />
            </ReportWrapper>
        </div>

        <div className="h-screen bg-background text-foreground flex flex-col print:hidden">
            <header className="bg-card border-b p-4">
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/ashley-expenses"><ArrowLeft /></Link>
                        </Button>
                        <h1 className="text-xl">{t('expense_management')}</h1>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4"/> {t('print')}</Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </header>
            <main className='w-full p-4 md:p-8 flex-1 overflow-y-auto space-y-8'>
                 <DashboardContent />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                        <Link key={item.title} href={item.href} className="group block" passHref>
                            <Card className={cn("h-48 flex flex-col items-center justify-center text-white transition-transform transform hover:-translate-y-1 hover:shadow-xl", item.color)}>
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                <div className="p-4 bg-white/20 rounded-full mb-4">
                                    <item.icon className="w-8 h-8" />
                                </div>
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                            </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
      </>
    );
}

export default withAuth(ExpensesDashboardPage);
