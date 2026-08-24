'use client';

import { AdminCodesPage } from '@/views/admin/AdminCodesPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';

export function AdminCodesPageClient() {
  const navigate = useAppNavigate();
  return <AdminCodesPage onNavigate={navigate} />;
}
