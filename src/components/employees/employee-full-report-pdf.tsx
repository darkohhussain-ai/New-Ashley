

'use client';
import { EmployeeReportPdfHeader } from './employee-report-pdf-header';
import { Employee, Expense, Overtime, Bonus, CashWithdrawal, PdfSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

type EmployeeFullReportPdfProps = {
    employee: Employee;
    settings: PdfSettings;
    expenses: { items: Expense[], total: number };
    overtime: { items: Overtime[], total: number };
    bonuses: { items: Bonus[], total: number };
    withdrawals: { items: CashWithdrawal[], total: number };
};

const FinancialSection = ({ title, items, columns, bodyMapper, total, themeColor }: { title: string, items: any[], columns: string[], bodyMapper: (item: any) => any[], total: number, themeColor?: string }) => {
    const { t } = useTranslation();
    if (items.length === 0) return null;
    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
            <Table>
                <TableHeader>
                    <TableRow style={{ backgroundColor: themeColor || '#22c55e', color: 'white' }}>
                        {columns.map(col => <TableHead key={col} className="text-white">{col}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map(item => (
                        <TableRow key={item.id}>
                            {bodyMapper(item).map((cell, i) => <TableCell key={i}>{cell}</TableCell>)}
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={columns.length - 1} className="text-right font-bold">{t('total')}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
};

export function EmployeeFullReportPdf({ employee, settings, expenses, overtime, bonuses, withdrawals }: EmployeeFullReportPdfProps) {
    const { t } = useTranslation();

    return (
        <ReportWrapper
            title={t('employee_report')}
            date={`${t('for')} ${employee.name}`}
            logoSrc={settings.logo}
            themeColor={settings.reportColors?.general || '#22c55e'}
        >
             <div className="mt-6">
                <FinancialSection 
                    title={t('expenses')}
                    items={expenses.items}
                    columns={[t('date'), t('notes'), t('amount')]}
                    bodyMapper={(e: Expense) => [format(parseISO(e.date), 'PP'), e.notes || '', formatCurrency(e.amount)]}
                    total={expenses.total}
                    themeColor={settings.reportColors?.expense}
                />
                <FinancialSection 
                    title={t('overtime')}
                    items={overtime.items}
                    columns={[t('date'), 'Hours', t('amount')]}
                    bodyMapper={(o: Overtime) => [format(parseISO(o.date), 'PP'), o.hours.toFixed(2), formatCurrency(o.totalAmount)]}
                    total={overtime.total}
                     themeColor={settings.reportColors?.overtime}
                />
                 <FinancialSection 
                    title={t('bonuses')}
                    items={bonuses.items}
                    columns={[t('date'), 'Reason', t('amount')]}
                    bodyMapper={(b: Bonus) => [format(parseISO(b.date), 'PP'), b.notes || '', formatCurrency(b.totalAmount)]}
                    total={bonuses.total}
                    themeColor={settings.reportColors?.bonus}
                />
                 <FinancialSection 
                    title={t('cash_withdrawals')}
                    items={withdrawals.items}
                    columns={[t('date'), t('notes'), t('amount')]}
                    bodyMapper={(w: CashWithdrawal) => [format(parseISO(w.date), 'PP'), w.notes || '', formatCurrency(w.amount)]}
                    total={withdrawals.total}
                    themeColor={settings.reportColors?.withdrawal}
                />
            </div>
        </ReportWrapper>
    )
}
    
