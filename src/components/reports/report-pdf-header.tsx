
'use client';

import Image from 'next/image';

type ReportPdfHeaderProps = {
  title: string;
  subtitle: string;
  logoSrc: string;
};

export function ReportPdfHeader({ title, subtitle, logoSrc }: ReportPdfHeaderProps) {
  return (
    <div className="bg-white text-black w-full p-4 font-sans border-b-2 border-gray-200" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <div className="flex justify-between items-start pb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-lg font-semibold text-gray-600">{subtitle}</p>
        </div>
        <div className="w-[80px] h-[80px] flex items-center justify-center">
          {logoSrc && <Image src={logoSrc} alt="Company Logo" width={60} height={60} className="object-contain" />}
        </div>
      </div>
    </div>
  );
};
