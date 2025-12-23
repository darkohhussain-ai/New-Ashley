
'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
      <ShieldAlert className="mb-8 h-24 w-24 text-destructive" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Page Not Found
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/">
            Go back to Dashboard
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/settings">
            Contact support <span aria-hidden="true">&rarr;</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
