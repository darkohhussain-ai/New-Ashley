'use client';
import { Employee, Expense, Overtime, Bonus, CashWithdrawal, PdfSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

const FinancialTablePdf = ({ title, data, total }: { title: string, data: any[], total: number }) => {
    const { t } = useTranslation();
    if (data.length === 0) return null;
    return (
        <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 pb-1 border-b-2">{title}</h3>
            <Table>
                <TableHeader><TableRow><TableHead>{t('date')}</TableHead><TableHead>{t('notes')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader>
                <TableBody>
                    {data.map((item, index) => (
                        <TableRow key={item.id}>
                            <TableCell className="py-2">{item.date && !isNaN(parseISO(item.date).getTime()) ? format(parseISO(item.date), 'PP') : 'Invalid Date'}</TableCell>
                            <TableCell className="text-gray-600 py-2">{item.notes || 'N/A'}</TableCell>
                            <TableCell className="text-right py-2">{formatCurrency(item.amount || item.totalAmount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter><TableRow><TableCell colSpan={2} className="text-right font-medium">{t('total')}</TableCell><TableCell className="text-right font-medium">{formatCurrency(total)}</TableCell></TableRow></TableFooter>
            </Table>
        </div>
    );
};

const OvertimeTablePdf = ({ title, data, total }: { title: string, data: Overtime[], total: number }) => {
    const { t } = useTranslation();
    if (data.length === 0) return null;
    return (
        <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 pb-1 border-b-2">{title}</h3>
            <Table>
                <TableHeader><TableRow>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('overtime_hours')}</TableHead>
                    <TableHead>{t('notes')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="py-2">{item.date && !isNaN(parseISO(item.date).getTime()) ? format(parseISO(item.date), 'PP') : 'Invalid Date'}</TableCell>
                            <TableCell className="py-2">{item.hours.toFixed(2)}</TableCell>
                            <TableCell className="text-gray-600 py-2">{item.notes || 'N/A'}</TableCell>
                            <TableCell className="text-right py-2">{formatCurrency(item.totalAmount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter><TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">{t('total')}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(total)}</TableCell>
                </TableRow></TableFooter>
            </Table>
        </div>
    );
};

export const AccountReportPdf = ({ employee, selectedDate, financials, logoSrc }: { employee: Employee, selectedDate: Date, financials: any, logoSrc: string | null }) => {
    const { t, language } = useTranslation();
    const displayName = language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;
    const reportDate = selectedDate ? format(selectedDate, 'MMMM yyyy') : format(new Date(), 'MMMM yyyy');

    return (
       <ReportWrapper>
            <div dir={language === 'ku' ? 'rtl' : 'ltr'}>
                <div className="flex items-start gap-6 p-4 rounded-lg bg-gray-50 border">
                    <Avatar className="w-28 h-28 border-4 border-white shadow-md">
                        <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm flex-1">
                        <div>
                            <p className="text-xs text-gray-500">{t('name')}</p>
                            <p className="text-lg">{displayName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('role_optional')}</p>
                            <p>{employee.role || 'Employee'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('id_colon')}</p>
                            <p>{employee.employeeId || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-xs text-gray-500">{t('joined_date')}</p>
                            <p>{employee.employmentStartDate && !isNaN(parseISO(employee.employmentStartDate).getTime()) ? format(parseISO(employee.employmentStartDate), 'PPP') : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('email_optional')}</p>
                            <p>{employee.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('phone_optional')}</p>
                            <p>{employee.phone || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            
                <div className="mt-8">
                    <FinancialTablePdf title={t('expenses')} data={financials.selected.expenses.items} total={financials.selected.expenses.total} />
                    <OvertimeTablePdf title={t('overtime')} data={financials.selected.overtime.items} total={financials.selected.overtime.total} />
                    <FinancialTablePdf title={t('bonuses')} data={financials.selected.bonuses.items} total={financials.selected.bonuses.total} />
                    <FinancialTablePdf title={t('cash_withdrawals')} data={financials.selected.withdrawals.items} total={financials.selected.withdrawals.total} />
                </div>
            </div>
       </ReportWrapper>
    );
};
