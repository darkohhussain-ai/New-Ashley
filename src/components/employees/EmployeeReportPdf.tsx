
'use client';
import { Employee, Expense, Overtime, Bonus, CashWithdrawal, PdfSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar as CalendarIcon, Briefcase } from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};

type FinancialSectionProps = {
    title: string;
    items: any[];
    columns: string[];
    bodyMapper: (item: any) => (string | number)[];
    total: number;
    themeColor?: string;
}

const FinancialSection = ({ title, items, columns, bodyMapper, total, themeColor }: FinancialSectionProps) => {
    const { t } = useTranslation();
    if (items.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold mb-2" style={{ color: themeColor || '#111827' }}>{title}</h3>
            <Table>
                <TableHeader>
                    <TableRow style={{ backgroundColor: themeColor || '#f3f4f6' }}>
                        {columns.map(col => <TableHead key={col} className="text-white" style={{color: 'white'}}>{col}</TableHead>)}
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
                        <TableCell className="text-right font-bold" style={{ color: themeColor || '#111827' }}>{formatCurrency(total)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
};

type EmployeeReportPdfProps = {
    employee: Employee;
    settings: PdfSettings;
    expenses: { items: Expense[], total: number };
    overtime: { items: Overtime[], total: number };
    bonuses: { items: Bonus[], total: number };
    withdrawals: { items: CashWithdrawal[], total: number };
};

export function EmployeeReportPdf({ employee, settings, expenses, overtime, bonuses, withdrawals }: EmployeeReportPdfProps) {
    const { t, language } = useTranslation();
    const displayName = language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;

    return (
        <ReportWrapper
            title={t('employee_report')}
            date={`${t('for')} ${displayName}`}
            logoSrc={settings.logo ?? null}
            themeColor={settings.reportColors?.general || '#22c55e'}
        >
            <div className="p-4" dir={language === 'ku' ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-6 py-4 border-b">
                    <Avatar className="w-24 h-24 border-4 border-gray-200">
                        <AvatarImage src={employee.photoUrl} alt={employee.name} />
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <h2 className="text-2xl font-bold">{displayName}</h2>
                        <p className="text-gray-600 text-base">{employee.role || 'Employee'}</p>
                        <div className="mt-2 space-y-1.5 text-gray-700">
                            {employee.employeeId && <p className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> ID: {employee.employeeId}</p>}
                            {employee.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4"/> {employee.email}</p>}
                            {employee.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4"/> {employee.phone}</p>}
                            {employee.employmentStartDate && <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> {t('joined_on')}: {format(parseISO(employee.employmentStartDate), 'PPP')}</p>}
                        </div>
                    </div>
                </div>

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
            </div>
        </ReportWrapper>
    );
}
