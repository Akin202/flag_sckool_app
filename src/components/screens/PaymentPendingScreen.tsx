'use client';

import { config } from '@/config/flagskool.config';
import { PaymentPendingPage } from '@/views/PaymentPendingPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useDevState } from '@/components/dev/DevStateProvider';

export function PaymentPendingScreen({ reference }: { reference?: string }) {
  const navigate = useAppNavigate();
  const { isPendingDelayed } = useDevState();

  return (
    <PaymentPendingPage
      config={config}
      reference={reference}
      forceDelayedState={isPendingDelayed}
      onNavigate={navigate}
    />
  );
}
