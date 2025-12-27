'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error(error); 
      
      toast({
        variant: 'destructive',
        title: 'Firestore Permission Error',
        description: error.message,
        duration: 10000,
      });

      // You can also throw the error to be caught by Next.js error boundary
      // for a full-screen error display in development.
      if (process.env.NODE_ENV === 'development') {
         throw error;
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
