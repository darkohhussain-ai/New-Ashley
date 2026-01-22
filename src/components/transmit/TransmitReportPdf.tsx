
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
    
    const formattedDate = transfer.transferDate ? format(parseISO(transfer.transferDate), 'PPP') : 'N/A';
    const qrCodeData = (typeof window !== 'undefined' && transfer.id) ? `${window.location.origin}/transmit/archive/${transfer.id}` : '';
    const finalTitle = `${t('INVOICE')} #${invoiceNumber ? String(invoiceNumber).padStart(6, '0') : 'N/A'}`;

    return (
        <ReportWrapper
            title={finalTitle}
            date={formattedDate}
            logoSrc={settings.logo}
            themeColor={(transfer.destinationCity && settings.branchColors?.[transfer.destinationCity as keyof typeof settings.branchColors]) || settings.themeColor}
            qrCodeData={qrCodeData}
        >
            <section className="grid grid-cols-2 gap-8 my-6 text-sm">
                 <div>
                    <h3 className="font-semibold text-gray-500 mb-1">{t('transmit_to')}</h3>
                    <p className="font-bold text-lg">{transfer.destinationCity}</p>
                </div>
                 <div className={cn("text-right", useKurdish && "text-left")}>
                    <h3 className="font-semibold text-gray-500 mb-1">{t('details')}</h3>
                    <p><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                    <p><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                    <p><strong>{t('slip_no')}:</strong> {totalYearlyInvoices}</p>
                </div>
            </section>

            <main>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100">
                            <TableHead className="w-[40px]">No.</TableHead>
                            <TableHead>{t('model')}</TableHead>
                            <TableHead className="w-[60px] text-center">{t('quantity')}</TableHead>
                            <TableHead>{t('invoice_no')}</TableHead>
                            <TableHead>{t('storage')}</TableHead>
                            <TableHead>{t('notes')}</TableHead>
                            <TableHead className="w-[100px] text-right">{t('request_date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={item.id} className={cn('text-xs', settings.tableTheme === 'striped' && 'odd:bg-gray-50', item.storage === 'Huana' && 'bg-yellow-100')}>
                                <TableCell className="text-center py-1">{index + 1}</TableCell>
                                <TableCell className="font-semibold py-1">{item.model}</TableCell>
                                <TableCell className="text-center py-1">{item.quantity}</TableCell>
                                <TableCell className="py-1">{item.invoiceNo || 'N/A'}</TableCell>
                                <TableCell className="py-1">{item.storage || 'N/A'}</TableCell>
                                <TableCell className="text-gray-600 py-1">{item.notes || 'N/A'}</TableCell>
                                <TableCell className="text-right py-1">{item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </main>
        </ReportWrapper>
    );
};
