
'use client';
import { Employee, Expense, Overtime, Bonus, CashWithdrawal } from '@/lib/types';
import { AccountPdfCard } from './account-pdf-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

const FinancialTablePdf = ({ title, data, total }: { title: string, data: any[], total: number }) => {
    const { t } = useTranslation();
    if (data.length === 0) return null;
    return (
        <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
            <Table>
                <TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead>{t('notes')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{format(parseISO(item.date), 'PP')}</TableCell>
                            <TableCell className="text-gray-600">{item.notes || 'N/A'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount || item.totalAmount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter><TableRow><TableCell colSpan={2} className="text-right font-bold">{t('total')}</TableCell><TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell></TableRow></TableFooter>
            </Table>
        </div>
    );
};

export const AccountReportPdf = ({ employee, logoSrc, selectedDate, financials }: { employee: Employee, logoSrc: string | null, selectedDate: Date, financials: any }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white text-black p-6">
            <AccountPdfCard employee={employee} logoSrc={logoSrc} selectedDate={selectedDate} />
            <div className="mt-6">
                <FinancialTablePdf title={t('expenses')} data={financials.selected.expenses.items} total={financials.selected.expenses.total} />
                <FinancialTablePdf title={t('overtime')} data={financials.selected.overtime.items} total={financials.selected.overtime.total} />
                <FinancialTablePdf title={t('bonuses')} data={financials.selected.bonuses.items} total={financials.selected.bonuses.total} />
                <FinancialTablePdf title={t('cash_withdrawals')} data={financials.selected.withdrawals.items} total={financials.selected.withdrawals.total} />
            </div>
        </div>
    );
};
