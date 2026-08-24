import React, { useState } from 'react';
import { config } from '@/config/flagskool.config';
import {
  DevState,
  Page,
  CheckoutState,
  RedeemState,
  LoadState,
  LoginFormValues,
  SignupFormValues,
  ForgotPasswordFormValues,
  ResetPasswordFormValues,
} from '@/types/index';

// Landing Page Components
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PromoBar } from './components/PromoBar';
import { FreePreviewSection } from './components/FreePreviewSection';
import { OutcomesSection } from './components/OutcomesSection';
import { CurriculumSection } from './components/CurriculumSection';
import { PricingSection } from './components/PricingSection';
import { InstructorSection } from './components/InstructorSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';

// Modals
import { PreviewVideoModal } from './components/PreviewVideoModal';
import { CheckoutModal } from './components/CheckoutModal';
import { LoginModal } from './components/LoginModal';
import { RefundPolicyModal } from './components/RefundPolicyModal';

// Auth Components & Layout
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { VerifyEmailView } from './components/auth/VerifyEmailView';

// Transactional Pages
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPendingPage } from './pages/PaymentPendingPage';
import { RedeemPage } from './pages/RedeemPage';

// Logged-in Student Experience Pages
import { DashboardPage } from './pages/DashboardPage';
import { LearnPage } from './pages/LearnPage';
import { VaultPage } from './pages/VaultPage';
import { AccountPage } from './pages/AccountPage';

// Dev State Switcher
import { DevStateSwitcher } from './components/DevStateSwitcher';

