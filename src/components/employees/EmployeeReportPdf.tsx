
'use client';
import { Employee, Expense, Overtime, Bonus, CashWithdrawal, PdfSettings } from '@/lib/types';
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
        <div className="mb-4">
            <h3 className="text-base font-medium mb-2 pb-1 border-b-2">{title}</h3>
            <Table className="pdf-table">
                <TableHeader>
                    <TableRow>
                        {columns.map(col => <TableHead key={col} className="text-[10px] py-1 h-auto">{col}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={item.id}>
                            {bodyMapper(item).map((cell, i) => <TableCell key={i} className="py-1 text-[10px] leading-snug">{cell}</TableCell>)}
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={columns.length - 1} className="text-right text-[10px] py-1 font-medium">{t('total')}</TableCell>
                        <TableCell className="text-center text-[10px] py-1 font-medium">{formatCurrency(total)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
};

const OvertimeTablePdf = ({ title, data, totalAmount, totalHours }: { title: string, data: Overtime[], totalAmount: number, totalHours: number }) => {
    const { t } = useTranslation();
    if (data.length === 0) return null;
    return (
        <div className="mb-4">
            <h3 className="text-base font-medium mb-2 pb-1 border-b-2">{title}</h3>
            <Table className="pdf-table">
                <TableHeader><TableRow>
                    <TableHead className="text-[10px] py-1 h-auto">{t('date')}</TableHead>
                    <TableHead className="text-[10px] py-1 h-auto">{t('overtime_hours')}</TableHead>
                    <TableHead className="text-[10px] py-1 h-auto">{t('notes')}</TableHead>
                    <TableHead className="text-right text-[10px] py-1 h-auto">{t('amount')}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="py-1 text-[10px] leading-snug">{item.date && !isNaN(parseISO(item.date).getTime()) ? format(parseISO(item.date), 'PP') : 'Invalid Date'}</TableCell>
                            <TableCell className="py-1 text-[10px] leading-snug">{item.hours.toFixed(2)}</TableCell>
                            <TableCell className="text-gray-600 py-1 text-[10px] leading-snug">{item.notes || 'N/A'}</TableCell>
                            <TableCell className="text-right py-1 text-[10px] leading-snug">{formatCurrency(item.totalAmount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter><TableRow>
                    <TableCell colSpan={1} className="text-right text-[10px] py-1 font-medium">{t('total')}</TableCell>
                    <TableCell className="text-center text-[10px] py-1 font-medium">{totalHours.toFixed(2)}</TableCell>
                    <TableCell colSpan={1}></TableCell>
                    <TableCell className="text-right text-[10px] py-1 font-medium">{formatCurrency(totalAmount)}</TableCell>
                </TableRow></TableFooter>
            </Table>
        </div>
    );
};

type EmployeeReportPdfProps = {
    employee: Employee;
    settings: PdfSettings;
    expenses: { items: Expense[], total: number };
    overtime: { items: Overtime[], total: number, totalHours: number };
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
            <div dir={language === 'ku' ? 'rtl' : 'ltr'}>
                <div className="flex items-start gap-4 p-2 rounded-lg bg-gray-50 border">
                    <Avatar className="w-20 h-20 border-2 border-white shadow-md">
                        <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] leading-snug flex-1">
                        <div>
                            <p className="text-[9px] text-gray-500">{t('name')}</p>
                            <p className="text-sm">{displayName}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500">{t('role_optional')}</p>
                            <p>{employee.role || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500">{t('id_colon')}</p>
                            <p>{employee.employeeId || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-[9px] text-gray-500">{t('joined_date')}</p>
                            <p>{employee.employmentStartDate && !isNaN(parseISO(employee.employmentStartDate).getTime()) ? format(parseISO(employee.employmentStartDate), 'PPP') : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500">{t('email_optional')}</p>
                            <p>{employee.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500">{t('phone_optional')}</p>
                            <p>{employee.phone || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <FinancialSection 
                        title={t('expenses')}
                        items={expenses.items}
                        columns={[t('date'), t('notes'), t('amount')]}
                        bodyMapper={(e: Expense) => [format(parseISO(e.date), 'PP'), e.notes || '', formatCurrency(e.amount)]}
                        total={expenses.total}
                        themeColor={settings.reportColors?.expense}
                    />
                     <OvertimeTablePdf
                        title={t('overtime')}
                        data={overtime.items}
                        totalAmount={overtime.total}
                        totalHours={overtime.totalHours}
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
