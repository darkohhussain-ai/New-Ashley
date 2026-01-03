
'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';

export default function EmployeeDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { t } = useTranslation();

  useEffect(() => {
    // This page is no longer used. The functionality has been merged into /employees.
    // We redirect users back to the main employees page, but can pass the ID as a query param
    // if we wanted to auto-select that employee on load. For now, a simple redirect is fine.
    if (id) {
        router.replace(`/employees?selected=${id}`);
    } else {
        router.replace('/employees');
    }
  }, [router, id]);

  // Render a simple loading state while redirecting
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p>{t('redirecting')}...</p>
    </div>
  );
}
