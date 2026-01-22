
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
    <div className="bg-white text-black p-6 font-sans text-xs">
      <div className="border border-gray-200 p-6">
        <header className="flex justify-between items-start pb-4 border-b border-gray-200">
            <div className="w-24 h-16 relative">
                {logoSrc ? (
                <Image src={logoSrc} alt="logo" fill className="object-contain" />
                ) : (
                <div className="w-full h-full bg-gray-100 rounded-sm flex items-center justify-center text-gray-400 text-xs">
                    <span>{t('logo')}</span>
                </div>
                )}
            </div>
            <div className="text-right">
                <h1 className="font-bold text-xl" style={{ color: themeColor }}>{t(title.toLowerCase().replace(/ /g, '_')) || title}</h1>
                <p className="text-xs text-gray-500">{date}</p>
            </div>
        </header>

        <main className="pt-6">
            {children}
        </main>

        <footer className="mt-12 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-end">
            <p className="text-[10px] text-gray-400">Generated on {format(new Date(), 'PPp')}</p>
            <div className="w-48 text-center">
              <div className="border-b border-gray-400 mb-1"></div>
              <p className="text-xs font-semibold">{t('warehouse_manager_signature')}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
