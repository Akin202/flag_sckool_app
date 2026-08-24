'use client';

import { AdminStudentsPage } from '@/views/admin/AdminStudentsPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';

export function AdminStudentsPageClient() {
  const navigate = useAppNavigate();
  return <AdminStudentsPage onNavigate={navigate} />;
}
