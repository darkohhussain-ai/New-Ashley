
'use client';

import { useAppContext } from '@/context/app-provider';

export const ReportWrapper = ({
  children,
  title,
  date,
}: {
  children: React.ReactNode;
  title?: string;
  date?: string;
}) => {
  const { settings } = useAppContext();

  return (
    <div className="p-4 bg-white text-black font-sans">
      {settings?.printHeaderImage && (
        <header className="mb-4 text-center break-inside-avoid">
          <img
            src={settings.printHeaderImage}
            alt="Report Header"
            className="w-full h-auto max-h-28 object-contain"
            crossOrigin="anonymous"
          />
        </header>
      )}

      {title && (
        <div className="text-center mb-4 break-after-avoid">
          <h1 className="text-lg font-bold">{title}</h1>
          {date && <p className="text-gray-500 mt-1">{date}</p>}
        </div>
      )}
      
      <main>
        {children}
      </main>

      {settings?.printFooterImage && (
        <footer className="mt-4 pt-4 border-t break-before-avoid">
          <img
            src={settings.printFooterImage}
            alt="Report Footer"
            className="w-full h-auto max-h-28 object-contain"
            crossOrigin="anonymous"
          />
        </footer>
      )}
    </div>
  );
};
