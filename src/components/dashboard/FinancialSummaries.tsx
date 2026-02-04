
'use client';

import { useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Clock, Gift, Banknote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const SummaryCard = ({ title, value, Icon, color }: { title: string, value: number, Icon: LucideIcon, color: string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color }} />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(value)}</div>
            <Progress value={(value / 1000000) * 100} className="h-2 mt-2" indicatorClassName="bg-primary" style={{ backgroundColor: color }} />
        </CardContent>
    </Card>
);

export function FinancialSummaries() {
  const { t } = useTranslation();
  const { expenses, overtime, bonuses, withdrawals, settings } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const monthlyTotals = useMemo(() => {
    if (!selectedDate) return { expenses: 0, overtime: 0, bonuses: 0, withdrawals: 0 };
    
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
  
  const colors = settings.pdfSettings.report.reportColors;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title={t('expenses')} value={monthlyTotals.expenses} Icon={DollarSign} color={colors?.expense || 'hsl(var(--chart-1))'} />
        <SummaryCard title={t('overtime')} value={monthlyTotals.overtime} Icon={Clock} color={colors?.overtime || 'hsl(var(--chart-2))'} />
        <SummaryCard title={t('bonuses')} value={monthlyTotals.bonuses} Icon={Gift} color={colors?.bonus || 'hsl(var(--chart-3))'} />
        <SummaryCard title={t('cash_withdrawals')} value={monthlyTotals.withdrawals} Icon={Banknote} color={colors?.withdrawal || 'hsl(var(--chart-4))'} />
    </div>
  );
}
