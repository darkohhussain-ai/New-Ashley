'use client';

import Link from 'next/link';
import { CreditCard, Clock, Gift, Banknote, Settings, FileText, Calendar, Wallet, BarChart2, Loader2, Calendar as CalendarIcon, PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};


function AshleyExpensesDashboard() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { expenses, overtime, bonuses, withdrawals } = useAppContext();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const isLoading = !expenses || !overtime || !bonuses || !withdrawals || !selectedDate;

  const monthlyTotals = useMemo(() => {
    if (isLoading) return { expenses: 0, overtime: 0, bonuses: 0, withdrawals: 0, chartData: [], taxiSubTypeTotals: [] };

    const start = startOfMonth(selectedDate!);
    const end = endOfMonth(selectedDate!);

    const filterAndSum = (data: any[]) => {
      if (!data) return 0;
      return data
        .filter(d => d.date && isWithinInterval(parseISO(d.date), { start, end }))
        .reduce((sum, item) => sum + (item.totalAmount || item.amount || 0), 0);
    };

    const monthExpenses = expenses.filter(d => d.date && isWithinInterval(parseISO(d.date), { start, end }));
    const taxiTotal = monthExpenses.filter(e => e.expenseType === 'Taxi Expenses').reduce((sum, item) => sum + item.amount, 0);
    const purchasesTotal = monthExpenses.filter(e => e.expenseType === 'Purchases (Buying Items)').reduce((sum, item) => sum + item.amount, 0);

    const taxiSubTypeMap: Record<string, number> = {};
    monthExpenses.filter(e => e.expenseType === 'Taxi Expenses' && e.expenseSubType).forEach(e => {
        taxiSubTypeMap[e.expenseSubType!] = (taxiSubTypeMap[e.expenseSubType!] || 0) + e.amount;
    });
    
    const taxiSubTypeTotals = Object.entries(taxiSubTypeMap).map(([name, total]) => ({name, total})).sort((a,b) => b.total-a.total);
    

    const expensesTotal = filterAndSum(expenses);
    const overtimeTotal = filterAndSum(overtime);
    const bonusesTotal = filterAndSum(bonuses);
    const withdrawalsTotal = filterAndSum(withdrawals);

    const chartData = [
      { name: t('taxi_expenses'), total: taxiTotal, fill: 'hsl(var(--chart-1))' },
      { name: t('purchases_buying_items'), total: purchasesTotal, fill: 'hsl(var(--chart-2))' },
    ].filter(d => d.total > 0);

    return { 
      expenses: expensesTotal, 
      overtime: overtimeTotal, 
      bonuses: bonusesTotal, 
      withdrawals: withdrawalsTotal,
      chartData,
      taxiSubTypeTotals
    };
  }, [isLoading, selectedDate, expenses, overtime, bonuses, withdrawals, t]);

  const menuItems = [
    {
      title: t('expenses'),
      icon: FileText,
      href: "/expenses",
      textColor: "text-blue-500",
      permission: 'page:ashley-expenses:expenses',
      total: monthlyTotals.expenses
    },
    {
      title: t('overtime'),
      icon: Clock,
      href: "/overtime",
      textColor: "text-orange-500",
      permission: 'page:ashley-expenses:overtime',
      total: monthlyTotals.overtime
    },
    {
      title: t('bonuses'),
      icon: Gift,
      href: "/bonuses",
      textColor: "text-yellow-500",
      permission: 'page:ashley-expenses:bonuses',
      total: monthlyTotals.bonuses
    },
    {
      title: t('cash_withdrawals'),
      icon: Banknote,
      href: "/cash-withdrawal",
      textColor: "text-rose-500",
      permission: 'page:ashley-expenses:withdrawals',
      total: monthlyTotals.withdrawals
    },
    {
        title: t('monthly_reports'),
        icon: Calendar,
        href: "/monthly-report",
        textColor: "text-teal-500",
        permission: 'page:ashley-expenses:reports',
        total: null
    },
    {
      title: t('settings'),
      icon: Settings,
      href: "/ashley-expenses-settings",
      textColor: "text-gray-500",
      permission: 'page:ashley-expenses:settings',
      total: null
    }
  ];

  if (isLoading) {
      return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto'>
         <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h1 className="text-xl">{t('ashley_employees_management')}</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><PieChartIcon className="text-primary"/> {t('expense_types')}</CardTitle>
                    <CardDescription>{t('monthly_overview_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {monthlyTotals.chartData.length > 0 ? (
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
                    {monthlyTotals.taxiSubTypeTotals.length > 0 ? (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyTotals.taxiSubTypeTotals} layout="vertical">
                                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                                    <YAxis type="category" dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={150} />
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
          {menuItems.filter(item => hasPermission(item.permission)).map((item) => (
            <Link key={item.title} href={item.href} className="group block" passHref>
                <Card className="h-48 flex flex-col justify-between p-6 transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-primary/50">
                    <div>
                        <item.icon className={cn("w-8 h-8 mb-4", item.textColor)} />
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                     {item.total !== null && (
                        <div className="text-right">
                           <p className="text-2xl font-bold">{formatCurrency(item.total)}</p>
                           <p className="text-xs text-muted-foreground">{t('for_month', { month: selectedDate ? format(selectedDate, 'MMMM') : '' })}</p>
                        </div>
                    )}
                </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default withAuth(AshleyExpensesDashboard);
