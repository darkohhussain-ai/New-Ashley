'use client';

import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-provider';
import Image from 'next/image';

type ReportWrapperProps = {
  title: string;
  date: string;
  themeColor?: string;
  children: React.ReactNode;
  qrCodeData?: string;
};

export function ReportWrapper({ title, date, themeColor = '#333333', qrCodeData, children }: ReportWrapperProps) {
  const { t, language } = useTranslation();
  const { settings } = useAppContext();
  const useKurdish = language === 'ku';

  const fontFamily = settings?.fontFamily || 'Arial, sans-serif';

  return (
    <div 
        className="bg-white text-black p-6 text-xs leading-normal w-full"
        style={{ fontFamily }}
        dir={useKurdish ? 'rtl' : 'ltr'}
    >
        {settings?.printHeaderImage && (
            <div className="relative w-full h-28 mb-6">
                <img src={settings.printHeaderImage} alt="Report Header" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
            </div>
        )}
        
        {/* Header */}
        <header className="flex justify-between items-start pb-2 mb-4" style={{ borderColor: themeColor }}>
            <div className={cn("text-left", useKurdish && "text-right")}>
                <h1 className="text-xl font-medium" style={{ color: themeColor }}>{title}</h1>
                <p className="text-sm text-gray-500 mt-1">{date}</p>
            </div>
             <div className="flex items-center gap-4">
                {qrCodeData && (
                    <div className="relative w-16 h-16">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData)}`}
                            alt="QR Code"
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                        />
                    </div>
                )}
            </div>
        </header>

        {/* Main Content */}
        <main>
            {children}
        </main>

        {/* Footer */}
        <footer className={cn("mt-8 pt-4 flex justify-between items-end text-center", useKurdish && "flex-row-reverse justify-start")}>
             <div className="w-40 text-center">
                <p className="text-gray-500 text-[9px]">{settings?.pdfSettings.report.footerText || t('generated_by_ashley_system')}</p>
             </div>
             <div className="w-40 text-center">
                <div className="border-b border-gray-400 mb-1"></div>
                <p className="text-[10px]">{t('warehouse_manager_signature')}</p>
            </div>
        </footer>

        {settings?.printFooterImage && (
            <div className="relative w-full h-24 mt-4">
                <img src={settings.printFooterImage} alt="Report Footer" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
            </div>
        )}
    </div>
  );
}
