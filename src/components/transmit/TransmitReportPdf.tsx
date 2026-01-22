
'use client';
import { ItemForTransfer, Transfer, PdfSettings, BranchColors } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
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
    
    const { logo, branchColors, themeColor: defaultThemeColor, headerText, secondaryColor, titleTemplate } = settings;
    const finalThemeColor = (transfer.destinationCity && branchColors?.[transfer.destinationCity as keyof BranchColors]) || defaultThemeColor || '#ef4444';
    const finalSecondaryColor = secondaryColor || '#0f172a';
    const finalTitle = titleTemplate ? titleTemplate.replace('{city}', transfer.destinationCity || '') : transfer.cargoName;


    return (
        <div className="bg-white text-black p-8 font-sans text-xs" style={{fontFamily: settings.customFont && useKurdish ? 'CustomPdfFont' : 'sans-serif'}}>
            {/* Header */}
            <header className="flex justify-between items-start pb-4">
                <div className="text-left">
                     <h1 className="text-lg font-bold text-gray-800">{t('ashley_mega_homestore_iraq')}</h1>
                    <p className="text-gray-600 text-xs">{t('ashley_sulaimanyah_branch')}</p>
                    <p className="text-gray-600 text-xs">{t('diwan_group_company')}</p>
                </div>
                {logo && <div className="relative w-24 h-12"><Image src={logo} alt="Company Logo" fill className="object-contain" unoptimized /></div>}
            </header>

            {/* Invoice Info Bar */}
            <section className="flex my-6 rounded-lg overflow-hidden shadow">
                 <div className="w-2/3 p-4" style={{ backgroundColor: finalThemeColor }}>
                    <h2 className="text-xl font-bold text-white">{t('INVOICE')} #{invoiceNumber ? String(invoiceNumber).padStart(6, '0') : 'N/A'}</h2>
                </div>
                <div className="w-1/3 p-4 text-right text-white" style={{ backgroundColor: finalSecondaryColor }}>
                    <p className="text-[10px] uppercase tracking-wider">{t('slip_no')}</p>
                    <p className="font-bold">{totalYearlyInvoices}</p>
                    <p className="text-[10px] mt-1 uppercase tracking-wider">{t('date')}</p>
                    <p className="font-bold">{formattedDate}</p>
                </div>
            </section>


            {/* Details Section */}
            <section className="grid grid-cols-2 gap-8 my-6 text-xs">
                 <div>
                    <h3 className="font-semibold text-gray-500 mb-1">{t('transmit_to')}</h3>
                    <p className="font-bold text-base">{transfer.destinationCity}</p>
                </div>
                 <div className="text-right">
                    <h3 className="font-semibold text-gray-500 mb-1">{t('details')}</h3>
                    <p><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                    <p><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                </div>
            </section>

            {/* Items Table */}
            <main>
                <Table>
                    <TableHeader>
                        <TableRow style={{backgroundColor: finalSecondaryColor}} className="text-white">
                            <TableHead className="w-[40px] text-white">No.</TableHead>
                            <TableHead className="text-white">{t('model')}</TableHead>
                            <TableHead className="w-[60px] text-center text-white">{t('quantity')}</TableHead>
                            <TableHead className="text-white">{t('invoice_no')}</TableHead>
                            <TableHead className="text-white">{t('storage')}</TableHead>
                            <TableHead className="text-white">{t('notes')}</TableHead>
                            <TableHead className="w-[100px] text-right text-white">{t('request_date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={item.id} className={cn('text-xs', settings.tableTheme === 'striped' && 'odd:bg-gray-50', item.storage === 'Huana' && 'bg-huana-highlight')}>
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

            {/* Footer */}
            <footer className="mt-12 pt-8 flex justify-between items-end text-center">
                 <div className="text-left w-48">
                    <div className="border-b border-gray-400 mb-1"></div>
                    <p className="text-xs font-semibold">{t('warehouse_manager')}</p>
                </div>
                {transfer.id && (
                     <div className="w-16 h-16 relative">
                        <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${typeof window !== 'undefined' ? window.location.origin : ''}/transmit/archive/${transfer.id}`} alt="QR Code" layout="fill" unoptimized/>
                    </div>
                )}
            </footer>
        </div>
    );
};
