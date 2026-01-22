
'use client';

import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';
import { format } from 'date-fns';

type ReportWrapperProps = {
  title: string;
  date: string;
  logoSrc: string | null;
  themeColor?: string;
  secondaryColor?: string;
  topRightTitle?: string;
  topRightValue?: string | number;
  qrCodeData?: string;
  children: React.ReactNode;
};

export function ReportWrapper({ title, date, logoSrc, themeColor = '#22c55e', secondaryColor = '#374151', topRightTitle, topRightValue, qrCodeData, children }: ReportWrapperProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white text-black p-8 font-sans text-xs">
        {/* Header */}
        <header className="flex justify-between items-start pb-4">
            <div className="text-left">
                <h1 className="text-lg font-bold text-gray-800">{t('ashley_mega_homestore_iraq')}</h1>
                <p className="text-gray-600 text-xs">{t('ashley_sulaimanyah_branch')}</p>
                <p className="text-gray-600 text-xs">{t('diwan_group_company')}</p>
            </div>
            {logoSrc && <div className="relative w-24 h-12"><Image src={logoSrc} alt="Company Logo" fill className="object-contain" unoptimized /></div>}
        </header>

        {/* Info Bar */}
        <section className="flex my-6 rounded-lg overflow-hidden shadow">
            <div className="w-2/3 p-4" style={{ backgroundColor: themeColor }}>
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <div className="w-1/3 p-4 text-right text-white" style={{ backgroundColor: secondaryColor }}>
                {topRightTitle && <p className="text-[10px] uppercase tracking-wider">{topRightTitle}</p>}
                {topRightValue && <p className="font-bold">{topRightValue}</p>}
                <p className="text-[10px] mt-1 uppercase tracking-wider">{t('date')}</p>
                <p className="font-bold">{date}</p>
            </div>
        </section>

        {/* Main Content */}
        <main className="pt-4">
            {children}
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-8 flex justify-between items-end text-center">
            <div className="text-left w-48 text-gray-400 text-[9px]">
                <p>Generated on {format(new Date(), 'PPp')}</p>
            </div>
            {qrCodeData && (
                <div className="w-16 h-16 relative">
                    <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${qrCodeData}`} alt="QR Code" layout="fill" unoptimized/>
                </div>
            )}
            <div className="w-48 text-center">
                <div className="border-b border-gray-400 mb-1"></div>
                <p className="text-xs font-semibold">{t('warehouse_manager_signature')}</p>
            </div>
        </footer>
    </div>
  );
}
