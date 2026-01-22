
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
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 py-4 mb-4 text-xs border-y">
                        <p><strong>{t('destination')}:</strong> {transfer.destinationCity}</p>
                        <p><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                        <p><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                    </div>
                )}

                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] text-center">No.</TableHead>
                                <TableHead>{t('model')}</TableHead>
                                <TableHead className="w-[60px] text-center">{t('quantity')}</TableHead>
                                <TableHead className="w-[80px]">{t('invoice_no')}</TableHead>
                                <TableHead className="w-[80px]">{t('storage')}</TableHead>
                                <TableHead>{t('notes')}</TableHead>
                                <TableHead className="w-[100px] text-right">{t('request_date')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item.id} className={settings.tableTheme === 'striped' ? 'odd:bg-gray-50' : ''}>
                                    <TableCell className="text-center p-1">{index + 1}</TableCell>
                                    <TableCell className="p-1 font-semibold text-xs">{item.model}</TableCell>
                                    <TableCell className="p-1 text-center">{item.quantity}</TableCell>
                                    <TableCell className="p-1 text-xs">{item.invoiceNo || ''}</TableCell>
                                    <TableCell className="p-1 text-xs">{item.storage || ''}</TableCell>
                                    <TableCell className="p-1 text-gray-600 text-[10px]">{item.notes || ''}</TableCell>
                                    <TableCell className="p-1 text-right text-[10px]">{item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : ''}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </ReportWrapper>
    );
};
