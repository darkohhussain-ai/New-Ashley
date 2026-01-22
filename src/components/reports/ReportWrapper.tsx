
'use client';

import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type ReportWrapperProps = {
  title: string;
  date: string;
  logoSrc: string | null;
  themeColor?: string;
  qrCodeData?: string;
  children: React.ReactNode;
};

export function ReportWrapper({ title, date, logoSrc, themeColor = '#333333', qrCodeData, children }: ReportWrapperProps) {
  const { t, language } = useTranslation();
  const useKurdish = language === 'ku';

  return (
    <div className={cn("bg-white text-black p-8 font-sans text-sm w-full", useKurdish && "font-sans")} dir={useKurdish ? 'rtl' : 'ltr'}>
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b-2" style={{ borderColor: themeColor }}>
            <div className={cn("text-left", useKurdish && "text-right")}>
                <h1 className="text-base font-bold text-gray-800">{t('ashley_mega_homestore_iraq')}</h1>
                <p className="text-gray-600 text-xs">{t('ashley_sulaimanyah_branch')}</p>
                <p className="text-gray-600 text-xs">{t('diwan_group_company')}</p>
            </div>
            {logoSrc && <div className="relative w-28 h-14"><Image src={logoSrc} alt="Company Logo" fill className="object-contain" unoptimized /></div>}
        </header>

        {/* Title */}
        <section className="text-center my-8">
            <h2 className="text-2xl font-bold" style={{ color: themeColor }}>{title}</h2>
            <p className="text-base text-gray-500">{date}</p>
        </section>

        {/* Main Content */}
        <main>
            {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 flex justify-between items-end text-center">
            <div className="w-48 text-center">
                <div className="border-b border-gray-400 mb-1"></div>
                <p className="text-xs font-semibold">{t('warehouse_manager_signature')}</p>
            </div>
            {qrCodeData && (
                 <div className="w-24 h-24 relative">
                    <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrCodeData)}&qzone=1`} alt="QR Code" layout="fill" unoptimized/>
                </div>
            )}
            <div className="w-48 text-left text-gray-400 text-[9px]" dir="ltr">
                 <p>Generated on {format(new Date(), 'PPp')}</p>
            </div>
        </footer>
    </div>
  );
}
