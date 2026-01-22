
'use client';

import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-provider';

type ReportWrapperProps = {
  title: string;
  date: string;
  logoSrc: string | null;
  themeColor?: string;
  children: React.ReactNode;
};

export function ReportWrapper({ title, date, logoSrc, themeColor = '#333333', children }: ReportWrapperProps) {
  const { t, language } = useTranslation();
  const { settings } = useAppContext();
  const useKurdish = language === 'ku';

  // Define font styles dynamically
  const fontFace = settings.customFont ? `@font-face { font-family: 'CustomPdfFont'; src: url(${settings.customFont}); }` : '';
  const fontFamily = settings.customFont ? 'CustomPdfFont, Arial, sans-serif' : 'Arial, sans-serif';

  return (
    <div 
        className="bg-white text-black p-6 text-xs leading-normal w-full"
        style={{ fontFamily }}
        dir={useKurdish ? 'rtl' : 'ltr'}
    >
        <style>
          {`
            ${fontFace}
            div { word-spacing: normal; }
            .pdf-table { width: 100%; border-collapse: collapse; }
            .pdf-table th, .pdf-table td {
              border: 1px solid #e0e0e0;
              text-align: center;
              vertical-align: middle;
              padding: 4px;
              font-size: 9px;
              line-height: 1.2;
            }
            .pdf-table th {
              font-weight: 500;
              background-color: #f7f7f7;
            }
          `}
        </style>
        
        {/* Header */}
        <header className={cn("flex justify-between items-start pb-2 border-b-2", useKurdish && "flex-row-reverse")} style={{ borderColor: themeColor }}>
            <div className={cn("text-left", useKurdish && "text-right")}>
                <h1 className="text-sm font-medium">{t('ashley_mega_homestore_iraq')}</h1>
                <p className="text-gray-600 text-[10px] leading-tight">{t('ashley_sulaimanyah_branch')}</p>
                <p className="text-gray-600 text-[10px] leading-tight">{t('diwan_group_company')}</p>
            </div>
            {logoSrc && <div className="relative w-24 h-12"><Image src={logoSrc} alt="Company Logo" fill className="object-contain" unoptimized /></div>}
        </header>

        {/* Title */}
        <section className="text-center my-6">
            <h2 className="text-xl font-medium" style={{ color: themeColor }}>{title}</h2>
            <p className="text-sm text-gray-500 mt-2">{date}</p>
        </section>

        {/* Main Content */}
        <main>
            {children}
        </main>

        {/* Footer */}
        <footer className={cn("mt-8 pt-4 flex justify-end items-end text-center", useKurdish && "flex-row-reverse justify-start")}>
            <div className="w-40 text-center">
                <div className="border-b border-gray-400 mb-1"></div>
                <p className="text-[10px]">{t('warehouse_manager_signature')}</p>
            </div>
        </footer>
    </div>
  );
}
