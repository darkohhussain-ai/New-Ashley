'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Clock, Gift, Banknote, Settings, FileText, Calendar, Wallet, BarChart, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
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

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const menuItems = [
    { title: t('expenses'), icon: FileText, href: "/expenses", permission: 'page:ashley-expenses:expenses' },
    { title: t('overtime'), icon: Clock, href: "/overtime", permission: 'page:ashley-expenses:overtime' },
    { title: t('bonuses'), icon: Gift, href: "/bonuses", permission: 'page:ashley-expenses:bonuses' },
    { title: t('cash_withdrawals'), icon: Banknote, href: "/cash-withdrawal", permission: 'page:ashley-expenses:withdrawals' },
    { title: t('monthly_reports'), icon: Calendar, href: "/monthly-report", permission: 'page:ashley-expenses:reports' },
    { title: t('settings'), icon: Settings, href: "/ashley-expenses-settings", permission: 'page:ashley-expenses:settings' }
  ];
  
  const monthlyTotals = useMemo(() => {
    if (!selectedDate) return { expenses: 0, overtime: 0, bonuses: 0, withdrawals: 0 };
    
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filterAndSum = (data: any[], amountField: string) => {
        return data.filter(d => d.date && isWithinInterval(parseISO(d.date), { start, end }))
                   .reduce((sum, item) => sum + (item[amountField] || 0), 0);
    }
    
    return {
        expenses: filterAndSum(expenses, 'amount'),
        overtime: filterAndSum(overtime, 'totalAmount'),
        bonuses: filterAndSum(bonuses, 'totalAmount'),
        withdrawals: filterAndSum(withdrawals, 'amount'),
    }
  }, [selectedDate, expenses, overtime, bonuses, withdrawals]);
  
  const chartData = [
      { name: t('expenses'), total: monthlyTotals.expenses, fill: 'hsl(var(--chart-1))' },
      { name: t('overtime'), total: monthlyTotals.overtime, fill: 'hsl(var(--chart-2))' },
      { name: t('bonuses'), total: monthlyTotals.bonuses, fill: 'hsl(var(--chart-3))' },
      { name: t('cash_withdrawals'), total: monthlyTotals.withdrawals, fill: 'hsl(var(--chart-4))' },
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
       <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl">{t('ashley_employees_management')}</h1>
          </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-48 justify-start text-left", !selectedDate && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
              </PopoverContent>
            </Popover>
        </div>
      </header>
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto'>
         <Card className="mb-8">
            <CardHeader>
                <CardTitle>{t('monthly_overview')}</CardTitle>
                <CardDescription>{t('monthly_overview_desc', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value)}`}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: 'hsl(var(--muted))'}}/>
                        <Legend />
                        <Bar dataKey="total" name="Total Amount" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </CardContent>
         </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.filter(item => hasPermission(item.permission)).map((item) => (
            <Link key={item.title} href={item.href} className="group block" passHref>
                <Card className="h-48 flex flex-col justify-between p-6 transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-primary/50">
                    <div>
                        <item.icon className={cn("w-8 h-8 mb-4 text-primary")} />
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default withAuth(AshleyExpensesDashboard);
