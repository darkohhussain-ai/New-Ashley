
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
  children: React.ReactNode;
};

export function ReportWrapper({ title, date, logoSrc, themeColor = '#333333', children }: ReportWrapperProps) {
  const { t, language } = useTranslation();
  const useKurdish = language === 'ku';

  return (
    <div className={cn("bg-white text-black p-6 font-sans text-xs leading-normal w-full", useKurdish && "font-sans")} style={{fontFamily: 'Arial, sans-serif'}} dir={useKurdish ? 'rtl' : 'ltr'}>
        {/* Header */}
        <header className="flex justify-between items-start pb-2 border-b-2" style={{ borderColor: themeColor }}>
            <div className={cn("text-left", useKurdish && "text-right")}>
                <h1 className="text-sm font-bold text-gray-800">{t('ashley_mega_homestore_iraq')}</h1>
                <p className="text-gray-600 text-[10px] leading-tight">{t('ashley_sulaimanyah_branch')}</p>
                <p className="text-gray-600 text-[10px] leading-tight">{t('diwan_group_company')}</p>
            </div>
            {logoSrc && <div className="relative w-24 h-12"><Image src={logoSrc} alt="Company Logo" fill className="object-contain" unoptimized /></div>}
        </header>

        {/* Title */}
        <section className="text-center my-6">
            <h2 className="text-xl font-bold" style={{ color: themeColor }}>{title}</h2>
            <p className="text-xs text-gray-500">{date}</p>
        </section>

        {/* Main Content */}
        <main>
            {children}
        </main>

        {/* Footer */}
        <footer className="mt-8 pt-4 flex justify-end items-end text-center">
            <div className="w-40 text-center">
                <div className="border-b border-gray-400 mb-1"></div>
                <p className="text-[10px] font-semibold">{t('warehouse_manager_signature')}</p>
            </div>
        </footer>
    </div>
  );
}