export default function App() {
  // Navigation State (Default to landing or hash-based route)
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const raw = window.location.hash.replace('#/', '').replace('#', '');
      const parts = raw.split('/');
      const route = parts[0] as Page;
      const validPages: Page[] = [
        'landing',
        'login',
        'signup',
        'forgot',
        'reset',
        'verify-email',
        'checkout',
        'payment-pending',
        'redeem',
        'dashboard',
        'learn',
        'vault',
        'account',
      ];
      if (validPages.includes(route)) return route;
    }
    return 'landing';
  });

  const [activeLessonId, setActiveLessonId] = useState<string>('les-3-2');

  // Selected product SKU for checkout
  const [selectedProductSku, setSelectedProductSku] = useState<'cohort' | 'recordings'>('cohort');

  // Development State Switcher Configuration
  const [devState, setDevState] = useState<DevState>({
    promoState: 'live',
    testimonialsState: 'populated',
    progressVariant: 'partial',
    commentsVariant: 'populated',
    resourcesVariant: 'populated',
    lessonAccessVariant: 'unlocked',
    dataSaverVariant: 'off',
  });

  // Controlled Transactional States
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ status: 'idle' });
  const [redeemState, setRedeemState] = useState<RedeemState>({ status: 'idle' });
  const [isPendingDelayed, setIsPendingDelayed] = useState(false);

  // Controlled Auth Form States
  const [loginState, setLoginState] = useState<LoadState<void>>({ status: 'idle' });
  const [signupState, setSignupState] = useState<LoadState<void>>({ status: 'idle' });
  const [forgotState, setForgotState] = useState<LoadState<void>>({ status: 'idle' });
  const [resetState, setResetState] = useState<LoadState<void>>({ status: 'idle' });
  const [resendEmailState, setResendEmailState] = useState<LoadState<void>>({ status: 'idle' });

  // Modals for in-page landing interactions
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // Synchronize hash in URL for smooth back/forward browser support
  const handleNavigate = (page: Page, lessonId?: string) => {
    setCurrentPage(page);
    if (lessonId) {
      setActiveLessonId(lessonId);
    }
    if (typeof window !== 'undefined') {
      const hash = page === 'landing' ? '' : page === 'learn' && lessonId ? `learn/${lessonId}` : page;
      window.location.hash = `/${hash}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDevStateChange = (newState: Partial<DevState>) => {
    setDevState((prev) => ({ ...prev, ...newState }));
  };

  const handleOpenCheckout = (tierId: 'recordings' | 'cohort' = 'cohort') => {
    setSelectedProductSku(tierId);
    handleNavigate('checkout');
  };

  // ----------------------------------------------------
  // PURE PRESENTATIONAL AUTH HANDLERS (Controlled Parents)
  // ----------------------------------------------------

  const handleLoginSubmit = (values: LoginFormValues) => {
    // TODO(handoff): replace with real auth call
    setLoginState({ status: 'loading' });
    setTimeout(() => {
      setLoginState({ status: 'success', data: undefined });
      setTimeout(() => {
        handleNavigate('dashboard');
      }, 700);
    }, 900);
  };

  const handleGoogleAuth = () => {
    // TODO(handoff): replace with real auth call
    setLoginState({ status: 'loading' });
    setSignupState({ status: 'loading' });
    setTimeout(() => {
      setLoginState({ status: 'success', data: undefined });
      setSignupState({ status: 'success', data: undefined });
      setTimeout(() => {
        handleNavigate('dashboard');
      }, 700);
    }, 900);
  };

  const handleSignupSubmit = (values: SignupFormValues) => {
    // TODO(handoff): replace with real auth call
    setSignupState({ status: 'loading' });
    setTimeout(() => {
      setSignupState({ status: 'success', data: undefined });
      setTimeout(() => {
        handleNavigate('verify-email');
      }, 700);
    }, 900);
  };

  const handleForgotSubmit = (values: ForgotPasswordFormValues) => {
    // TODO(handoff): replace with real auth call
    setForgotState({ status: 'loading' });
    setTimeout(() => setForgotState({ status: 'success', data: undefined }), 900);
  };

  const handleResetSubmit = (values: ResetPasswordFormValues) => {
    // TODO(handoff): replace with real auth call
    setResetState({ status: 'loading' });
    setTimeout(() => setResetState({ status: 'success', data: undefined }), 900);
  };

  const handleResendEmail = () => {
    // TODO(handoff): replace with real auth call
    setResendEmailState({ status: 'loading' });
    setTimeout(() => setResendEmailState({ status: 'success', data: undefined }), 900);
  };

  // Switch unified auth form load state from dev switcher
  const handleSetUnifiedAuthState = (newState: LoadState<void>) => {
    setLoginState(newState);
    setSignupState(newState);
    setForgotState(newState);
    setResetState(newState);
    setResendEmailState(newState);
  };

  return (
    <div className="min-h-screen bg-[#030617] text-[#CBD5E1] font-sans selection:bg-[#CA3A32] selection:text-[#F8FAFC]">
      
      {/* -------------------------------------------------- */}
      {/* ROUTE 1: /login */}
      {/* -------------------------------------------------- */}
      {currentPage === 'login' && (
        <AuthLayout
          title="Sign In to Student Portal"
          subtitle="Access your lecture recordings, n8n templates, and live weekend sessions."
          config={config}
          onNavigate={handleNavigate}
        >
          <LoginForm
            state={loginState}
            onSubmit={handleLoginSubmit}
            onGoogleSignIn={handleGoogleAuth}
            onNavigate={handleNavigate}
          />
        </AuthLayout>
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 2: /signup */}
      {/* -------------------------------------------------- */}
      {currentPage === 'signup' && (
        <AuthLayout
          title="Create Student Account"
          subtitle="Join 750+ Nigerian engineers mastering autonomous agents & enterprise AI workflows."
          config={config}
          onNavigate={handleNavigate}
        >
          <SignupForm
            state={signupState}
            onSubmit={handleSignupSubmit}
            onGoogleSignIn={handleGoogleAuth}
            onNavigate={handleNavigate}
          />
        </AuthLayout>
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 3: /forgot */}
      {/* -------------------------------------------------- */}
      {currentPage === 'forgot' && (
        <AuthLayout
          title="Reset Password"
          config={config}
          onNavigate={handleNavigate}
        >
          <ForgotPasswordForm
            state={forgotState}
            onSubmit={handleForgotSubmit}
            onNavigate={handleNavigate}
          />
        </AuthLayout>
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 4: /reset */}
      {/* -------------------------------------------------- */}
      {currentPage === 'reset' && (
        <AuthLayout
          title="Set New Password"
          config={config}
          onNavigate={handleNavigate}
        >
          <ResetPasswordForm
            state={resetState}
            onSubmit={handleResetSubmit}
            onNavigate={handleNavigate}
          />
        </AuthLayout>
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 5: /verify-email */}
      {/* -------------------------------------------------- */}
      {currentPage === 'verify-email' && (
        <AuthLayout
          title="Verify Email Address"
          config={config}
          onNavigate={handleNavigate}
        >
          <VerifyEmailView
            email="chidi.okonkwo@gmail.com"
            resendState={resendEmailState}
            onResend={handleResendEmail}
            onNavigate={handleNavigate}
          />
        </AuthLayout>
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 6: /checkout */}
      {/* -------------------------------------------------- */}
      {currentPage === 'checkout' && (
        <CheckoutPage
          config={config}
          productSku={selectedProductSku}
          checkoutState={checkoutState}
          onNavigate={handleNavigate}
          onStateChange={setCheckoutState}
        />
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 7: /payment-pending */}
      {/* -------------------------------------------------- */}
      {currentPage === 'payment-pending' && (
        <PaymentPendingPage
          config={config}
          reference="FLG-84920193"
          forceDelayedState={isPendingDelayed}
          onNavigate={handleNavigate}
        />
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 8: /redeem */}
      {/* -------------------------------------------------- */}
      {currentPage === 'redeem' && (
        <RedeemPage
          config={config}
          redeemState={redeemState}
          onNavigate={handleNavigate}
          onStateChange={setRedeemState}
        />
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 9: /dashboard */}
      {/* -------------------------------------------------- */}
      {currentPage === 'dashboard' && (
        <DashboardPage
          config={config}
          progressVariant={devState.progressVariant}
          onNavigate={handleNavigate}
          onOpenCheckout={handleOpenCheckout}
        />
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 10: /learn (LESSON PLAYER) */}
      {/* -------------------------------------------------- */}
      {currentPage === 'learn' && (
        <LearnPage
          config={config}
          lessonId={activeLessonId}
          commentsVariant={devState.commentsVariant}
          resourcesVariant={devState.resourcesVariant}
          lessonAccessVariant={devState.lessonAccessVariant}
          dataSaverVariant={devState.dataSaverVariant}
          onNavigate={handleNavigate}
          onOpenCheckout={handleOpenCheckout}
        />
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 11: /vault */}
      {/* -------------------------------------------------- */}
      {currentPage === 'vault' && (
        <VaultPage
          config={config}
          resourcesVariant={devState.resourcesVariant}
          onNavigate={handleNavigate}
        />
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 12: /account */}
      {/* -------------------------------------------------- */}
      {currentPage === 'account' && (
        <AccountPage
          config={config}
          onNavigate={handleNavigate}
          onLogout={() => handleNavigate('login')}
        />
      )}

      {/* -------------------------------------------------- */}
      {/* ROUTE 13: / (LANDING PAGE) */}
      {/* -------------------------------------------------- */}
      {currentPage === 'landing' && (
        <>
          {/* 1. NAVBAR */}
          <Navbar
            config={config}
            onLoginClick={() => handleNavigate('login')}
            onGetAccessClick={() => handleOpenCheckout('cohort')}
          />

          <main className="w-full">
            {/* 2. HERO SECTION */}
            <HeroSection
              config={config}
              onGetAccessClick={() => handleOpenCheckout('cohort')}
              onWatchFreeLesson={() => setIsVideoModalOpen(true)}
            />

            {/* 3. PROMO BAR */}
            <PromoBar
              config={config}
              promoState={devState.promoState}
              onClaimPromo={() => {
                const el = document.getElementById('pricing-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 4. FREE PREVIEW SECTION */}
            <FreePreviewSection
              config={config}
              onPlayPreview={() => setIsVideoModalOpen(true)}
            />

            {/* 5. OUTCOMES SECTION */}
            <OutcomesSection config={config} />

            {/* 6. CURRICULUM SECTION */}
            <CurriculumSection onSelectFreeLesson={() => setIsVideoModalOpen(true)} />

            {/* 7. PRICING SECTION */}
            <PricingSection
              config={config}
              promoState={devState.promoState}
              onSelectTier={handleOpenCheckout}
            />

            {/* 8. INSTRUCTOR SECTION */}
            <InstructorSection config={config} />

            {/* 9. TESTIMONIALS SECTION */}
            <TestimonialsSection
              testimonialsState={devState.testimonialsState}
              onShareStoryClick={() => handleOpenCheckout('cohort')}
            />

            {/* 10. FAQ SECTION */}
            <FaqSection config={config} />
          </main>

          {/* 11. FOOTER */}
          <Footer
            config={config}
            onOpenRefundModal={() => setIsRefundModalOpen(true)}
            onNavigate={handleNavigate}
          />
        </>
      )}

      {/* -------------------------------------------------- */}
      {/* DEV STATE SWITCHER (Present on all pages) */}
      {/* -------------------------------------------------- */}
      <DevStateSwitcher
        devState={devState}
        onDevStateChange={handleDevStateChange}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        authFormState={loginState}
        onSetAuthFormState={handleSetUnifiedAuthState}
        checkoutState={checkoutState}
        onSetCheckoutState={setCheckoutState}
        redeemState={redeemState}
        onSetRedeemState={setRedeemState}
        isPendingDelayed={isPendingDelayed}
        onTogglePendingDelayed={setIsPendingDelayed}
      />

      {/* -------------------------------------------------- */}
      {/* PRESENTATION MODALS */}
      {/* -------------------------------------------------- */}
      <PreviewVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        config={config}
        onProceedToEnroll={() => {
          setIsVideoModalOpen(false);
          handleOpenCheckout('cohort');
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        selectedTierId={selectedProductSku}
        config={config}
        promoState={devState.promoState}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        config={config}
        onGetAccessClick={() => {
          setIsLoginModalOpen(false);
          handleOpenCheckout('cohort');
        }}
      />

      <RefundPolicyModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        config={config}
      />
    </div>
  );
}
