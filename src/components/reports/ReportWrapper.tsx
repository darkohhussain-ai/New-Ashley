
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
    <div className="bg-white text-black p-4 font-sans text-sm">
      <div className="border border-gray-300 shadow-lg">
        {/* Header */}
        <div className="p-6 border-b-2 border-gray-200">
            <div className="flex justify-between items-center">
                <div className="w-24 h-24 relative">
                    {logoSrc ? (
                    <Image src={logoSrc} alt="logo" fill className="object-contain" />
                    ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                        <span>{t('logo')}</span>
                    </div>
                    )}
                </div>
                <div className="text-right">
                    <h1 className="text-3xl font-bold" style={{ color: themeColor }}>{t(title.toLowerCase().replace(/ /g, '_')) || title}</h1>
                    <p className="text-gray-500">{date}</p>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <main className="p-6">
            {children}
        </main>

        {/* Footer */}
        <footer className="mt-8 pt-4 px-6 pb-6">
          <div className="flex justify-between items-end">
            <p className="text-xs text-gray-400">Generated on {format(new Date(), 'PPp')}</p>
            <div className="w-48 text-center">
              <div className="border-b-2 border-gray-400 mb-2"></div>
              <p className="text-sm font-bold">{t('warehouse_manager')}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
