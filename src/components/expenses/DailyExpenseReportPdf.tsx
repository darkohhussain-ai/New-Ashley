
'use client';
import { Expense, AppSettings, Employee } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

type DailyExpenseReportPdfProps = {
  records: Expense[];
  date: Date;
  settings: AppSettings;
  getEmployeeName: (id: string, useKurdish?: boolean) => string;
};

export function DailyExpenseReportPdf({ records, date, settings, getEmployeeName }: DailyExpenseReportPdfProps) {
  const { t, language } = useTranslation();
  const useKurdish = language === 'ku';

  const { groupedExpenses, grandTotal } = useMemo(() => {
    const groups: Record<string, { employeeName: string; expenses: Expense[]; total: number }> = {};
    
    records.forEach(exp => {
      if (!groups[exp.employeeId]) {
        groups[exp.employeeId] = {
          employeeName: getEmployeeName(exp.employeeId, useKurdish),
          expenses: [],
          total: 0
        };
      }
      groups[exp.employeeId].expenses.push(exp);
      groups[exp.employeeId].total += exp.amount;
    });

    const grandTotal = records.reduce((sum, exp) => sum + exp.amount, 0);
    return { groupedExpenses: Object.values(groups), grandTotal };
  }, [records, getEmployeeName, useKurdish]);

  return (
    <ReportWrapper
      title={t('daily_expense_report')}
      date={format(date, 'PPPP')}
      logoSrc={settings.appLogo}
      themeColor={settings.pdfSettings.report.reportColors?.expense || '#3b82f6'}
    >
      <div className="space-y-4">
        {groupedExpenses.map(group => (
          <div key={group.employeeName} className="break-inside-avoid">
            <h3 className="text-base font-medium mb-2">{group.employeeName}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('expense_type')}</TableHead>
                  <TableHead>{t('notes')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.expenses.map(exp => (
                  <TableRow key={exp.id}>
                    <TableCell className="text-xs">{t(exp.expenseType.toLowerCase().replace(/[\s()]/g, '_'))}{exp.expenseSubType ? ` (${t(exp.expenseSubType.toLowerCase().replace(/\s/g, '_'))})` : ''}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exp.notes || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-bold">{t('total')}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(group.total)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ))}
        <div className="flex justify-end pt-4 border-t-2 border-primary">
          <div className="text-lg font-bold flex items-center gap-4">
              <span>{t('grand_total')}:</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    </ReportWrapper>
  );
}
