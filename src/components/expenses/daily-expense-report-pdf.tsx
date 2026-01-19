
'use client';
import { Employee, Expense, AllPdfSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

type DailyExpenseReportPdfProps = {
    date: Date;
    expensesByEmployee: { employee: Employee, expenses: Expense[], total: number }[];
    grandTotal: number;
    settings: AllPdfSettings['report'];
};

export function DailyExpenseReportPdf({ date, expensesByEmployee, grandTotal, settings }: DailyExpenseReportPdfProps) {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';

    return (
        <div className="bg-white text-black p-6" style={{ fontFamily: (settings.customFont && useKurdish) ? 'CustomPdfFont' : "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
            <ReportPdfHeader 
                title={t('daily_expense_report')} 
                subtitle={format(date, 'PPP')}
                logoSrc={settings.logo ?? null} 
                themeColor={settings.reportColors?.expense}
             />
             <div className="mt-6">
                {expensesByEmployee.map(({ employee, expenses, total }) => (
                    <div key={employee.id} className="mb-4">
                        <h3 className="font-bold text-lg mb-2" dir={useKurdish ? 'rtl' : 'ltr'}>
                            {useKurdish && employee.kurdishName ? employee.kurdishName : employee.name}
                        </h3>
                        <Table>
                            <TableHeader>
                                <TableRow style={{ backgroundColor: settings.reportColors?.expense || '#3b82f6', color: 'white' }}>
                                    <TableHead className="text-white">{t('expense_type')}</TableHead>
                                    <TableHead className="text-white">{t('notes')}</TableHead>
                                    <TableHead className="text-right text-white">{t('amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map(exp => (
                                    <TableRow key={exp.id}>
                                        <TableCell>{t(exp.expenseType.toLowerCase().replace(/[\s()]/g, '_'))}{exp.expenseSubType ? ` (${t(exp.expenseSubType.toLowerCase().replace(/\s/g, '_'))})` : ''}</TableCell>
                                        <TableCell>{exp.notes || t('na')}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={2} className="text-right font-bold">{t('total')}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                ))}
                 <div className="flex justify-end font-bold text-xl mt-6 pt-4 border-t">
                    <span>{t('grand_total')}:</span>
                    <span className="ml-4" style={{color: settings.reportColors?.expense || '#3b82f6'}}>{formatCurrency(grandTotal)}</span>
                </div>
             </div>
             <div className="pt-24 text-right">
                <div className="inline-block text-center mt-8">
                    <p className="border-t pt-2 w-48">{t('warehouse_manager_signature')}</p>
                </div>
            </div>
        </div>
    );
}

    
