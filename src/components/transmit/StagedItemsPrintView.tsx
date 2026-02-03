
'use client';
import { ItemForTransfer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { format } from 'date-fns';

export const StagedItemsPrintView = ({ destination, items }: { destination: string; items: ItemForTransfer[] }) => {
    const { t } = useTranslation();

    return (
        <ReportWrapper
            title={`${t('staged_items_for')} ${destination}`}
            date={format(new Date(), 'PPP')}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('model')}</TableHead>
                        <TableHead className="text-center">{t('quantity')}</TableHead>
                        <TableHead>{t('invoice_no')}</TableHead>
                        <TableHead>{t('storage')}</TableHead>
                        <TableHead>{t('notes')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.model}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell>{item.invoiceNo || 'N/A'}</TableCell>
                            <TableCell>{item.storage || 'N/A'}</TableCell>
                            <TableCell className="text-muted-foreground">{item.notes || t('na')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ReportWrapper>
    );
};
