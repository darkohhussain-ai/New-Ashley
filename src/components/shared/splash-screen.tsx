
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

export function SplashScreen() {
  const [logo, setLogo] = useState("https://picsum.photos/seed/ashley-logo/300/100");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // We get the logo from localStorage only on the client side
    const savedLogo = localStorage.getItem('app-logo');
    if (savedLogo) {
      // Need to parse since localStorage stores it as a JSON string
      try {
        const parsedLogo = JSON.parse(savedLogo);
        if(parsedLogo) setLogo(parsedLogo);
      } catch(e) {
        // It might not be JSON, just a raw string
        setLogo(savedLogo);
      }
    }
  }, []);

  if (!isMounted) {
    // Render nothing on the server to avoid hydration mismatch
    return null;
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
            />
        </div>
      </div>
    </div>
  );
}
