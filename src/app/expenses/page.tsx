
'use client';

import Link from 'next/link';
import { ArrowLeft, FilePlus, Archive, Calendar as CalendarIcon, BarChart2, PieChartIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useAppContext } from '@/context/app-provider';
import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};


export default function ExpensesDashboardPage() {
  const { t } = useTranslation();
  const { expenses } = useAppContext();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const isLoading = !expenses || !selectedDate;

  const monthlyTotals = useMemo(() => {
    if (isLoading) return { chartData: [], taxiSubTypeTotals: [] };

    const start = startOfMonth(selectedDate!);
    const end = endOfMonth(selectedDate!);

    const monthExpenses = expenses.filter(d => {
        if (!d.date) return false;
        try {
            const recordDate = parseISO(d.date);
            return isWithinInterval(recordDate, { start, end });
        } catch {
            return false;
        }
    });
    
    const taxiTotal = monthExpenses.filter(e => e.expenseType === 'Taxi Expenses').reduce((sum, item) => sum + item.amount, 0);
    const purchasesTotal = monthExpenses.filter(e => e.expenseType === 'Purchases (Buying Items)').reduce((sum, item) => sum + item.amount, 0);

    const taxiSubTypeMap: Record<string, number> = {};
    monthExpenses.filter(e => e.expenseType === 'Taxi Expenses' && e.expenseSubType).forEach(e => {
        taxiSubTypeMap[e.expenseSubType!] = (taxiSubTypeMap[e.expenseSubType!] || 0) + e.amount;
    });
    
    const taxiSubTypeTotals = Object.entries(taxiSubTypeMap).map(([name, total]) => ({name: t(name.toLowerCase().replace(/\s/g, '_')) || name, total})).sort((a,b) => b.total-a.total);

    const chartData = [
      { name: t('taxi_expenses'), total: taxiTotal, fill: 'hsl(var(--chart-1))' },
      { name: t('purchases_buying_items'), total: purchasesTotal, fill: 'hsl(var(--chart-2))' },
    ].filter(d => d.total > 0);

    return { 
      chartData,
      taxiSubTypeTotals
    };
  }, [isLoading, selectedDate, expenses, t]);
  
  const menuItems = [
    {
      title: t('add_daily_expense'),
      icon: FilePlus,
      href: "/expenses/add",
      color: "bg-blue-500",
    },
    {
      title: t('expense_report_archive'),
      icon: Archive,
      href: "/expenses/archive",
      color: "bg-teal-500",
    },
    {
      title: t('monthly_expense_report'),
      icon: CalendarIcon,
      href: "/expenses/monthly-report",
      color: "bg-orange-500",
    },
  ];


  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/ashley-expenses">
                <ArrowLeft />
                <span className="sr-only">{t('back_to_ashley_management')}</span>
              </Link>
            </Button>
            <h1 className="text-xl">{t('expense_management')}</h1>
          </div>
           <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-auto justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : <span>{t('pick_a_month')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
        </div>
      </header>
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto space-y-8'>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><PieChartIcon className="text-primary"/> {t('expense_types')}</CardTitle>
                    <CardDescription>{t('monthly_overview_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div className="h-[250px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : monthlyTotals.chartData.length > 0 ? (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={monthlyTotals.chartData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                       {monthlyTotals.chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                       ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value as number)}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                            <p>{t('no_data_for_selected_month')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><BarChart2 className="text-primary"/> {t('taxi_expenses')}</CardTitle>
                    <CardDescription>{t('taxi_expenses_breakdown_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div className="h-[250px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : monthlyTotals.taxiSubTypeTotals.length > 0 ? (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyTotals.taxiSubTypeTotals} layout="vertical">
                                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                                    <YAxis type="category" dataKey="name" stroke="#888888" tick={{fontSize: 10}} tickLine={false} axisLine={false} width={150} />
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Bar dataKey="total" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                         <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                            <p>{t('no_taxi_expenses_for_month')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

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
  );
}
