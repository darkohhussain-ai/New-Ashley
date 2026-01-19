'use client';

import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';

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
    <div className="bg-white text-black p-4 font-sans text-sm">
      <div className="border border-gray-400 p-2">
        <header
          className="p-4 flex justify-between items-center"
          style={{ backgroundColor: themeColor }}
        >
          <div className="w-20 h-20 relative">
            {logoSrc ? (
              <Image src={logoSrc} alt="logo" fill className="object-contain" />
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded-md flex items-center justify-center text-white/50">
                <span>{t('logo')}</span>
              </div>
            )}
          </div>
          <div className="text-center text-white">
            <h1 className="text-xl font-bold">{t(title.toLowerCase().replace(/ /g, '_')) || title}</h1>
            <p className="text-sm">{date}</p>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </header>

        <main className="py-4">{children}</main>

        <footer className="mt-8 pt-8">
          <div className="flex justify-end">
            <div className="w-48 text-center">
              <p className="font-bold">{t('warehouse_manager')}</p>
              <div className="border-b-2 border-gray-700 mt-16"></div>
            </div>
          </div>
          <div className="mt-2 h-2" style={{ backgroundColor: themeColor }}></div>
        </footer>
      </div>
    </div>
  );
}
