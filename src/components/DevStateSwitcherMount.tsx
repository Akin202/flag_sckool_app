'use client';

import { usePathname } from 'next/navigation';
import { DevStateSwitcher } from '@/components/DevStateSwitcher';
import { useDevState } from '@/components/dev/DevStateProvider';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { pathToPage } from '@/lib/navigation';

/** Renders the dev switcher on every route. Never ships to production. */
export function DevStateSwitcherMount() {
  const pathname = usePathname();
  const navigate = useAppNavigate();
  const dev = useDevState();

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <DevStateSwitcher
      devState={dev.devState}
      onDevStateChange={dev.setDevState}
      currentPage={pathToPage(pathname)}
      onNavigate={navigate}
      authFormState={dev.authFormState}
      onSetAuthFormState={dev.setAuthFormState}
      checkoutState={dev.checkoutState}
      onSetCheckoutState={dev.setCheckoutState}
      redeemState={dev.redeemState}
      onSetRedeemState={dev.setRedeemState}
      isPendingDelayed={dev.isPendingDelayed}
      onTogglePendingDelayed={dev.setIsPendingDelayed}
    />
  );
}
