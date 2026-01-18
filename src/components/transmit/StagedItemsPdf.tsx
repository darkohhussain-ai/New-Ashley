'use client';
import { ItemForTransfer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportPdfHeader } from '@/components/reports/report-pdf-header';

export const StagedItemsPdf = ({ destination, items, logoSrc }: { destination: string, items: ItemForTransfer[], logoSrc: string | null }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white text-black p-6">
            <ReportPdfHeader 
                title={`${t('staged_items_for')} ${destination}`}
                subtitle={`${t('report_date')}: ${format(new Date(), 'PPP')}`}
                logoSrc={logoSrc}
                themeColor="#f97316" // Orange
            />
            <div className="mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('model')}</TableHead>
                            <TableHead className="w-24">{t('quantity')}</TableHead>
                            <TableHead>{t('notes')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.model}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.notes || t('na')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <div className="pt-24 text-right">
                <div className="inline-block text-center mt-8">
                    <p className="border-t border-gray-400 pt-2 w-48 text-sm text-gray-700">{t('warehouse_manager_signature')}</p>
                </div>
            </div>
        </div>
    );
};
