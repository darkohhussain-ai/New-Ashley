
'use client';
import { Employee, Expense, Overtime, Bonus, CashWithdrawal, PdfSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar as CalendarIcon, Briefcase } from "lucide-react";


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
    const { t, language } = useTranslation();
    const displayName = language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;

    return (
       <ReportWrapper
            title={t('employee_report')}
            date={format(selectedDate, 'MMMM yyyy')}
            logoSrc={logoSrc}
            themeColor="#2563eb" // a default blue
       >
            <div className="flex items-start gap-6 py-4 px-4 border-b" dir={language === 'ku' ? 'rtl' : 'ltr'}>
                <Avatar className="w-24 h-24 border-4 border-gray-200">
                <AvatarImage src={employee.photoUrl} alt={employee.name} />
                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                    <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
                    <p className="text-gray-600 text-base">{employee.role || 'Employee'}</p>
                    <div className="mt-2 space-y-1.5 text-gray-700">
                        {employee.employeeId && <p className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> ID: {employee.employeeId}</p>}
                        {employee.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4"/> {employee.email}</p>}
                        {employee.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4"/> {employee.phone}</p>}
                        {employee.employmentStartDate && <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> {t('joined_on')}: {format(parseISO(employee.employmentStartDate), 'PPP')}</p>}
                    </div>
                </div>
            </div>
            <div className="mt-6 px-4">
                <FinancialTablePdf title={t('expenses')} data={financials.selected.expenses.items} total={financials.selected.expenses.total} />
                <FinancialTablePdf title={t('overtime')} data={financials.selected.overtime.items} total={financials.selected.overtime.total} />
                <FinancialTablePdf title={t('bonuses')} data={financials.selected.bonuses.items} total={financials.selected.bonuses.total} />
                <FinancialTablePdf title={t('cash_withdrawals')} data={financials.selected.withdrawals.items} total={financials.selected.withdrawals.total} />
            </div>
       </ReportWrapper>
    );
};
