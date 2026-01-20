'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Archive, BarChart as BarChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import withAuth from '@/hooks/withAuth';
import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-provider';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

function OvertimeDashboardPage() {
  const { t } = useTranslation();
  const { overtime, employees } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const menuItems = [
    { title: t('add_daily_overtime'), icon: Clock, href: "/overtime/add", color: "bg-blue-500" },
    { title: t('monthly_overtime_report'), icon: Calendar, href: "/overtime/monthly-report", color: "bg-orange-500" },
    { title: t('overtime_archive'), icon: Archive, href: "/overtime/archive", color: "bg-teal-500" },
  ];
  
  const monthlyData = useMemo(() => {
    if (!overtime || !employees || !selectedDate) return [];

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    const filteredRecords = overtime.filter(r => r.date && isWithinInterval(parseISO(r.date), { start, end }));
    
    const employeeTotals = new Map<string, { totalAmount: number; totalHours: number }>();
    filteredRecords.forEach(record => {
      const current = employeeTotals.get(record.employeeId) || { totalAmount: 0, totalHours: 0 };
      current.totalAmount += record.totalAmount;
      current.totalHours += record.hours;
      employeeTotals.set(record.employeeId, current);
    });

    return Array.from(employeeTotals.entries()).map(([employeeId, totals]) => ({
      employeeName: employees.find(e => e.id === employeeId)?.name || t('unknown'),
      ...totals
    })).sort((a,b) => b.totalAmount - a.totalAmount);
  }, [overtime, employees, selectedDate, t]);


  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/ashley-expenses"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-xl">{t('employee_overtime')}</h1>
            </div>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-48 justify-start text-left", !selectedDate && "text-muted-foreground")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
                </PopoverContent>
            </Popover>
        </div>
      </header>
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto space-y-8'>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChartIcon /> {t('overtime_summary')}</CardTitle>
                <CardDescription>{t('monthly_overview_desc', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardDescription>
            </CardHeader>
            <CardContent>
                {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <XAxis dataKey="employeeName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value)}`} />
                            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                            <Tooltip formatter={(value, name) => name === 'totalAmount' ? formatCurrency(value as number) : `${(value as number).toFixed(2)}h`} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="totalAmount" name="Total Amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="totalHours" name="Total Hours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">{t('no_overtime_found_for_month', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : '' })}</p>
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

export default withAuth(OvertimeDashboardPage);
