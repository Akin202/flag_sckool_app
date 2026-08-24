'use client';

import { config } from '@/config/flagskool.config';
import { CheckoutPage } from '@/views/CheckoutPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useDevState } from '@/components/dev/DevStateProvider';

export function CheckoutScreen({ productSku }: { productSku: 'cohort' | 'recordings' }) {
  const navigate = useAppNavigate();
  const { checkoutState, setCheckoutState } = useDevState();

  return (
    <CheckoutPage
      config={config}
      productSku={productSku}
      checkoutState={checkoutState}
      onNavigate={navigate}
      onStateChange={setCheckoutState}
    />
  );
}
