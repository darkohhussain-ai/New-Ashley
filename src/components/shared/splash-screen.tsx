'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

export function SplashScreen() {
  const [savedLogo] = useLocalStorage<string | null>('app-logo', null);
  const [logo, setLogo] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, [savedLogo]);

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
