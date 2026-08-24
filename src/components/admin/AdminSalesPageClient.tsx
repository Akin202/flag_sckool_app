'use client';

import { AdminSalesPage } from '@/views/admin/AdminSalesPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';

export function AdminSalesPageClient() {
  const navigate = useAppNavigate();
  return <AdminSalesPage onNavigate={navigate} />;
}
