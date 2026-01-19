

'use client';
import { ItemForTransfer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

export const StagedItemsPdf = ({ destination, items, logoSrc }: { destination: string, items: ItemForTransfer[], logoSrc: string | null }) => {
    const { t } = useTranslation();
    return (
        <ReportWrapper
            title={`${t('staged_items_for')} ${destination}`}
            date={format(new Date(), 'PPP')}
            logoSrc={logoSrc}
            themeColor="#f97316" // Orange
        >
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
        </ReportWrapper>
    );
};
