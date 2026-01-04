
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

export function SplashScreen() {
  const [logo, setLogo] = useState("https://picsum.photos/seed/ashley-logo/300/100");
  const [savedLogo] = useLocalStorage('app-logo', "https://picsum.photos/seed/ashley-logo/300/100");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setLogo(savedLogo || "https://picsum.photos/seed/ashley-logo/300/100");
    }
  }, [isMounted, savedLogo]);

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
            />
        </div>
      </div>
    </div>
  );
}
