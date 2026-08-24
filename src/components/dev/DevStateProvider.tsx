'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type {
  CheckoutState,
  DevState,
  LoadState,
  RedeemState,
} from '@/types/index';

/**
 * Dev-only scaffolding carried over from the visual layer, where App.tsx owned
 * this state for every screen at once. App Router splits those screens across
 * routes, so the state lives in one client provider mounted in the root layout.
 *
 * TODO(handoff): delete this provider once every surface reads real data.
 */
interface DevStateContextValue {
  devState: DevState;
  setDevState: (next: Partial<DevState>) => void;
  authFormState: LoadState<void>;
  setAuthFormState: (state: LoadState<void>) => void;
  checkoutState: CheckoutState;
  setCheckoutState: (state: CheckoutState) => void;
  redeemState: RedeemState;
  setRedeemState: (state: RedeemState) => void;
  isPendingDelayed: boolean;
  setIsPendingDelayed: (val: boolean) => void;
}

const DEFAULT_DEV_STATE: DevState = {
  promoState: 'live',
  testimonialsState: 'populated',
  progressVariant: 'partial',
  commentsVariant: 'populated',
  resourcesVariant: 'populated',
  lessonAccessVariant: 'unlocked',
  dataSaverVariant: 'off',
};

const DevStateContext = createContext<DevStateContextValue | null>(null);

export function DevStateProvider({ children }: { children: React.ReactNode }) {
  const [devState, setDevStateRaw] = useState<DevState>(DEFAULT_DEV_STATE);
  const [authFormState, setAuthFormState] = useState<LoadState<void>>({ status: 'idle' });
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ status: 'idle' });
  const [redeemState, setRedeemState] = useState<RedeemState>({ status: 'idle' });
  const [isPendingDelayed, setIsPendingDelayed] = useState(false);

  const value = useMemo<DevStateContextValue>(
    () => ({
      devState,
      setDevState: (next) => setDevStateRaw((prev) => ({ ...prev, ...next })),
      authFormState,
      setAuthFormState,
      checkoutState,
      setCheckoutState,
      redeemState,
      setRedeemState,
      isPendingDelayed,
      setIsPendingDelayed,
    }),
    [devState, authFormState, checkoutState, redeemState, isPendingDelayed],
  );

  return <DevStateContext.Provider value={value}>{children}</DevStateContext.Provider>;
}

export function useDevState(): DevStateContextValue {
  const ctx = useContext(DevStateContext);
  if (!ctx) {
    throw new Error('useDevState must be used inside <DevStateProvider>');
  }
  return ctx;
}
