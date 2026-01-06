'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

export function SplashScreen() {
  // Start with a guaranteed valid, non-null default URL.
  const defaultLogo = "https://picsum.photos/seed/ashley-logo/300/100";
  const [savedLogo, setSavedLogo] = useLocalStorage<string | null>('app-logo', null);
  const [logo, setLogo] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (savedLogo) {
      setLogo(savedLogo);
    } else {
        setLogo(defaultLogo);
        setSavedLogo(defaultLogo);
    }
  }, [savedLogo, setSavedLogo]);

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
              src={logo} // This is now guaranteed to be a valid URL string
              alt="Loading..."
              layout="fill"
              objectFit="contain"
              priority
              unoptimized // Added to prevent Next.js from processing a potentially external URL if needed
            />
        </div>
      </div>
    </div>
  );
}
