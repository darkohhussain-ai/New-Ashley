
'use client';
import { ItemForTransfer, Transfer, PdfSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import { format, parseISO } from 'date-fns';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

export const TransmitReportPdf = ({ transfer, items, settings }: { transfer: Partial<Transfer>; items: ItemForTransfer[]; settings: PdfSettings }) => {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';
    
    const reportTitleTemplate = settings.titleTemplate || t('transmit_report_title', { city: '{city}' });
    const reportTitle = reportTitleTemplate.replace('{city}', transfer.destinationCity || 'N/A');
    const formattedDate = transfer.transferDate ? format(parseISO(transfer.transferDate), 'PPP') : 'N/A';
    
    const { logo, branchColors, themeColor: defaultThemeColor } = settings;
    const finalThemeColor = (transfer.destinationCity && branchColors?.[transfer.destinationCity as keyof typeof branchColors]) || defaultThemeColor || '#f97316';

    return (
        <ReportWrapper
            title={reportTitle}
            date={formattedDate}
            logoSrc={logo}
            themeColor={finalThemeColor}
        >
            <div className="p-2" dir={useKurdish ? 'rtl' : 'ltr'}>
                {transfer.driverName && (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 py-4 mb-4 text-sm border-y">
                        <p><strong>{t('destination')}:</strong> {transfer.destinationCity}</p>
                        <p><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                        <p><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                    </div>
                )}

                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[5%]">No.</TableHead>
                                <TableHead className="w-[25%]">{t('model')}</TableHead>
                                <TableHead className="w-[5%] text-center">{t('quantity')}</TableHead>
                                <TableHead className="w-[10%]">{t('invoice_no')}</TableHead>
                                <TableHead className="w-[10%]">{t('storage')}</TableHead>
                                <TableHead className="w-[30%]">{t('notes')}</TableHead>
                                <TableHead className="w-[15%] text-right">{t('request_date')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item.id} className={settings.tableTheme === 'striped' ? 'odd:bg-gray-50' : ''}>
                                    <TableCell className="text-center p-2">{index + 1}</TableCell>
                                    <TableCell className="p-2 font-semibold">{item.model}</TableCell>
                                    <TableCell className="p-2 text-center">{item.quantity}</TableCell>
                                    <TableCell className="p-2">{item.invoiceNo || ''}</TableCell>
                                    <TableCell className="p-2">{item.storage || ''}</TableCell>
                                    <TableCell className="p-2 text-gray-600 text-xs">{item.notes || ''}</TableCell>
                                    <TableCell className="p-2 text-right text-xs">{item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : ''}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </ReportWrapper>
    );
};
