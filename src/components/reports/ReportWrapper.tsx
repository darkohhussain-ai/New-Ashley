
'use client';

import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';
import { format } from 'date-fns';

type ReportWrapperProps = {
  title: string;
  date: string;
  logoSrc: string | null;
  themeColor: string;
  children: React.ReactNode;
};

export function ReportWrapper({ title, date, logoSrc, themeColor, children }: ReportWrapperProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white text-black p-4 font-sans text-xs">
      <div className="border border-gray-300 p-4">
        <header className="flex justify-between items-start pb-3 border-b border-gray-300">
            <div className="text-left">
                <h1 className="font-bold text-lg" style={{ color: themeColor }}>{t(title.toLowerCase().replace(/ /g, '_')) || title}</h1>
                <p className="text-[10px] text-gray-500 mt-1">{date}</p>
            </div>
            <div className="w-20 h-14 relative">
                {logoSrc ? (
                <Image src={logoSrc} alt="logo" fill className="object-contain" />
                ) : (
                <div className="w-full h-full bg-gray-100 rounded-sm flex items-center justify-center text-gray-400 text-[10px]">
                    <span>{t('logo')}</span>
                </div>
                )}
            </div>
        </header>

        <main className="pt-4">
            {children}
        </main>

        <footer className="mt-8 pt-3 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <p className="text-[9px] text-gray-400">Generated on {format(new Date(), 'PPp')}</p>
            <div className="w-40 text-center">
              <div className="border-b border-gray-400 mb-1"></div>
              <p className="text-[10px] font-semibold">{t('warehouse_manager_signature')}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
