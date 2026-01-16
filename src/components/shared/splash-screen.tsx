
'use client';

import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';

export function SplashScreen() {
  const { settings } = useAppContext();
  
  const logo = settings?.appLogo;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="animate-pulse">
        <div className="relative w-48 h-16">
          {logo ? (
            <Image
              key={logo}
              src={logo}
              alt="Loading..."
              fill
              objectFit="contain"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-md" />
          )}
        </div>
      </div>
    </div>
  );
}
