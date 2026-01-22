
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
    invoiceNumber: number;
    totalYearlyInvoices: number;
}) => {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';
    
    const formattedDate = transfer.transferDate ? format(parseISO(transfer.transferDate), 'PPP') : 'N/A';
    
    const { logo, branchColors, themeColor: defaultThemeColor, headerText } = settings;
    const finalThemeColor = (transfer.destinationCity && branchColors?.[transfer.destinationCity as keyof BranchColors]) || defaultThemeColor || '#f97316';

    return (
        <div className="bg-white text-black p-8 font-sans" style={{fontFamily: settings.customFont && useKurdish ? 'CustomPdfFont' : 'sans-serif'}}>
            {/* Header */}
            <header className="flex justify-between items-center pb-4 border-b">
                 <div className="text-left">
                    <h2 className="text-2xl font-bold" style={{color: finalThemeColor}}>INVOICE</h2>
                    <p className="font-mono text-sm">#{String(invoiceNumber).padStart(8, '0')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <h1 className="font-bold text-lg">{headerText || 'Ashley Sulimanyah – Diwan Group Company'}</h1>
                    </div>
                    {logo && <div className="relative w-20 h-20"><Image src={logo} alt="Company Logo" fill className="object-contain" /></div>}
                </div>
            </header>

            {/* Details Section */}
            <section className="grid grid-cols-3 gap-8 my-8">
                 <div className="col-span-1">
                    <h3 className="font-semibold text-gray-500 text-sm mb-1">Transmit To</h3>
                    <p className="font-bold text-lg">{transfer.destinationCity}</p>
                </div>
                 <div className="col-span-1">
                    <h3 className="font-semibold text-gray-500 text-sm mb-1">Details</h3>
                    <p className="text-sm"><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                    <p className="text-sm"><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                </div>
                <div className="col-span-1 text-right">
                     <h3 className="font-semibold text-gray-500 text-sm mb-1">Transmit Info</h3>
                     <p className="text-sm"><strong>Slip No:</strong> {totalYearlyInvoices}</p>
                     <p className="text-sm"><strong>Date:</strong> {formattedDate}</p>
                </div>
            </section>

            {/* Items Table */}
            <main>
                <Table>
                    <TableHeader>
                        <TableRow style={{backgroundColor: finalThemeColor}} className="text-white">
                            <TableHead className="w-[50px] text-white">No.</TableHead>
                            <TableHead className="text-white">{t('model')}</TableHead>
                            <TableHead className="w-[80px] text-center text-white">{t('quantity')}</TableHead>
                            <TableHead className="w-[100px] text-white">{t('invoice_no')}</TableHead>
                            <TableHead className="w-[100px] text-white">{t('storage')}</TableHead>
                            <TableHead className="text-white">{t('notes')}</TableHead>
                            <TableHead className="w-[120px] text-right text-white">{t('request_date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={item.id} className={cn(settings.tableTheme === 'striped' && 'odd:bg-gray-50', item.storage === 'Huana' && 'bg-huana-highlight')}>
                                <TableCell className="text-center py-1 text-xs">{index + 1}</TableCell>
                                <TableCell className="font-semibold py-1 text-xs">{item.model}</TableCell>
                                <TableCell className="text-center py-1 text-xs">{item.quantity}</TableCell>
                                <TableCell className="py-1 text-xs">{item.invoiceNo || 'N/A'}</TableCell>
                                <TableCell className="py-1 text-xs">{item.storage || 'N/A'}</TableCell>
                                <TableCell className="text-xs text-gray-600 py-1">{item.notes || 'N/A'}</TableCell>
                                <TableCell className="text-right text-xs py-1">{item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </main>

            {/* Footer */}
            <footer className="mt-12 pt-8 flex justify-between items-end border-t">
                 <div className="w-24 h-24 relative">
                     <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${typeof window !== 'undefined' ? window.location.origin : ''}/transmit/archive/${transfer.id}`} alt="QR Code" layout="fill" />
                </div>
                <div className="text-right">
                    <h3 className="font-bold text-lg" style={{color: finalThemeColor}}>THANK YOU!</h3>
                    <p className="text-xs text-gray-500">{settings.footerText || 'Generated by Ashley DRP'}</p>
                </div>
            </footer>
        </div>
    );
};
