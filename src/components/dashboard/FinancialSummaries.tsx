
'use client';

import { useMemo } from 'react';
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

const SummaryCard = ({ title, value, Icon, color, progressColor }: { title: string, value: number, Icon: LucideIcon, color: string, progressColor: string }) => (
    <Card className="transition-all hover:-translate-y-1 hover:shadow-md h-full flex flex-col border-none shadow-sm">
        <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 opacity-70">
                <div className="p-2 rounded-lg bg-muted text-foreground">
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow pt-0 flex flex-col justify-end">
            <div className="space-y-3">
                <div className="text-2xl font-bold">{formatCurrency(value)}</div>
                <Progress 
                    value={Math.min((value / 1000000) * 100, 100)} 
                    className="h-1.5" 
                    indicatorClassName={progressColor}
                />
            </div>
        </CardContent>
    </Card>
);

export function FinancialSummaries() {
  const { t } = useTranslation();
  const { expenses, overtime, bonuses, withdrawals } = useAppContext();
  const now = new Date();

  const monthlyTotals = useMemo(() => {
    const start = startOfMonth(now);
    const end = endOfMonth(now);

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
  }, [expenses, overtime, bonuses, withdrawals]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
            title={t('expenses')} 
            value={monthlyTotals.expenses} 
            Icon={DollarSign} 
            color="#3b82f6" 
            progressColor="bg-blue-500" 
        />
        <SummaryCard 
            title={t('overtime')} 
            value={monthlyTotals.overtime} 
            Icon={Clock} 
            color="#f97316" 
            progressColor="bg-orange-500" 
        />
        <SummaryCard 
            title={t('bonuses')} 
            value={monthlyTotals.bonuses} 
            Icon={Gift} 
            color="#a855f7" 
            progressColor="bg-purple-500" 
        />
        <SummaryCard 
            title={t('cash_withdrawals')} 
            value={monthlyTotals.withdrawals} 
            Icon={Banknote} 
            color="#ef4444" 
            progressColor="bg-red-500" 
        />
    </div>
  );
}
