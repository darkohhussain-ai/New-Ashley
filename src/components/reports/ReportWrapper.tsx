'use client';

import { useAppContext } from '@/context/app-provider';

export function ReportWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useAppContext();

  return (
    <div className="p-4 bg-white text-black">
      {settings?.printHeaderImage && (
        <header className="mb-4">
          <img src={settings.printHeaderImage} alt="Report Header" className="w-full h-auto max-h-40 object-contain" />
        </header>
      )}
      
      <main>
        {children}
      </main>

      {settings?.printFooterImage && (
        <footer className="mt-4 pt-4 border-t">
          <img src={settings.printFooterImage} alt="Report Footer" className="w-full h-auto max-h-40 object-contain" />
        </footer>
      )}
    </div>
  );
}
