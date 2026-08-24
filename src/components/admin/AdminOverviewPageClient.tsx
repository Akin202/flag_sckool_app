'use client';

import { AdminOverviewPage } from '@/views/admin/AdminOverviewPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';

export function AdminOverviewPageClient() {
  const navigate = useAppNavigate();
  return <AdminOverviewPage onNavigate={navigate} />;
}
