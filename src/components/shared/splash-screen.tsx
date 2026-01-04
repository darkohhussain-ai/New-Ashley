
'use client';

import Image from 'next/image';
import useLocalStorage from '@/hooks/use-local-storage';

export function SplashScreen() {
  const [savedLogo] = useLocalStorage('app-logo', "https://picsum.photos/seed/ashley-logo/300/100");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="animate-pulse">
        {savedLogo && (
          <div className="relative w-48 h-16">
            <Image
              src={savedLogo}
              alt="Loading..."
              layout="fill"
              objectFit="contain"
              priority
            />
          </div>
        )}
      </div>
    </div>
  );
}
