
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/app-provider';

export function SplashScreen() {
  const { settings } = useAppContext();
  const [logo, setLogo] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (settings.appLogo) {
      setLogo(settings.appLogo);
    }
  }, [settings.appLogo]);

  if (!isMounted || !logo) {
    // Render a consistent placeholder on the server to avoid hydration mismatch
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <div className="animate-pulse">
                <div className="relative w-48 h-16 bg-muted rounded-md"></div>
            </div>
        </div>
    );
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="animate-pulse">
        <div className="relative w-48 h-16">
            <Image
              src={logo}
              alt="Loading..."
              layout="fill"
              objectFit="contain"
              priority
              unoptimized
            />
        </div>
      </div>
    </div>
  );
}
