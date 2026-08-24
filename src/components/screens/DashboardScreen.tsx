'use client';

import { useRouter } from 'next/navigation';
import { config } from '@/config/flagskool.config';
import { DashboardPage } from '@/views/DashboardPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useDevState } from '@/components/dev/DevStateProvider';

export function DashboardScreen() {
  const router = useRouter();
  const navigate = useAppNavigate();
  const { devState } = useDevState();

  return (
    <DashboardPage
      config={config}
      progressVariant={devState.progressVariant}
      onNavigate={navigate}
      onOpenCheckout={(tierId) => router.push(`/checkout?sku=${tierId}`)}
    />
  );
}
