
'use client';
import { ItemForTransfer, Transfer, PdfSettings, BranchColors } from '@/lib/types';
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
    
    const titleTemplate = settings.titleTemplate || t('INVOICE') + ' #{invoiceNumber}';
    const finalTitle = titleTemplate
        .replace('{city}', transfer.destinationCity || '')
        .replace('{invoiceNumber}', invoiceNumber ? String(invoiceNumber).padStart(6, '0') : 'N/A');

    const themeColor = (transfer.destinationCity && (settings.branchColors as BranchColors)?.[transfer.destinationCity as keyof BranchColors]) || settings.themeColor;

    return (
        <ReportWrapper
            title={finalTitle}
            date={formattedDate}
            logoSrc={settings.logo}
            themeColor={themeColor}
        >
            <section className="grid grid-cols-2 gap-4 my-4 text-[10px] leading-snug">
                 <div>
                    <h3 className="font-semibold text-gray-500 mb-1">{t('transmit_to')}</h3>
                    <p className="font-bold text-base">{transfer.destinationCity}</p>
                </div>
                 <div className={cn("text-right", useKurdish && "text-left")}>
                    <h3 className="font-semibold text-gray-500 mb-1">{t('details')}</h3>
                    <p><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                    <p><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                    {totalYearlyInvoices && <p><strong>{t('slip_no')}:</strong> {totalYearlyInvoices}</p>}
                </div>
            </section>

            <main>
                <Table>
                    <TableHeader>
                        <TableRow style={{ backgroundColor: settings.secondaryColor || '#0F172A', color: 'white'}} className="hover:bg-gray-800">
                            <TableHead className="w-[30px] text-white text-center text-[10px] py-1 h-auto">{t('no_dot')}</TableHead>
                            <TableHead className="text-white text-center text-[10px] py-1 h-auto">{t('model')}</TableHead>
                            <TableHead className="w-[50px] text-center text-white text-[10px] py-1 h-auto">{t('quantity')}</TableHead>
                            <TableHead className="text-white text-center text-[10px] py-1 h-auto">{t('invoice_no')}</TableHead>
                            <TableHead className="text-white text-center text-[10px] py-1 h-auto">{t('storage')}</TableHead>
                            <TableHead className="text-white text-center text-[10px] py-1 h-auto">{t('notes')}</TableHead>
                            <TableHead className="w-[80px] text-center text-white text-[10px] py-1 h-auto">{t('request_date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={item.id} className={cn('text-[10px] leading-snug', settings.tableTheme === 'striped' && 'odd:bg-gray-50', item.storage === 'Huana' && 'bg-yellow-100/70')}>
                                <TableCell className="text-center py-1">{index + 1}</TableCell>
                                <TableCell className="font-semibold py-1 text-left">{item.model}</TableCell>
                                <TableCell className="text-center py-1">{item.quantity}</TableCell>
                                <TableCell className="text-center py-1">{item.invoiceNo || 'N/A'}</TableCell>
                                <TableCell className="text-center py-1">{item.storage || 'N/A'}</TableCell>
                                <TableCell className="text-gray-600 py-1 text-left">{item.notes || 'N/A'}</TableCell>
                                <TableCell className="text-center py-1">{item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </main>
        </ReportWrapper>
    );
};
