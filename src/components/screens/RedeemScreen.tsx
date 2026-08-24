'use client';

import { config } from '@/config/flagskool.config';
import { RedeemPage } from '@/views/RedeemPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useDevState } from '@/components/dev/DevStateProvider';

export function RedeemScreen() {
  const navigate = useAppNavigate();
  const { redeemState, setRedeemState } = useDevState();

  return (
    <RedeemPage
      config={config}
      redeemState={redeemState}
      onNavigate={navigate}
      onStateChange={setRedeemState}
    />
  );
}
