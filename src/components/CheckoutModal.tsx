import React, { useState } from 'react';
import { X, ShieldCheck, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Select } from './ui/FormControls';
import { Badge } from './ui/Badge';
import { FlagSkoolConfig, PromoState, activePriceKobo, koboToNaira } from '@/types/index';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTierId: 'recordings' | 'cohort';
  config: FlagSkoolConfig;
  promoState: PromoState;
  onCompleteHandoff?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedTierId,
  config,
  promoState,
  onCompleteHandoff,
}) => {
  const [activeTier, setActiveTier] = useState<'recordings' | 'cohort'>(selectedTierId);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card_transfer');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const isPromoLive = promoState === 'live';
  const tier = activeTier === 'recordings' ? config.pricing.recordings : config.pricing.cohort;
  const currentPriceKobo = activePriceKobo(tier, isPromoLive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pure front-end presentation mock callback — no network calls or persistence
    setIsSubmitted(true);
    if (onCompleteHandoff) {
      onCompleteHandoff();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-deep/90 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-ink-raised border border-ink-border rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-ink-border flex items-center justify-between bg-ink-deep">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-flag-red" />
            <h3 id="checkout-modal-title" className="font-display font-bold text-lg sm:text-xl text-paper-soft">
              Flag Skool Admissions Desk
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-lg bg-ink-border/60 hover:bg-ink-border text-muted-text hover:text-paper-soft flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-flag-red"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          /* Presentation Handoff Confirmation Notice */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#064E3B] text-[#A7F3D0] flex items-center justify-center mx-auto border border-[#059669]/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-display text-2xl font-bold text-paper-soft">
              Handoff Placeholder
            </h4>
            <p className="text-[16px] text-body-text max-w-md mx-auto leading-relaxed">
              This is the visual front-end presentation. When the backend engineer wires up payment processing (Paystack/Flutterwave/Stripe), submitting this form initiates the secure transaction.
            </p>
            <div className="p-4 rounded-xl bg-ink-deep border border-ink-border font-mono text-xs text-muted-text text-left max-w-md mx-auto space-y-1">
              <div>// TODO(handoff): wire to checkout</div>
              <div>// Tier: {tier.name}</div>
              <div>// Amount: {koboToNaira(currentPriceKobo)}</div>
              <div>// Payment Provider: {paymentMethod}</div>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <Button variant="secondary" size="md" onClick={() => setIsSubmitted(false)}>
                Back to form
              </Button>
              <Button variant="primary" size="md" onClick={onClose}>
                Close preview
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Package Selector */}
            <div>
              <label className="block text-[14px] font-mono uppercase tracking-wider text-muted-text mb-2 font-semibold">
                Select Admission Package:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTier('recordings')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTier === 'recordings'
                      ? 'bg-ink-deep border-flag-red shadow-md shadow-flag-red/10'
                      : 'bg-ink-deep/50 border-ink-border hover:border-[#2D3A63]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-paper-soft">Recordings</span>
                    {isPromoLive && <Badge variant="accent" size="sm">50% OFF</Badge>}
                  </div>
                  <div className="font-mono text-lg font-bold text-paper-soft">
                    {koboToNaira(activePriceKobo(config.pricing.recordings, isPromoLive))}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTier('cohort')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTier === 'cohort'
                      ? 'bg-ink-deep border-flag-red shadow-md shadow-flag-red/10'
                      : 'bg-ink-deep/50 border-ink-border hover:border-[#2D3A63]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-paper-soft">Live Cohort 2</span>
                    <Badge variant="accent" size="sm">Premium</Badge>
                  </div>
                  <div className="font-mono text-lg font-bold text-paper-soft">
                    {koboToNaira(activePriceKobo(config.pricing.cohort, isPromoLive))}
                  </div>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <Input
                id="checkout-full-name"
                label="Full Name"
                placeholder="e.g. Babatunde Adeleke"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                id="checkout-email"
                type="email"
                label="Email Address"
                placeholder="babatunde@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="Access credentials and recordings portal link will be delivered here."
                required
              />

              <Input
                id="checkout-phone"
                type="tel"
                label="WhatsApp / Telegram Phone Number"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                helperText="Used for automated invite to the VIP Telegram technical channel."
                required
              />

              <Select
                id="checkout-payment-method"
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'card_transfer', label: 'Nigerian Debit Card / Instant Bank Transfer / USSD' },
                  { value: 'intl_card', label: 'International Card (USD / GBP / EUR)' },
                  { value: 'crypto', label: 'USDT / USDC on Solana or Base' },
                ]}
              />
            </div>

            {/* Price Summary & Submit */}
            <div className="pt-4 border-t border-ink-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-muted-text block">Total Amount Due</span>
                <span className="font-mono text-2xl sm:text-3xl font-bold text-paper-soft">
                  {koboToNaira(currentPriceKobo)}
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto text-base font-bold shadow-lg shadow-flag-red/25"
              >
                Proceed to Checkout
              </Button>
            </div>

            <div className="flex items-center justify-between text-[12px] text-muted-text font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" /> 7-Day Money-Back Guarantee
              </span>
              <span>// TODO(handoff): wire to checkout</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
