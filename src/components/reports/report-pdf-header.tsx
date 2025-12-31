
'use client';

import Image from 'next/image';

type ReportPdfHeaderProps = {
  title: string;
  subtitle: string;
  logoSrc: string | null;
  themeColor?: string;
  headerText?: string;
};

export function ReportPdfHeader({ title, subtitle, logoSrc, themeColor, headerText }: ReportPdfHeaderProps) {
  return (
    <div className="bg-white text-black w-full p-4 font-sans" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Custom Header Text */}
      {headerText && (
        <div className="text-center text-xs text-gray-500 pb-2">
          {headerText}
        </div>
      )}

      {/* Main Header */}
      <div 
        className="flex justify-between items-center p-4 rounded-t-lg text-white"
        style={{ backgroundColor: themeColor || '#22c55e' }}
      >
        <div className="flex-1">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm opacity-90">{subtitle}</p>
        </div>
        <div className="w-16 h-16 flex items-center justify-center bg-white/20 rounded-full p-1">
          {logoSrc && <Image src={logoSrc} alt="Company Logo" width={56} height={56} className="object-contain rounded-full" />}
        </div>
      </div>
    </div>
  );
};
