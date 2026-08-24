import React, { useState } from 'react';
import {
  DevState,
  Page,
  CheckoutState,
  RedeemState,
  LoadState,
  ProgressVariant,
  CommentsVariant,
  ResourcesVariant,
  LessonAccessVariant,
  DataSaverVariant,
} from '@/types/index';
import {
  Sliders,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Gift,
  KeyRound,
  Compass,
  PlayCircle,
} from 'lucide-react';

export interface DevStateSwitcherProps {
  devState: DevState;
  onDevStateChange: (newState: Partial<DevState>) => void;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  authFormState: LoadState<void>;
  onSetAuthFormState: (state: LoadState<void>) => void;
  checkoutState: CheckoutState;
  onSetCheckoutState: (state: CheckoutState) => void;
  redeemState: RedeemState;
  onSetRedeemState: (state: RedeemState) => void;
  isPendingDelayed: boolean;
  onTogglePendingDelayed: (val: boolean) => void;
}

export const DevStateSwitcher: React.FC<DevStateSwitcherProps> = ({
  devState,
  onDevStateChange,
  currentPage,
  onNavigate,
  authFormState,
  onSetAuthFormState,
  checkoutState,
  onSetCheckoutState,
  redeemState,
  onSetRedeemState,
  isPendingDelayed,
  onTogglePendingDelayed,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const pages: { id: Page; label: string }[] = [
    { id: 'landing', label: 'Landing (/)' },
    { id: 'dashboard', label: 'Dashboard (/dashboard)' },
    { id: 'learn', label: 'Player (/learn)' },
    { id: 'vault', label: 'Vault (/vault)' },
    { id: 'account', label: 'Account (/account)' },
    { id: 'admin', label: 'Admin: Overview (/admin)' },
    { id: 'admin/students', label: 'Admin: Students' },
    { id: 'admin/sales', label: 'Admin: Sales' },
    { id: 'admin/codes', label: 'Admin: Codes' },
    { id: 'admin/content', label: 'Admin: Content' },
    { id: 'login', label: '/login' },
    { id: 'signup', label: '/signup' },
    { id: 'forgot', label: '/forgot' },
    { id: 'reset', label: '/reset' },
    { id: 'verify-email', label: '/verify-email' },
    { id: 'checkout', label: '/checkout' },
    { id: 'payment-pending', label: '/payment-pending' },
    { id: 'redeem', label: '/redeem' },
  ];

  return (
    <aside
      id="dev-state-switcher-panel"
      aria-label="Development State Switcher"
      className="fixed bottom-3 right-3 z-50 transition-all duration-200"
    >
      <div className="bg-ink-raised/95 backdrop-blur-md border border-[#2D3A63] rounded-xl shadow-2xl overflow-hidden w-80 sm:w-96 text-xs font-mono max-h-[85vh] flex flex-col">
        {/* Header / Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2.5 bg-ink-deep border-b border-ink-border flex items-center justify-between text-paper-soft hover:bg-[#121A3F] transition-colors focus:outline-none shrink-0"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-flag-red" />
            <span className="font-bold text-[12px]">DEV STATE SWITCHER</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-text">
            <span className="text-[10px] text-flag-red font-semibold">[{currentPage}]</span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* Content Controls */}
        {isOpen && (
          <div className="p-3.5 space-y-4 overflow-y-auto max-h-[75vh]">
            {/* 1. Page Navigator */}
            <div>
              <div className="text-[11px] text-muted-text mb-1.5 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-flag-red" />
                Switch Active Screen:
              </div>
              <div className="grid grid-cols-2 gap-1 bg-ink-deep p-1.5 rounded-lg border border-ink-border">
                {pages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onNavigate(p.id)}
                    className={`px-2 py-1 rounded text-[10px] text-left truncate transition-all ${
                      currentPage === p.id
                        ? 'bg-flag-red text-paper-soft font-bold'
                        : 'text-muted-text hover:text-paper-soft hover:bg-ink-border'
                    }`}
                  >
                    {currentPage === p.id ? '● ' : ''}{p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Logged-in Student Experience Variants */}
            <div className="space-y-3 pt-2 border-t border-ink-border">
              <div className="text-[11px] text-flag-red uppercase tracking-wider font-bold flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5" />
                Student Portal States:
              </div>

              {/* Progress Variant */}
              <div>
                <div className="text-[10px] text-muted-text mb-1">
                  Course Progress Variant ({devState.progressVariant || 'partial'}):
                </div>
                <div className="grid grid-cols-3 gap-1 bg-ink-deep p-1 rounded-lg border border-ink-border">
                  {(['zero', 'partial', 'complete'] as ProgressVariant[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onDevStateChange({ progressVariant: v })}
                      className={`px-1.5 py-1 rounded text-[10px] text-center capitalize ${
                        (devState.progressVariant || 'partial') === v
                          ? 'bg-flag-red text-paper-soft font-bold'
                          : 'text-muted-text hover:bg-ink-border'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments & Resources Variants */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted-text mb-1">
                    Comments List:
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-ink-deep p-1 rounded-lg border border-ink-border">
                    {(['populated', 'empty'] as CommentsVariant[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onDevStateChange({ commentsVariant: v })}
                        className={`px-1 py-1 rounded text-[10px] text-center capitalize ${
                          (devState.commentsVariant || 'populated') === v
                            ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]'
                            : 'text-muted-text'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted-text mb-1">
                    Resources:
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-ink-deep p-1 rounded-lg border border-ink-border">
                    {(['populated', 'empty'] as ResourcesVariant[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onDevStateChange({ resourcesVariant: v })}
                        className={`px-1 py-1 rounded text-[10px] text-center capitalize ${
                          (devState.resourcesVariant || 'populated') === v
                            ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]'
                            : 'text-muted-text'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lesson Lock & Data Saver */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted-text mb-1">
                    Lesson Access:
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-ink-deep p-1 rounded-lg border border-ink-border">
                    {(['unlocked', 'locked'] as LessonAccessVariant[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onDevStateChange({ lessonAccessVariant: v })}
                        className={`px-1 py-1 rounded text-[10px] text-center capitalize ${
                          (devState.lessonAccessVariant || 'unlocked') === v
                            ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]'
                            : 'text-muted-text'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted-text mb-1">
                    Data Saver Mode:
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-ink-deep p-1 rounded-lg border border-ink-border">
                    {(['off', 'on'] as DataSaverVariant[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onDevStateChange({ dataSaverVariant: v })}
                        className={`px-1 py-1 rounded text-[10px] text-center capitalize ${
                          (devState.dataSaverVariant || 'off') === v
                            ? 'bg-[#059669] text-paper-soft font-bold'
                            : 'text-muted-text'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. CheckoutState Variants */}
            <div className="pt-2 border-t border-ink-border">
              <div className="text-[11px] text-muted-text mb-1.5 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#00C3F7]" />
                CheckoutState Union ({checkoutState.status}):
              </div>
              <div className="grid grid-cols-2 gap-1 bg-ink-deep p-1.5 rounded-lg border border-ink-border">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({ status: 'idle' });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'idle' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  idle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({ status: 'validating-code', code: 'FLAG50' });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'validating-code' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  validating-code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({
                      status: 'code-invalid',
                      code: 'EXPIRED20',
                      error: 'The coupon code EXPIRED20 has expired.',
                    });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'code-invalid' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  code-invalid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({
                      status: 'code-applied',
                      preview: {
                        code: 'FLAG50',
                        discountPercent: 50,
                        discountAmountKobo: 5000000,
                        originalPriceKobo: 10000000,
                        finalPriceKobo: 5000000,
                        isFullyDiscounted: false,
                      },
                    });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'code-applied' && !(checkoutState as any).preview?.isFullyDiscounted
                      ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]'
                      : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  code-applied (50%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({
                      status: 'code-applied',
                      preview: {
                        code: 'ALUMNI100',
                        discountPercent: 100,
                        discountAmountKobo: 10000000,
                        originalPriceKobo: 10000000,
                        finalPriceKobo: 0,
                        isFullyDiscounted: true,
                      },
                    });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'code-applied' && (checkoutState as any).preview?.isFullyDiscounted
                      ? 'bg-[#059669] text-paper-soft font-bold'
                      : 'text-[#059669] hover:bg-ink-border'
                  }`}
                >
                  alumni-free (100%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({ status: 'redirecting', targetUrl: 'https://checkout.paystack.com' });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'redirecting' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  redirecting
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({ status: 'awaiting-webhook', reference: 'FLG-84920193' });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'awaiting-webhook' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  awaiting-webhook
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({ status: 'success', reference: 'FLG-84920193' });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'success' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  success
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('checkout');
                    onSetCheckoutState({ status: 'error', error: 'Payment declined by issuer or insufficient funds.' });
                  }}
                  className={`col-span-2 px-2 py-1 rounded text-[10px] text-left truncate ${
                    checkoutState.status === 'error' ? 'bg-flag-red text-paper-soft font-bold' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  error state
                </button>
              </div>
            </div>

            {/* 4. RedeemState Variants */}
            <div>
              <div className="text-[11px] text-muted-text mb-1.5 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#059669]" />
                RedeemState Union ({redeemState.status}):
              </div>
              <div className="grid grid-cols-2 gap-1 bg-ink-deep p-1.5 rounded-lg border border-ink-border">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('redeem');
                    onSetRedeemState({ status: 'idle' });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    redeemState.status === 'idle' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  idle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('redeem');
                    onSetRedeemState({ status: 'checking', code: 'ALUMNI-2026' });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    redeemState.status === 'checking' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  checking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('redeem');
                    onSetRedeemState({
                      status: 'invalid',
                      code: 'ALUMNI-INVALID',
                      error: 'Unrecognized invite code. Please check your January cohort email.',
                    });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    redeemState.status === 'invalid' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  invalid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('redeem');
                    onSetRedeemState({
                      status: 'already-redeemed',
                      code: 'ALUMNI-CLAIMED',
                      error: 'This invite code has already been redeemed on another account.',
                    });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    redeemState.status === 'already-redeemed' ? 'bg-ink-border text-paper-soft font-bold border border-[#2D3A63]' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  already-redeemed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('redeem');
                    onSetRedeemState({
                      status: 'success',
                      code: 'ALUMNI-VIP2026',
                      productName: 'Live Cohort 2 + Complete Archive',
                    });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    redeemState.status === 'success' ? 'bg-[#059669] text-paper-soft font-bold' : 'text-[#059669] hover:bg-ink-border'
                  }`}
                >
                  success
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('redeem');
                    onSetRedeemState({
                      status: 'error',
                      error: 'Server verification encountered an error. Please try again.',
                    });
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-left truncate ${
                    redeemState.status === 'error' ? 'bg-flag-red text-paper-soft font-bold' : 'text-muted-text hover:bg-ink-border'
                  }`}
                >
                  error
                </button>
              </div>
            </div>

            {/* 5. Auth Form State Selector */}
            <div>
              <div className="text-[11px] text-muted-text mb-1.5 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#EAB308]" />
                Auth Form LoadState ({authFormState.status}):
              </div>
              <div className="grid grid-cols-4 gap-1 bg-ink-deep p-1.5 rounded-lg border border-ink-border">
                <button
                  type="button"
                  onClick={() => onSetAuthFormState({ status: 'idle' })}
                  className={`px-1.5 py-1 rounded text-[10px] text-center ${
                    authFormState.status === 'idle' ? 'bg-ink-border text-paper-soft font-bold' : 'text-muted-text'
                  }`}
                >
                  idle
                </button>
                <button
                  type="button"
                  onClick={() => onSetAuthFormState({ status: 'loading' })}
                  className={`px-1.5 py-1 rounded text-[10px] text-center ${
                    authFormState.status === 'loading' ? 'bg-ink-border text-paper-soft font-bold' : 'text-muted-text'
                  }`}
                >
                  loading
                </button>
                <button
                  type="button"
                  onClick={() => onSetAuthFormState({ status: 'success', data: undefined })}
                  className={`px-1.5 py-1 rounded text-[10px] text-center ${
                    authFormState.status === 'success' ? 'bg-[#059669] text-paper-soft font-bold' : 'text-muted-text'
                  }`}
                >
                  success
                </button>
                <button
                  type="button"
                  onClick={() => onSetAuthFormState({ status: 'error', error: 'Invalid credentials or expired session.' })}
                  className={`px-1.5 py-1 rounded text-[10px] text-center ${
                    authFormState.status === 'error' ? 'bg-flag-red text-paper-soft font-bold' : 'text-muted-text'
                  }`}
                >
                  error
                </button>
              </div>
            </div>

            {/* 6. Payment Pending Pulse vs Fallback Toggle */}
            <div>
              <div className="text-[11px] text-muted-text mb-1.5 uppercase tracking-wider font-semibold">
                Payment Pending Screen State:
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-ink-deep p-1 rounded-lg border border-ink-border">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('payment-pending');
                    onTogglePendingDelayed(false);
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-center ${
                    !isPendingDelayed ? 'bg-ink-border text-paper-soft font-bold' : 'text-muted-text'
                  }`}
                >
                  Fresh (&lt;10s Pulse)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('payment-pending');
                    onTogglePendingDelayed(true);
                  }}
                  className={`px-2 py-1 rounded text-[10px] text-center ${
                    isPendingDelayed ? 'bg-[#EAB308]/20 text-[#EAB308] font-bold border border-[#EAB308]/40' : 'text-muted-text'
                  }`}
                >
                  Delayed (&gt;10s Fallback)
                </button>
              </div>
            </div>

            {/* 7. Landing Page Promo & Testimonials */}
            <div>
              <div className="text-[11px] text-muted-text mb-1.5 uppercase tracking-wider font-semibold">
                Landing Configuration:
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-ink-deep p-1 rounded-lg border border-ink-border">
                <button
                  type="button"
                  onClick={() => onDevStateChange({ promoState: devState.promoState === 'live' ? 'expired' : 'live' })}
                  className="px-2 py-1 rounded text-[10px] text-body-text bg-ink-border/60 hover:bg-ink-border"
                >
                  Promo: {devState.promoState}
                </button>
                <button
                  type="button"
                  onClick={() => onDevStateChange({ testimonialsState: devState.testimonialsState === 'populated' ? 'empty' : 'populated' })}
                  className="px-2 py-1 rounded text-[10px] text-body-text bg-ink-border/60 hover:bg-ink-border"
                >
                  Testimonials: {devState.testimonialsState}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-ink-border text-[10px] text-muted-text flex items-center justify-between">
              <span>Zero network calls</span>
              <span className="text-[#059669]">Presentation Only</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
