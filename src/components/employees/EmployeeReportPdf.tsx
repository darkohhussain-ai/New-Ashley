
'use client';
import { Employee, Expense, Overtime, Bonus, CashWithdrawal, AppSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
            <h3 className="text-lg font-bold mb-2 pb-1 border-b-2" style={{ borderColor: themeColor || '#e5e7eb' }}>{title}</h3>
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-100">
                        {columns.map(col => <TableHead key={col} className="text-xs">{col}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={item.id} className={'odd:bg-gray-50'}>
                            {bodyMapper(item).map((cell, i) => <TableCell key={i} className="py-1 text-xs">{cell}</TableCell>)}
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="bg-gray-200">
                        <TableCell colSpan={columns.length - 1} className="text-right font-bold text-xs">{t('total')}</TableCell>
                        <TableCell className="text-right font-bold text-xs">{formatCurrency(total)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
};

type EmployeeReportPdfProps = {
    employee: Employee;
    settings: AppSettings['pdfSettings'];
    expenses: { items: Expense[], total: number };
    overtime: { items: Overtime[], total: number };
    bonuses: { items: Bonus[], total: number };
    withdrawals: { items: CashWithdrawal[], total: number };
};

export function EmployeeReportPdf({ employee, settings, expenses, overtime, bonuses, withdrawals }: EmployeeReportPdfProps) {
    const { t, language } = useTranslation();
    const displayName = language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;
    const qrCodeData = (typeof window !== 'undefined' && employee.id) ? `${window.location.origin}/employees?selected=${employee.id}` : '';

    return (
        <ReportWrapper
            title={t('employee_report')}
            date={`${t('for')} ${displayName}`}
            logoSrc={settings.report.logo ?? null}
            themeColor={settings.report.reportColors?.general || '#22c55e'}
            qrCodeData={qrCodeData}
        >
            <div dir={language === 'ku' ? 'rtl' : 'ltr'}>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border">
                    <Avatar className="w-24 h-24 border-2 border-white shadow-md">
                        <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs flex-1">
                        <div>
                            <p className="text-[10px] text-gray-500">{t('name')}</p>
                            <p className="font-bold text-base">{displayName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500">{t('role_optional')}</p>
                            <p className="font-semibold">{employee.role || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500">{t('id_colon')}</p>
                            <p className="font-semibold">{employee.employeeId || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-[10px] text-gray-500">{t('joined_date')}</p>
                            <p className="font-semibold">{employee.employmentStartDate ? format(parseISO(employee.employmentStartDate), 'PPP') : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500">{t('email_optional')}</p>
                            <p className="font-semibold">{employee.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500">{t('phone_optional')}</p>
                            <p className="font-semibold">{employee.phone || 'N/A'}</p>
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
                        themeColor={settings.report.reportColors?.expense}
                    />
                     <FinancialSection 
                        title={t('overtime')}
                        items={overtime.items}
                        columns={[t('date'), 'Hours', t('amount')]}
                        bodyMapper={(o: Overtime) => [format(parseISO(o.date), 'PP'), o.hours.toFixed(2), formatCurrency(o.totalAmount)]}
                        total={overtime.total}
                        themeColor={settings.report.reportColors?.overtime}
                    />
                    <FinancialSection 
                        title={t('bonuses')}
                        items={bonuses.items}
                        columns={[t('date'), 'Reason', t('amount')]}
                        bodyMapper={(b: Bonus) => [format(parseISO(b.date), 'PP'), b.notes || '', formatCurrency(b.totalAmount)]}
                        total={bonuses.total}
                        themeColor={settings.report.reportColors?.bonus}
                    />
                    <FinancialSection 
                        title={t('cash_withdrawals')}
                        items={withdrawals.items}
                        columns={[t('date'), t('notes'), t('amount')]}
                        bodyMapper={(w: CashWithdrawal) => [format(parseISO(w.date), 'PP'), w.notes || '', formatCurrency(w.amount)]}
                        total={withdrawals.total}
                        themeColor={settings.report.reportColors?.withdrawal}
                    />
                </div>
            </div>
        </ReportWrapper>
    );
}
