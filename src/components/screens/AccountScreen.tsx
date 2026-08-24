'use client';

import { config } from '@/config/flagskool.config';
import { AccountPage } from '@/views/AccountPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';

export function AccountScreen() {
  const navigate = useAppNavigate();

  return (
    <AccountPage
      config={config}
      onNavigate={navigate}
      // TODO(handoff): replace with a real Supabase sign-out.
      onLogout={() => navigate('login')}
    />
  );
}
