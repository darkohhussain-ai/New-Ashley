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
          className="p-2 text-center text-white font-bold"
          style={{ backgroundColor: themeColor }}
        >
          <h1>{t(title.toLowerCase().replace(/ /g, '_')) || title}</h1>
        </header>
        <div className="flex justify-between items-center my-4 px-2">
          <div className="w-24 h-12 relative">
            {logoSrc ? <Image src={logoSrc} alt="logo" fill objectFit="contain" /> : <p className="text-gray-400">logo</p>}
          </div>
          <div className="text-right">
            <p className="font-bold">{t('date')}: {date}</p>
          </div>
        </div>

        <main>{children}</main>

        <footer className="mt-16">
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
