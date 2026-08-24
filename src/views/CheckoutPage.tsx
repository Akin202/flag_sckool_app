import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Tag,
  X,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/FormControls';
import { Badge } from '@/components/ui/Badge';
import {
  FlagSkoolConfig,
  CheckoutState,
  DiscountPreview,
  Page,
  koboToNaira,
} from '@/types/index';

export interface CheckoutPageProps {
  config: FlagSkoolConfig;
  productSku?: 'cohort' | 'recordings';
  checkoutState?: CheckoutState;
  onNavigate?: (page: Page) => void;
  onStateChange?: (state: CheckoutState) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  config,
  productSku = 'cohort',
  checkoutState: controlledCheckoutState,
  onNavigate,
  onStateChange,
}) => {
  const [internalState, setInternalState] = useState<CheckoutState>({ status: 'idle' });
  const activeState = controlledCheckoutState || internalState;

  // Selected product
  const tier = config.pricing[productSku] || config.pricing.cohort;
  const basePriceNgn = config.promo.active ? (tier.promoPriceNgn || tier.fullPriceNgn) : tier.fullPriceNgn;
  const basePriceKobo = basePriceNgn * 100;

  // Payer form fields
  const [name, setName] = useState('Chidi Okonkwo');
  const [email, setEmail] = useState('chidi.okonkwo@example.com');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Discount code field
  const [couponInput, setCouponInput] = useState('');
  const [appliedPreview, setAppliedPreview] = useState<DiscountPreview | null>(null);

  // Sync applied preview if controlled state is code-applied
  useEffect(() => {
    if (activeState.status === 'code-applied') {
      setAppliedPreview(activeState.preview);
    } else if (activeState.status === 'idle') {
      setAppliedPreview(null);
    }
  }, [activeState]);

  const updateState = (newState: CheckoutState) => {
    setInternalState(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  };

  // Discount apply handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponInput.toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) return;

    updateState({ status: 'validating-code', code: cleanCode });

    // Simulate validation
    setTimeout(() => {
      if (cleanCode === 'ALUMNI100' || cleanCode === 'FULLPASS' || cleanCode === 'ALUMNI-2026') {
        const preview: DiscountPreview = {
          code: cleanCode,
          discountPercent: 100,
          discountAmountKobo: basePriceKobo,
          originalPriceKobo: basePriceKobo,
          finalPriceKobo: 0,
          isFullyDiscounted: true,
        };
        setAppliedPreview(preview);
        updateState({ status: 'code-applied', preview });
      } else if (cleanCode === 'FLAG50' || cleanCode === 'EARLYBIRD' || cleanCode === 'COMMUNITY') {
        const discountAmount = Math.floor(basePriceKobo * 0.5);
        const preview: DiscountPreview = {
          code: cleanCode,
          discountPercent: 50,
          discountAmountKobo: discountAmount,
          originalPriceKobo: basePriceKobo,
          finalPriceKobo: basePriceKobo - discountAmount,
          isFullyDiscounted: false,
        };
        setAppliedPreview(preview);
        updateState({ status: 'code-applied', preview });
      } else {
        updateState({
          status: 'code-invalid',
          code: cleanCode,
          error: `The discount code "${cleanCode}" is invalid or expired.`,
        });
      }
    }, 600);
  };

  const handleRemoveCoupon = () => {
    setAppliedPreview(null);
    setCouponInput('');
    updateState({ status: 'idle' });
  };

  // Handle Paystack or Free Claim submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (appliedPreview?.isFullyDiscounted) {
      // TODO(handoff): wire to enrollment
      updateState({ status: 'redirecting' });
      setTimeout(() => {
        updateState({ status: 'success', reference: `ALUMNI-${Date.now()}` });
      }, 1000);
      return;
    }

    // TODO(handoff): wire to checkout
    updateState({ status: 'redirecting', targetUrl: 'https://checkout.paystack.com/simulate' });
    setTimeout(() => {
      // Transition to post-Paystack waiting screen or success
      if (onNavigate) {
        onNavigate('payment-pending');
      } else {
        updateState({ status: 'awaiting-webhook', reference: `FLG-${Math.floor(100000 + Math.random() * 900000)}` });
      }
    }, 1200);
  };

  const finalAmountKobo = appliedPreview
    ? appliedPreview.finalPriceKobo
    : basePriceKobo;

  const isFree = appliedPreview?.isFullyDiscounted ?? false;
  const isValidating = activeState.status === 'validating-code';
  const isRedirecting = activeState.status === 'redirecting';

  return (
    <div className="min-h-screen bg-[#030617] text-[#CBD5E1] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Header with Wordmark and Security badge */}
      <div className="max-w-5xl mx-auto flex items-center justify-between pb-6 mb-8 border-b border-[#1A2342]">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('landing')}
          className="flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-[#CA3A32] rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-[#CA3A32] flex items-center justify-center font-display font-black text-sm text-[#F8FAFC]">
            FS
          </div>
          <span className="font-display font-black tracking-wider text-base text-[#F8FAFC]">
            {config.org.wordmark}
          </span>
        </button>

        <div className="flex items-center gap-3 text-xs font-mono text-[#8492A6]">
          <span className="hidden sm:flex items-center gap-1.5 text-[#059669]">
            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
          </span>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="hover:text-[#F8FAFC] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-[#F8FAFC] tracking-tight">
            Complete Your Enrollment
          </h1>
          <p className="text-[15px] text-[#8492A6] mt-1">
            Instant dashboard unlock and Telegram community onboarding.
          </p>
        </div>

        {/* Global States Banners */}
        {activeState.status === 'success' && (
          <div className="mb-8 p-6 rounded-2xl bg-[#059669]/10 border border-[#059669]/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#059669]/20 text-[#059669] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="font-display font-bold text-2xl text-[#F8FAFC]">
              Payment Successful & Enrollment Confirmed!
            </h2>
            <p className="text-[15px] text-[#CBD5E1] max-w-md mx-auto">
              Your access pass to <span className="text-[#F8FAFC] font-semibold">{tier.name}</span> has been granted.
              Reference: <span className="font-mono text-[#F8FAFC]">{activeState.reference}</span>
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate && onNavigate('dashboard')}
              >
                Go to Student Dashboard
              </Button>
            </div>
          </div>
        )}

        {activeState.status === 'error' && (
          <div className="mb-8 p-4 rounded-xl bg-[#CA3A32]/10 border border-[#CA3A32]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#CA3A32] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-[#F8FAFC] text-sm">Payment Processing Interrupted</h4>
              <p className="text-xs text-[#CBD5E1]">{activeState.error}</p>
            </div>
          </div>
        )}

        {/* Responsive Grid: Two-column on desktop, Mobile Summary FIRST (flex-col-reverse lg:grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Order Summary Card (On mobile, displayed first via order-1 lg:order-1) */}
          <div className="lg:col-span-6 order-1 lg:order-1">
            <Card id="checkout-order-summary" className="p-6 sm:p-7 bg-[#0A0F29] border-[#1A2342] rounded-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#1A2342]">
                <h3 className="font-display font-bold text-lg text-[#F8FAFC]">
                  Order Summary
                </h3>
                <Badge variant={tier.isPremium ? 'accent' : 'neutral'} size="sm">
                  {tier.tag || 'Tuition'}
                </Badge>
              </div>

              {/* Product Info */}
              <div className="py-5 border-b border-[#1A2342] space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-display font-bold text-lg text-[#F8FAFC]">
                      {tier.name}
                    </h4>
                    <p className="text-xs text-[#8492A6] mt-0.5">
                      {tier.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-lg text-[#F8FAFC]">
                      {koboToNaira(basePriceKobo)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Discount Code Input Section */}
              <div className="py-5 border-b border-[#1A2342] space-y-3">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#8492A6]">
                  Discount Code or Invite Voucher
                </label>

                {appliedPreview ? (
                  <div className="p-3.5 rounded-xl bg-[#030617] border border-[#059669]/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#059669]" />
                      <span className="font-mono font-bold text-sm text-[#F8FAFC]">
                        {appliedPreview.code}
                      </span>
                      <Badge variant="success" size="sm">
                        {appliedPreview.discountPercent}% OFF
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      aria-label="Remove applied discount code"
                      className="p-1 rounded text-[#8492A6] hover:text-[#CA3A32] hover:bg-[#1A2342] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      id="checkout-coupon-input"
                      type="text"
                      placeholder="e.g. FLAG50 or ALUMNI100"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      disabled={isValidating}
                      className="flex-1 px-3.5 py-2.5 bg-[#030617] border border-[#1A2342] focus:border-[#CA3A32] focus:ring-1 focus:ring-[#CA3A32] text-[15px] font-mono uppercase text-[#F8FAFC] placeholder-[#8492A6] rounded-xl outline-none transition-colors"
                    />
                    <Button
                      id="btn-apply-coupon"
                      type="submit"
                      variant="secondary"
                      size="md"
                      loading={isValidating}
                      disabled={!couponInput || isValidating}
                    >
                      Apply
                    </Button>
                  </form>
                )}

                {activeState.status === 'code-invalid' && (
                  <p className="text-xs text-[#CA3A32] flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {activeState.error}
                  </p>
                )}
              </div>

              {/* Price Line Breakdown */}
              <div className="py-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-[#8492A6]">
                  <span>Subtotal</span>
                  <span className="font-mono">{koboToNaira(basePriceKobo)}</span>
                </div>

                {appliedPreview && (
                  <div className="flex justify-between text-[#CA3A32] font-semibold">
                    <span className="flex items-center gap-1">
                      Discount ({appliedPreview.code})
                    </span>
                    <span className="font-mono">
                      -{koboToNaira(appliedPreview.discountAmountKobo)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#1A2342] flex items-baseline justify-between">
                  <div>
                    <span className="font-display font-bold text-base text-[#F8FAFC]">
                      Total Due Today
                    </span>
                    <span className="block text-[11px] text-[#8492A6]">
                      Includes all materials, taxes & updates
                    </span>
                  </div>
                  <div className="text-right">
                    {appliedPreview && (
                      <span className="font-mono text-xs text-[#8492A6] line-through block">
                        {koboToNaira(basePriceKobo)}
                      </span>
                    )}
                    <span className="font-mono font-bold text-2xl text-[#F8FAFC]">
                      {koboToNaira(finalAmountKobo)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: Payer Details & Payment Gateway Action (Order 2) */}
          <div className="lg:col-span-6 order-2 lg:order-2">
            <Card className="p-6 sm:p-7 bg-[#0A0F29] border-[#1A2342] rounded-2xl">
              <div className="pb-4 mb-6 border-b border-[#1A2342] flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-[#F8FAFC]">
                  Student Access Details
                </h3>
                {isLoggedIn ? (
                  <span className="text-xs font-mono text-[#059669]">Logged in</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('login')}
                    className="text-xs text-[#CA3A32] hover:underline"
                  >
                    Already a student? Log in
                  </button>
                )}
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <Input
                  id="checkout-name"
                  type="text"
                  label="Full Name"
                  placeholder="Your legal or preferred name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  readOnly={isLoggedIn}
                />

                <Input
                  id="checkout-email"
                  type="email"
                  label="Delivery Email Address"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  readOnly={isLoggedIn}
                />

                {/* SPECIAL CASE: FULLY DISCOUNTED ALUMNI PATH */}
                {isFree ? (
                  <div className="pt-3 space-y-4">
                    <div className="p-4 rounded-xl bg-[#059669]/10 border border-[#059669]/30 text-xs text-[#10B981] space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-sm text-[#F8FAFC]">
                        <Sparkles className="w-4 h-4 text-[#059669]" /> 100% Alumni Pass Activated
                      </p>
                      <p>
                        Zero payment required. Access will be linked immediately to {email}.
                      </p>
                    </div>

                    <Button
                      id="btn-claim-access"
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={isRedirecting}
                      className="font-bold text-lg bg-[#059669] hover:bg-[#047857] shadow-lg shadow-[#059669]/20"
                    >
                      Claim Full Access (Free)
                    </Button>
                    <p className="font-mono text-[11px] text-[#8492A6] text-center">
                      // TODO(handoff): wire to enrollment
                    </p>
                  </div>
                ) : (
                  /* STANDARD PAYSTACK PAYMENT FLOW */
                  <div className="pt-3 space-y-4">
                    <button
                      id="btn-paystack-checkout"
                      type="submit"
                      disabled={isRedirecting}
                      className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-[#00C3F7] hover:bg-[#00B4E6] active:scale-[0.99] text-[#030617] font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-xl shadow-[#00C3F7]/15 transition-all focus:outline-none focus:ring-2 focus:ring-[#00C3F7]"
                    >
                      {isRedirecting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Connecting to Paystack...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Pay {koboToNaira(finalAmountKobo)} with Paystack</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#8492A6]">
                      <Building2 className="w-3.5 h-3.5 text-[#8492A6]" />
                      <span>Card or bank transfer · Naira</span>
                    </div>

                    <p className="font-mono text-[11px] text-[#8492A6] text-center">
                      // TODO(handoff): wire to checkout
                    </p>
                  </div>
                )}

                {/* Refund policy footer */}
                <div className="pt-4 border-t border-[#1A2342] text-center">
                  <p className="text-xs text-[#8492A6] leading-relaxed">
                    Protected by the{' '}
                    <span className="text-[#CBD5E1] font-semibold">
                      Flag Skool 7-Day Money-Back Guarantee
                    </span>
                    . If the course does not deliver practical engineering value, email{' '}
                    <a
                      href={`mailto:${config.org.supportEmail}`}
                      className="text-[#CA3A32] underline"
                    >
                      {config.org.supportEmail}
                    </a>{' '}
                    for a 100% full refund.
                  </p>
                </div>
              </form>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};
