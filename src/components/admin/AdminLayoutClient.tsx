'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { pathToPage } from '@/lib/navigation';

/** Adapts the visual layer's AdminLayout to an App Router nested layout. */
export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigate = useAppNavigate();

  return (
    <AdminLayout currentPage={pathToPage(pathname)} onNavigate={navigate}>
      {children}
    </AdminLayout>
  );
}
