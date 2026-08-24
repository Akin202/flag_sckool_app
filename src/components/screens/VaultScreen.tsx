'use client';

import { config } from '@/config/flagskool.config';
import { VaultPage } from '@/views/VaultPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useDevState } from '@/components/dev/DevStateProvider';

export function VaultScreen() {
  const navigate = useAppNavigate();
  const { devState } = useDevState();

  return (
    <VaultPage
      config={config}
      resourcesVariant={devState.resourcesVariant}
      onNavigate={navigate}
    />
  );
}
