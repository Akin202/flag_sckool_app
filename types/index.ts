export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  isFree?: boolean;
  bunnyVideoId: string;
  description?: string;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  lessonCount: number;
  totalDurationMinutes: number;
  description?: string;
  lessons: Lesson[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  initials: string;
  quote: string;
  avatarUrl?: string;
  cohort?: string;
  rating?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface PricingTier {
  id: 'recordings' | 'cohort';
  name: string;
  tag?: string;
  fullPriceKobo: number;
  promoPriceKobo?: number;
  isPremium?: boolean;
  description: string;
  features: string[];
  ctaText: string;
  footnote?: string;
}

export interface BrandConfig {
  inkDeep: string;
  inkRaised: string;
  inkBorder: string;
  flagRed: string;
  bodyText: string;
  mutedText: string;
  paperSoft: string;
}

export interface OrgConfig {
  name: string;
  wordmark: string;
  telegramUrl: string;
  xHandle: string;
  xUrl: string;
  supportEmail: string;
  refundPolicyUrl: string;
  instructorName: string;
}

export interface PromoConfig {
  label: string;
  endsAt: string;
  discountPercent: number;
  active: boolean;
}

export interface OutcomeBullet {
  id: string;
  title: string;
  description: string;
  iconName: 'bot' | 'workflow' | 'rocket';
}

export interface CopyConfig {
  heroHeadline: string;
  heroSubline: string;
  heroMutedStat: string;
  freePreviewCaption: string;
  outcomeBullets: OutcomeBullet[];
  instructorBioParagraphs: string[];
  auth: AuthCopyConfig;
}

export type VideoQuality = '360p' | '480p' | '720p' | '1080p';

export interface PlayerConfig {
  defaultQuality: VideoQuality;
  dataSaverQuality: VideoQuality;
  availableQualities: VideoQuality[];
  /** How often playback position is persisted to lesson_progress. */
  savePositionEverySeconds: number;
  /** Watched fraction (0-100) at which a lesson auto-marks complete. */
  markCompleteAtPercent: number;
}

export interface VideoConfig {
  /** TTL for a signed Bunny Stream URL. Short, because URLs get shared. */
  signedUrlTtlSeconds: number;
}

export interface AuthScreenCopy {
  title: string;
  subtitle?: string;
}

export interface AuthCopyConfig {
  login: AuthScreenCopy;
  signup: AuthScreenCopy;
  forgot: AuthScreenCopy;
  reset: AuthScreenCopy;
  verifyEmail: AuthScreenCopy;
}

export interface FlagSkoolConfig {
  brand: BrandConfig;
  org: OrgConfig;
  promo: PromoConfig;
  player: PlayerConfig;
  video: VideoConfig;
  copy: CopyConfig;
  pricing: {
    recordings: PricingTier;
    cohort: PricingTier;
  };
}

export type PromoState = 'live' | 'expired';
export type TestimonialsState = 'populated' | 'empty';

export type ProgressVariant = 'zero' | 'partial' | 'complete';
export type CommentsVariant = 'empty' | 'populated';
export type ResourcesVariant = 'empty' | 'populated';
export type LessonAccessVariant = 'unlocked' | 'locked';
export type DataSaverVariant = 'on' | 'off';

export interface DevState {
  promoState: PromoState;
  testimonialsState: TestimonialsState;
  progressVariant?: ProgressVariant;
  commentsVariant?: CommentsVariant;
  resourcesVariant?: ResourcesVariant;
  lessonAccessVariant?: LessonAccessVariant;
  dataSaverVariant?: DataSaverVariant;
  currentPage?: Page;
  currentLessonId?: string;
  authFormState?: 'idle' | 'loading' | 'success' | 'error';
  checkoutState?: 'idle' | 'validating-code' | 'code-invalid' | 'code-applied' | 'code-applied-alumni' | 'redirecting' | 'awaiting-webhook' | 'success' | 'error';
  redeemState?: 'idle' | 'checking' | 'invalid' | 'already-redeemed' | 'success' | 'error';
}

// ----------------------------------------------------
// TRANSACTIONAL & AUTH CONTRACTS
// ----------------------------------------------------

export type Page =
  | 'landing'
  | 'login'
  | 'signup'
  | 'forgot'
  | 'reset'
  | 'verify-email'
  | 'checkout'
  | 'payment-pending'
  | 'redeem'
  | 'dashboard'
  | 'learn'
  | 'vault'
  | 'account'
  | 'admin'
  | 'admin/students'
  | 'admin/sales'
  | 'admin/codes'
  | 'admin/content';

export type LoadState<T = void> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// ----------------------------------------------------
// ADMIN CONTRACTS
// ----------------------------------------------------

export interface AdminTransaction {
  id: string;
  date: string;
  studentName: string;
  studentEmail: string;
  product: 'cohort' | 'recordings';
  productName: string;
  amountKobo: number;
  discountCode?: string;
  status: 'paid' | 'pending' | 'refunded' | 'failed';
  reference: string;
}

export interface AdminOverviewStats {
  totalStudents: number;
  totalRevenueKobo: number;
  enrollmentsThisWeek: number;
  avgCourseCompletionPercent: number;
  recentTransactions: AdminTransaction[];
}

export interface StudentLessonProgressDetail {
  lessonId: string;
  lessonTitle: string;
  moduleNumber: number;
  moduleTitle: string;
  durationMinutes: number;
  isCompleted: boolean;
  lastPositionSeconds: number;
  lastPositionFormatted: string;
  completedAt?: string;
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  enrollments: string[];
  tier: 'cohort' | 'recordings';
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lastActive: string;
  joinedDate: string;
  isAlumni: boolean;
  lessonProgressList: StudentLessonProgressDetail[];
}

export interface AdminDiscountCode {
  id: string;
  code: string;
  kind: 'invite' | 'promo' | 'alumni';
  valueDescription: string;
  discountPercent?: number;
  discountKobo?: number;
  appliesTo: 'all' | 'cohort' | 'recordings';
  redemptionsUsed: number;
  maxRedemptions: number | null;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface GenerateCodesParams {
  count: number;
  product: 'all' | 'cohort' | 'recordings';
  kind: 'invite' | 'promo' | 'alumni';
  discountPercent?: number;
  discountKobo?: number;
  expiryDate?: string;
  maxRedemptionsPerCode?: number;
}

export interface AdminLesson extends Lesson {
  isPublished: boolean;
  resources: LessonResource[];
}

export interface AdminModule {
  id: string;
  number: number;
  title: string;
  description?: string;
  lessonCount: number;
  totalDurationMinutes: number;
  lessons: AdminLesson[];
}

export interface AdminLessonUpdatePayload {
  title: string;
  description: string;
  bunnyVideoId: string;
  durationMinutes: number;
  isFree: boolean;
  isPublished: boolean;
}

export interface DiscountPreview {
  code: string;
  discountPercent: number;
  discountAmountKobo: number;
  originalPriceKobo: number;
  finalPriceKobo: number;
  isFullyDiscounted: boolean;
}

export type CheckoutState =
  | { status: 'idle' }
  | { status: 'validating-code'; code: string }
  | { status: 'code-invalid'; code: string; error: string }
  | { status: 'code-applied'; preview: DiscountPreview }
  | { status: 'redirecting'; targetUrl?: string }
  | { status: 'awaiting-webhook'; reference: string }
  | { status: 'success'; reference: string }
  | { status: 'error'; error: string };

export type RedeemState =
  | { status: 'idle' }
  | { status: 'checking'; code: string }
  | { status: 'invalid'; code: string; error: string }
  | { status: 'already-redeemed'; code: string; error: string }
  | { status: 'success'; code: string; productName: string }
  | { status: 'error'; error: string };

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  agreeTerms: boolean;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

/**
 * The generic is the shape the form SUBMITS. The load state carries no payload
 * — these forms only ever report idle/loading/success/error.
 */
export interface AuthFormProps<TValues = void> {
  state: LoadState<void>;
  onSubmit: (values: TValues) => void;
  onGoogleSignIn?: () => void;
  onNavigate?: (page: Page) => void;
}

// ----------------------------------------------------
// LOGGED-IN STUDENT & RESOURCE DATA CONTRACTS
// ----------------------------------------------------

export type ResourceKind = 'blueprint' | 'code' | 'slide' | 'dataset' | 'doc';

export interface LessonResource {
  id: string;
  title: string;
  kind: ResourceKind;
  fileFormat: string; // e.g. 'JSON', 'ZIP', 'PDF', 'IPYNB', 'DOCX'
  sizeBytes: number;
  sizeFormatted: string;
  downloadUrl: string;
  lessonId?: string;
  moduleId?: string;
}

export interface VaultResource extends LessonResource {
  moduleNumber: number;
  moduleTitle: string;
  lessonTitle?: string;
  description?: string;
}

export interface LessonComment {
  id: string;
  lessonId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  authorIsAdmin?: boolean;
  createdAt: string;
  body: string;
  isPinned?: boolean;
}

export interface LessonProgress {
  lessonId: string;
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  lessonNumber: number;
  title: string;
  durationMinutes: number;
  lastPositionSeconds: number;
  totalSeconds: number;
  percentComplete: number;
  isCompleted: boolean;
}

export interface ModuleProgress {
  moduleId: string;
  moduleNumber: number;
  title: string;
  lessonCount: number;
  completedCount: number;
  percentComplete: number;
  isUnlocked: boolean;
  upgradeTierId?: 'cohort';
}

export interface CourseProgress {
  completedLessonsCount: number;
  totalLessonsCount: number;
  percentComplete: number;
  nextLesson: LessonProgress | null;
  modules: ModuleProgress[];
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'student' | 'alumni' | 'instructor';
  tier: 'cohort' | 'recordings';
  joinedDate: string;
}

export interface Enrollment {
  id: string;
  tierId: 'recordings' | 'cohort';
  tierName: string;
  purchaseDate: string;
  amountPaidKobo: number;
  status: 'active' | 'expired';
  reference: string;
}

/**
 * Converts integer kobo amount into formatted Nigerian Naira string (e.g. 10000000 -> "₦100,000").
 * Payment amounts are ALWAYS rendered through this function.
 */
export function koboToNaira(amountInKobo: number): string {
  const naira = Math.floor(amountInKobo / 100);
  return `₦${naira.toLocaleString('en-NG')}`;
}

/**
 * Estimates data consumption in MB for a given remaining duration in minutes and video quality.
 * Bitrate reference:
 * - 360p: ~0.45 Mbps (~3.4 MB/min)
 * - 480p: ~0.75 Mbps (~5.6 MB/min)
 * - 720p: ~1.8 Mbps (~13.5 MB/min)
 * - 1080p: ~3.5 Mbps (~26.25 MB/min)
 */
/**
 * The price to charge for a tier right now, in kobo. Single definition so the
 * promo ternary cannot drift between the pricing table, the modal, and
 * checkout.
 */
export function activePriceKobo(tier: PricingTier, isPromoActive: boolean): number {
  if (isPromoActive && typeof tier.promoPriceKobo === 'number') {
    return tier.promoPriceKobo;
  }
  return tier.fullPriceKobo;
}

export function estimateDataUsageMb(remainingMinutes: number, quality: VideoQuality): number {
  const mbPerMinMap: Record<VideoQuality, number> = {
    '360p': 3.4,
    '480p': 5.6,
    '720p': 13.5,
    '1080p': 26.25,
  };
  const rate = mbPerMinMap[quality] || 5.6;
  return Math.max(1, Math.round(remainingMinutes * rate));
}
