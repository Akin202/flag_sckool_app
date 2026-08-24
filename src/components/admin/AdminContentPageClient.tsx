'use client';

import { AdminContentPage } from '@/views/admin/AdminContentPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';

export function AdminContentPageClient() {
  const navigate = useAppNavigate();
  return <AdminContentPage onNavigate={navigate} />;
}
