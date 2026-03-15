
'use client';

import { useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, FileChartLine } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function MonthlyFinancialChart() {
  const { t } = useTranslation();
  const { expenses, overtime, bonuses, withdrawals, settings } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthlyTotals = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filterAndSum = (data: any[], amountField: string) => {
        if (!data) return 0;
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

  const chartData = useMemo(() => [
      { name: t('expenses'), total: monthlyTotals.expenses, fill: '#3b82f6' },
      { name: t('overtime'), total: monthlyTotals.overtime, fill: '#f97316' },
      { name: t('bonuses'), total: monthlyTotals.bonuses, fill: '#a855f7' },
      { name: t('cash_withdrawals'), total: monthlyTotals.withdrawals, fill: '#ef4444' },
  ], [t, monthlyTotals]);

  const hasData = useMemo(() => chartData.some(d => d.total > 0), [chartData]);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileChartLine className="w-5 h-5 text-primary" />
            {t('monthly_overview')}
          </CardTitle>
          <CardDescription>{t('monthly_overview_desc', { month: format(selectedDate, 'MMMM yyyy') })}</CardDescription>
        </div>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"} size="sm" className={cn("w-40 justify-start text-left font-normal bg-background")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "MMMM yyyy")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
            </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="p-6">
        {hasData ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                    <Tooltip 
                        formatter={(value: number) => formatCurrency(value)} 
                        cursor={{ fill: 'hsl(var(--accent))' }} 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))'
                        }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex h-[300px] flex-col items-center justify-center space-y-3">
                <CalendarIcon className="w-10 h-10 text-muted-foreground opacity-20" />
                <p className="text-sm font-medium text-muted-foreground">
                    {t('no_records_found_for_month', { month: format(selectedDate, 'MMMM yyyy') })}
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
