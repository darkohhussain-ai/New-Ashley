
'use client';

import Link from 'next/link';
import { ArrowLeft, Plus, Calendar, Archive, Loader2, BarChart2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useAppContext } from '@/context/app-provider';
import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};


export default function BonusesDashboardPage() {
  const { t } = useTranslation();
  const { bonuses, employees } = useAppContext();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const isLoading = !bonuses || !employees || !selectedDate;

  const monthlyData = useMemo(() => {
    if (isLoading) return { summary: [], totalAmount: 0, chartData: [] };

    const start = startOfMonth(selectedDate!);
    const end = endOfMonth(selectedDate!);
    const filteredRecords = bonuses.filter(r => isWithinInterval(parseISO(r.date), { start, end }));

    const employeeTotals = new Map<string, number>();
    filteredRecords.forEach(record => {
      employeeTotals.set(record.employeeId, (employeeTotals.get(record.employeeId) || 0) + record.totalAmount);
    });

    const summary = Array.from(employeeTotals.entries()).map(([employeeId, totalAmount]) => {
      const employee = employees.find(e => e.id === employeeId);
      return {
        employeeName: employee ? employee.name : t('unknown'),
        totalAmount,
      }
    }).sort((a,b) => b.totalAmount - a.totalAmount);
    
    return { 
      summary, 
      totalAmount: summary.reduce((sum, item) => sum + item.totalAmount, 0),
      chartData: summary.map(s => ({ name: s.employeeName, [t('total_bonus')]: s.totalAmount }))
    };
  }, [isLoading, selectedDate, bonuses, employees, t]);

  
  const menuItems = [
    {
      title: t('add_daily_bonus'),
      icon: Plus,
      href: "/bonuses/add",
      color: "bg-blue-500",
    },
    {
      title: t('monthly_bonus_report'),
      icon: Calendar,
      href: "/bonuses/monthly-report",
      color: "bg-orange-500",
    },
    {
      title: t('bonuses_archive'),
      icon: Archive,
      href: "/bonuses/archive",
      color: "bg-teal-500",
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
            <h1 className="text-xl">{t('loading_unloading_bonus')}</h1>
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
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><BarChart2/> {t('monthly_overview')}</CardTitle>
                <CardDescription>{t('monthly_overview_desc', {month: selectedDate ? format(selectedDate, 'MMMM yyyy') : '...'})}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="h-[250px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : monthlyData.chartData.length > 0 ? (
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData.chartData}>
                                <XAxis dataKey="name" stroke="#888888" tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }} tickLine={false} axisLine={false} interval={0} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} cursor={{fill: 'hsl(var(--muted))'}} />
                                <Legend />
                                <Bar dataKey={t('total_bonus')} fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        <p>{t('no_data_for_selected_month')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
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
