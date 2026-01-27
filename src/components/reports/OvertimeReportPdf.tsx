
'use client';
import { Overtime, AppSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

export const OvertimeReportPdf = ({ records, date, settings, getEmployeeName }: { records: Overtime[], date: Date, settings: AppSettings, getEmployeeName: (id: string, useKurdish?: boolean) => string }) => {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';

    const { totalHours, totalAmount } = useMemo(() => {
        return records.reduce(
            (acc, record) => {
                acc.totalHours += record.hours;
                acc.totalAmount += record.totalAmount;
                return acc;
            }, { totalHours: 0, totalAmount: 0 });
    }, [records]);

    return (
        <div className="bg-white text-black p-8 font-sans" style={{ fontFamily: settings.fontFamily || 'Arial' }} dir={useKurdish ? 'rtl' : 'ltr'}>
            {settings?.printHeaderImage && (
                <div className="relative w-full h-28 mb-6">
                    <img src={settings.printHeaderImage} alt="Report Header" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                </div>
            )}

            <div className="text-center my-8">
                <h1 className="text-2xl font-bold" style={{ color: settings.pdfSettings.report.reportColors?.overtime || '#f97316' }}>
                    {t('daily_overtime_report')}
                </h1>
                <p className="text-gray-500 mt-1">{format(date, 'PPPP')}</p>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('employee')}</TableHead>
                        <TableHead className="text-center">{t('overtime_hours')}</TableHead>
                        <TableHead className="text-center">{t('salary')}</TableHead>
                        <TableHead>{t('notes')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map(record => (
                        <TableRow key={record.id}>
                            <TableCell>{getEmployeeName(record.employeeId, useKurdish)}</TableCell>
                            <TableCell className="text-center">{record.hours.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{formatCurrency(record.totalAmount)}</TableCell>
                            <TableCell>{record.notes || t('na')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="bg-gray-100 font-bold">
                        <TableCell>{t('total')}</TableCell>
                        <TableCell className="text-center">{totalHours.toFixed(2)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(totalAmount)}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
            
            {settings?.printFooterImage && (
                <div className="relative w-full h-28 mt-10">
                    <img src={settings.printFooterImage} alt="Report Footer" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                </div>
            )}
        </div>
    );
};
