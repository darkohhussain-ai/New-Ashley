
'use client';
import { ItemForTransfer, Transfer, PdfSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import { format, parseISO } from 'date-fns';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { cn } from '@/lib/utils';

export const TransmitReportPdf = ({ transfer, items, settings, invoiceNumber, totalYearlyInvoices }: { 
    transfer: Partial<Transfer>; 
    items: ItemForTransfer[]; 
    settings: PdfSettings;
    invoiceNumber?: number;
    totalYearlyInvoices?: number;
}) => {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';
    
    const titleTemplate = settings.titleTemplate || t('INVOICE') + ' #{invoiceNumber}';
    const finalTitle = titleTemplate
        .replace('{city}', transfer.destinationCity || '')
        .replace('{invoiceNumber}', invoiceNumber ? String(invoiceNumber).padStart(6, '0') : 'N/A');

    return (
        <ReportWrapper
            title={finalTitle}
            date={transfer.transferDate}
        >
            <section className="grid grid-cols-2 gap-4 my-4 text-[10px] leading-snug">
                 <div>
                    <h3 className="text-gray-500 mb-1">{t('transmit_to')}</h3>
                    <p className="text-base">{transfer.destinationCity}</p>
                </div>
                 <div className={cn("text-right", useKurdish && "text-left")}>
                    <h3 className="text-gray-500 mb-1">{t('details')}</h3>
                    <p><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                    <p><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                    {totalYearlyInvoices && <p><strong>{t('slip_no')}:</strong> {totalYearlyInvoices}</p>}
                </div>
            </section>

            <main>
                <Table className="pdf-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px]">{t('no_dot')}</TableHead>
                            <TableHead>{t('model')}</TableHead>
                            <TableHead className="w-[50px]">{t('quantity')}</TableHead>
                            <TableHead>{t('invoice_no')}</TableHead>
                            <TableHead>{t('storage')}</TableHead>
                            <TableHead>{t('notes')}</TableHead>
                            <TableHead className="w-[80px]">{t('request_date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={item.id} className={cn(item.storage === 'Huana' && 'bg-yellow-100/70')}>
                                <TableCell className="py-1">{index + 1}</TableCell>
                                <TableCell className="py-1">{item.model}</TableCell>
                                <TableCell className="py-1">{item.quantity}</TableCell>
                                <TableCell className="py-1">{item.invoiceNo || 'N/A'}</TableCell>
                                <TableCell className="py-1">{item.storage || 'N/A'}</TableCell>
                                <TableCell className="text-gray-600 py-1 text-left">{item.notes || 'N/A'}</TableCell>
                                <TableCell className="py-1">{item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </main>
        </ReportWrapper>
    );
};
