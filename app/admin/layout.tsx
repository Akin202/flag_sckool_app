import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';

// The admin area is deliberately not themed toward the student aesthetic.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
