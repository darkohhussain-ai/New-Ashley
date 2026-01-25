'use client';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import { AppSettings } from '@/lib/types';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);
};

type OvertimeReportPdfProps = {
    monthlyData: {
        summary: { employeeId: string; employeeName: string; totalAmount: number; totalHours: number; }[];
        totalAmount: number;
        totalHours: number;
    };
    settings: AppSettings;
    selectedDate: Date;
}

export const OvertimeReportPdf = ({ monthlyData, settings, selectedDate }: OvertimeReportPdfProps) => {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';

    return (
        <ReportWrapper
            title={t('monthly_overtime_report')}
            date={format(selectedDate, 'MMMM yyyy')}
            logoSrc={settings.pdfSettings.report.logo}
            themeColor={settings.pdfSettings.report.reportColors?.overtime}
        >
            <Table className="text-xs">
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('employee')}</TableHead>
                        <TableHead className="text-right">{t('total_hours')}</TableHead>
                        <TableHead className="text-right">{t('total_amount')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {monthlyData.summary.map(item => (
                        <TableRow key={item.employeeId}>
                            <TableCell dir={useKurdish ? 'rtl' : 'ltr'}>{item.employeeName}</TableCell>
                            <TableCell className="text-right">{item.totalHours.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell>{t('grand_total')}</TableCell>
                        <TableCell className="text-right">{monthlyData.totalHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-primary">{formatCurrency(monthlyData.totalAmount)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </ReportWrapper>
    );
};
