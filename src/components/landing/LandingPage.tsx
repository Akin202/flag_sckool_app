'use client';

import { useState } from 'react';
import { config } from '@/config/flagskool.config';
import type { FAQItem, Testimonial } from '@/types/index';

import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { PromoBar } from '@/components/PromoBar';
import { FreePreviewSection } from '@/components/FreePreviewSection';
import { OutcomesSection } from '@/components/OutcomesSection';
import { CurriculumSection } from '@/components/CurriculumSection';
import { PricingSection } from '@/components/PricingSection';
import { InstructorSection } from '@/components/InstructorSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { FaqSection } from '@/components/FaqSection';
import { Footer } from '@/components/Footer';

import { PreviewVideoModal } from '@/components/PreviewVideoModal';
import { LoginModal } from '@/components/LoginModal';
import { RefundPolicyModal } from '@/components/RefundPolicyModal';

import { useRouter } from 'next/navigation';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useDevState } from '@/components/dev/DevStateProvider';

export interface LandingPageProps {
  faqs: FAQItem[];
  testimonials: Testimonial[];
}

export function LandingPage({ faqs, testimonials }: LandingPageProps) {
  const router = useRouter();
  const navigate = useAppNavigate();
  const { devState } = useDevState();

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // The selected tier used to be App.tsx state; as its own route it belongs
  // in the URL so checkout is shareable and survives a refresh.
  const openCheckout = (tierId: 'recordings' | 'cohort' = 'cohort') => {
    router.push(`/checkout?sku=${tierId}`);
  };

  const scrollToPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar
        config={config}
        onLoginClick={() => navigate('login')}
        onGetAccessClick={() => openCheckout('cohort')}
      />

      <main className="w-full">
        <HeroSection
          config={config}
          onGetAccessClick={() => openCheckout('cohort')}
          onWatchFreeLesson={() => setIsVideoModalOpen(true)}
        />

        <PromoBar
          config={config}
          promoState={devState.promoState}
          onClaimPromo={scrollToPricing}
        />

        <FreePreviewSection config={config} onPlayPreview={() => setIsVideoModalOpen(true)} />

        <OutcomesSection config={config} />

        <CurriculumSection onSelectFreeLesson={() => setIsVideoModalOpen(true)} />

        <PricingSection
          config={config}
          promoState={devState.promoState}
          onSelectTier={openCheckout}
        />

        <InstructorSection config={config} />

        <TestimonialsSection
          testimonials={testimonials}
          testimonialsState={devState.testimonialsState}
          onShareStoryClick={() => openCheckout('cohort')}
        />

        <FaqSection config={config} faqs={faqs} />
      </main>

      <Footer
        config={config}
        onOpenRefundModal={() => setIsRefundModalOpen(true)}
        onNavigate={navigate}
      />

      <PreviewVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        config={config}
        onProceedToEnroll={() => {
          setIsVideoModalOpen(false);
          openCheckout('cohort');
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        config={config}
        onGetAccessClick={() => {
          setIsLoginModalOpen(false);
          openCheckout('cohort');
        }}
      />

      <RefundPolicyModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        config={config}
      />
    </>
  );
}
