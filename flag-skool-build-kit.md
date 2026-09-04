# Flag Skool — Build Kit

**Software Composer pipeline · 24 August 2026**
Companion to `flag-skool-prd-v1.md`

Work through this in order. Do not skip to the prompts.

---

## 0. What the grounding revealed

**The brief said:** a platform where students watch Cohort 1 recordings, comment, DM the instructor, download from a Vault, take quizzes, earn badges and certificates, join a community, and attend a live September classroom — all built in one weekend, strictly in Google AI Studio.

**The artifacts said something narrower and better.** The Drive folder is thirteen lessons, each a single MP4 plus PDF resources, cleanly and consistently foldered. That is not a chaotic pile needing a content-management system. It is a finished course needing a paywall, a structure, and a completion engine.

**The gap:** the brief describes a Skool clone. The reality is a course that already exists and is not being sold. Those are different products. Building the Skool clone delays revenue by months; building the paywall starts revenue this week.

**The three grounding answers:**

1. **The screen that justifies the price is the lesson player** — with resume, progress, data-saver, and attached resources. Not the sales page. The sales page converts once; the player determines whether the student finishes, refers, and buys the ₦300k cohort. Protect its budget.

2. **The deployment reality is Nigerian mobile data on mid-tier Android.** Thirteen two-hour lessons at 720p is roughly 20GB per student — a meaningful fraction of what they paid, spent on bandwidth. This is an architectural constraint, not a preference. The player defaults to 480p with an explicit Data Saver toggle. Nobody will ever tell you data cost was why they stopped watching.

3. **Unspecified, needed before launch:** testimonials from the January cohort, sales page copy, final course title, Paystack live keys, Bunny library ID and security key, and the January student email list. All become config placeholders. None are hardcoded.

**Two things follow from this that were not in the brief:** completion is the product, and the discount code system is the pricing engine. Four different prices exist for two products. One table handles all of them, and handles referrals later without a schema change.

---

## 1. Phase 0 — Setup before any prompt

Gather these first. Half of them have lead times measured in days.

| Item | Where | Note |
| --- | --- | --- |
| Bunny.net account | bunny.net | Create a Stream library. Note Library ID + **Token Authentication Key**. Enable token auth. |
| Upload the 13 videos | Bunny dashboard | Do this now — encoding takes hours. Record each `videoId`. |
| Paystack account | paystack.com | Business verification takes 1–3 days in Nigeria. Start today. Test keys immediately, live keys after verification. |
| Supabase project | supabase.com | Region: choose the closest available to Lagos. |
| Resend account | resend.com | Verify a sending domain — DNS propagation takes hours. `mail.flagskool.com` or similar. |
| Domain | — | Decide the production URL now; it goes in config. |
| January student emails | Your records | Needed to generate alumni invite codes. |
| Testimonials | Telegram `@flagskool` | **Start asking today.** This has the longest human lead time of anything on this list. |
| Sales copy | You | Headline, promise, outcome. Placeholder text ships nothing. |

**Do not connect any of these to Google AI Studio.** No keys, no environment variables, no connected services. An empty environment is the strongest available signal that backend work is out of scope, and AI Studio will provision infrastructure unprompted if given the chance.

---

## 2. The contracts

Three files. Written before any prompt is sent to any tool. They are the interface between AI Studio and Claude Code, and neither gets to redesign them.

Create these locally first, then paste them verbatim into Prompt 1.

### 2.1 `/types/index.ts`

```ts
// ============================================================
// Flag Skool — data model contract
// The database schema will be built to match this exactly.
// Do not extend, rename, or "improve" these types.
// ============================================================

export type UUID = string;
export type ISODate = string;
/** All money is stored in kobo. ₦80,000 = 8_000_000 */
export type Kobo = number;

// ---------- Tenancy ----------
// One row today (Flag Skool). Present so multi-tenant is a
// weekend later instead of a rewrite.
export interface Organization {
  id: UUID;
  slug: string;
  name: string;
  createdAt: ISODate;
}

// ---------- People ----------
export type UserRole = "student" | "admin";

export interface Profile {
  id: UUID;
  orgId: UUID;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isAlumni: boolean;          // January 2026 cohort
  createdAt: ISODate;
  lastActiveAt: ISODate | null;
}

// ---------- Catalogue ----------
export type ProductSku = "recordings" | "cohort-sept-2026";

export interface Product {
  id: UUID;
  orgId: UUID;
  sku: ProductSku;
  title: string;
  subtitle: string;
  priceKobo: Kobo;
  isActive: boolean;
  /** SKUs this product also grants. cohort → ["recordings"] */
  grantsSkus: ProductSku[];
}

export interface Module {
  id: UUID;
  orgId: UUID;
  productSku: ProductSku;
  order: number;
  title: string;
  description: string;
  lessonCount: number;
}

export interface Lesson {
  id: UUID;
  orgId: UUID;
  moduleId: UUID;
  order: number;
  title: string;
  description: string;
  /** Bunny Stream video GUID. Never a playable URL. */
  bunnyVideoId: string;
  durationSeconds: number;
  /** Lesson 1 only. Renders publicly without enrollment. */
  isFreePreview: boolean;
  publishedAt: ISODate | null;
}

export type ResourceKind = "pdf" | "code" | "prompt" | "template" | "link" | "other";

export interface Resource {
  id: UUID;
  orgId: UUID;
  lessonId: UUID | null;      // null = module-level bonus resource
  moduleId: UUID;
  title: string;
  kind: ResourceKind;
  storagePath: string;        // Supabase Storage path. Never a signed URL.
  sizeBytes: number;
  externalUrl: string | null; // only when kind === "link"
}

// ---------- Access ----------
export type EnrollmentSource = "purchase" | "invite" | "comp";

export interface Enrollment {
  id: UUID;
  orgId: UUID;
  userId: UUID;
  productSku: ProductSku;
  source: EnrollmentSource;
  transactionId: UUID | null;
  discountCodeId: UUID | null;
  createdAt: ISODate;
  expiresAt: ISODate | null;  // null = lifetime
}

// ---------- Pricing engine ----------
export type DiscountKind =
  | "promo"     // LAUNCH20 — public, time-boxed
  | "invite"    // ALUMNI-XXXX — single use, 100% off
  | "alumni"    // ALUMNI200 — email-restricted
  | "credit"    // auto-generated upgrade credit
  | "referral"; // v2. Present so v2 needs no migration.

export type DiscountValue =
  | { type: "percentage"; percent: number }
  | { type: "fixed"; amountKobo: Kobo }
  | { type: "full" };

export interface DiscountCode {
  id: UUID;
  orgId: UUID;
  code: string;               // uppercase, unique per org
  kind: DiscountKind;
  value: DiscountValue;
  appliesToSku: ProductSku;
  maxRedemptions: number | null;   // null = unlimited
  redemptionCount: number;
  restrictedToEmail: string | null;
  ownerUserId: UUID | null;        // referrals, v2
  startsAt: ISODate | null;
  expiresAt: ISODate | null;
  isActive: boolean;
}

export interface DiscountPreview {
  code: string;
  originalKobo: Kobo;
  discountKobo: Kobo;
  finalKobo: Kobo;
  /** true → skip Paystack entirely, enroll directly */
  isFullyDiscounted: boolean;
}

// ---------- Money ----------
export type TransactionStatus = "pending" | "success" | "failed" | "abandoned";

export interface Transaction {
  id: UUID;
  orgId: UUID;
  userId: UUID;
  productSku: ProductSku;
  reference: string;          // Paystack reference
  amountKobo: Kobo;
  discountCodeId: UUID | null;
  status: TransactionStatus;
  paidAt: ISODate | null;
  createdAt: ISODate;
}

// ---------- Completion engine ----------
export interface LessonProgress {
  id: UUID;
  orgId: UUID;
  userId: UUID;
  lessonId: UUID;
  positionSeconds: number;
  completedAt: ISODate | null;
  lastWatchedAt: ISODate;
}

export interface ModuleProgress {
  moduleId: UUID;
  title: string;
  order: number;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
}

export interface CourseProgress {
  productSku: ProductSku;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  modules: ModuleProgress[];
  /** Powers the single dashboard CTA. null once finished. */
  nextLesson: {
    lessonId: UUID;
    moduleId: UUID;
    title: string;
    moduleTitle: string;
    resumeAtSeconds: number;
  } | null;
}

// ---------- Discussion ----------
export interface Comment {
  id: UUID;
  orgId: UUID;
  lessonId: UUID;
  userId: UUID;
  authorName: string;
  authorAvatarUrl: string | null;
  authorIsAdmin: boolean;
  body: string;
  isPinned: boolean;
  createdAt: ISODate;
}

// ---------- Playback ----------
export type VideoQuality = "auto" | "1080p" | "720p" | "480p" | "360p";

/** Issued server-side only, after an enrollment check. Short expiry. */
export interface SignedPlayback {
  embedUrl: string;
  expiresAt: ISODate;
  watermark: { name: string; email: string };
}

// ---------- Async state ----------
export type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty" }
  | { status: "error"; message: string };

export type CheckoutState =
  | { status: "idle" }
  | { status: "validating-code" }
  | { status: "code-invalid"; message: string }
  | { status: "code-applied"; preview: DiscountPreview }
  | { status: "redirecting" }
  | { status: "awaiting-webhook"; reference: string }
  | { status: "success"; productSku: ProductSku }
  | { status: "error"; message: string };

export type RedeemState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "invalid"; message: string }
  | { status: "already-redeemed" }
  | { status: "success"; productSku: ProductSku }
  | { status: "error"; message: string };

// ---------- Pure helpers ----------
// Used by BOTH the UI and the server. One definition, no drift.

export function koboToNaira(kobo: Kobo): string {
  return "₦" + (kobo / 100).toLocaleString("en-NG");
}

export function applyDiscount(priceKobo: Kobo, value: DiscountValue): Kobo {
  switch (value.type) {
    case "full":
      return 0;
    case "percentage":
      return Math.max(0, Math.round(priceKobo * (1 - value.percent / 100)));
    case "fixed":
      return Math.max(0, priceKobo - value.amountKobo);
  }
}

export function computeModuleProgress(
  moduleId: UUID,
  title: string,
  order: number,
  lessons: Lesson[],
  progress: LessonProgress[]
): ModuleProgress {
  const ids = new Set(lessons.filter(l => l.moduleId === moduleId).map(l => l.id));
  const done = progress.filter(p => ids.has(p.lessonId) && p.completedAt !== null).length;
  return {
    moduleId,
    title,
    order,
    totalLessons: ids.size,
    completedLessons: done,
    percentComplete: ids.size === 0 ? 0 : Math.round((done / ids.size) * 100),
  };
}

export function estimateDataUsageMb(durationSeconds: number, quality: VideoQuality): number {
  const mbPerMinute: Record<VideoQuality, number> = {
    "1080p": 22, "720p": 12, "480p": 5, "360p": 3, auto: 12,
  };
  return Math.round((durationSeconds / 60) * mbPerMinute[quality]);
}
```

### 2.2 `/config/flagskool.config.ts`

Every instance-specific value. Nothing here may be hardcoded into a component. This file is what makes the build resellable — swap it and you have a different school.

```ts
export const config = {
  org: {
    slug: "flag-skool",
    name: "Flag Skool",
    tagline: "Become an AI generalist.",
    instructor: "Solarin Akintunde Oluwatobi",
    instructorShort: "Mustang",
    supportEmail: "TODO(handoff): support email",
    telegramHandle: "@flagskool",
    telegramUrl: "https://t.me/flagskool",
    twitterHandle: "@mustang_akin",
    productionUrl: "TODO(handoff): production URL",
  },

  brand: {
    colors: {
      flagRed:     "#CA3A32",
      inkDeep:     "#030617",
      inkRaised:   "#121826",
      inkBorder:   "#212936",
      paperSoft:   "#F9FAFC",
      paperBorder: "#E5E7EB",
      bodyText:    "#C9CDD6",
      mutedText:   "#8B92A0",
    },
    fonts: {
      display: "Fraunces",        // headings only
      body:    "Instrument Sans", // body and UI
      mono:    "JetBrains Mono",  // code
    },
  },

  products: {
    recordings: {
      sku: "recordings" as const,
      title: "AI Generalist — Cohort 1 Recordings",
      subtitle: "13 lessons. Five modules. Lifetime access.",
      priceKobo: 10_000_000,   // ₦100,000
      grantsSkus: [] as const,
    },
    cohort: {
      sku: "cohort-sept-2026" as const,
      title: "AI Generalist — September 2026 Cohort",
      subtitle: "Live classes, direct access, and every Cohort 1 recording.",
      priceKobo: 30_000_000,   // ₦300,000
      grantsSkus: ["recordings"] as const,
    },
  },

  promo: {
    code: "LAUNCH20",
    label: "20% off until 5 September",
    endsAt: "2026-09-05T23:59:59+01:00",
  },

  alumni: {
    cohortUpgradeCode: "ALUMNI200",
    invitePrefix: "ALUMNI-",
  },

  player: {
    defaultQuality: "480p" as const,
    dataSaverQuality: "360p" as const,
    // Why: 13 two-hour lessons at 720p ≈ 20GB per student on Nigerian
    // mobile data. Defaulting to 480p cuts that ~60%. Do not change
    // this to "auto" without understanding what it costs the student.
    savePositionEverySeconds: 15,
    markCompleteAtPercent: 90,
    autoplayNext: false,
  },

  video: {
    // TODO(handoff): Bunny Stream library ID.
    // Token key lives server-side ONLY. Never in this file.
    libraryId: "TODO(handoff)",
    signedUrlTtlSeconds: 300,
  },

  copy: {
    heroHeadline: "TODO(handoff): sales headline",
    heroSubline: "TODO(handoff): the promise, one sentence",
    outcomeBullets: ["TODO(handoff)", "TODO(handoff)", "TODO(handoff)"],
  },

  legal: {
    refundPolicy: "TODO(handoff): refund policy text",
  },
} as const;
```

### 2.3 `/lib/data-access.ts`

The single seam. Every function async, every function returning mock data with a small delay, every signature permanent. Claude Code replaces the bodies and nothing else in the application changes.

```ts
import type {
  Profile, Product, Module, Lesson, Resource, Enrollment,
  CourseProgress, Comment, DiscountPreview, SignedPlayback,
  ProductSku, UUID,
} from "../types";

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// TODO(handoff): replace EVERY function body with real queries.
// Signatures must not change — every component depends on them.

export async function getCurrentProfile(): Promise<Profile | null> { await delay(); return null; }
export async function getProduct(sku: ProductSku): Promise<Product> { await delay(); throw new Error("mock"); }
export async function getModules(sku: ProductSku): Promise<Module[]> { await delay(); return []; }
export async function getLessons(moduleId: UUID): Promise<Lesson[]> { await delay(); return []; }
export async function getLesson(lessonId: UUID): Promise<Lesson> { await delay(); throw new Error("mock"); }
export async function getFreePreviewLesson(): Promise<Lesson | null> { await delay(); return null; }

export async function getCourseProgress(sku: ProductSku): Promise<CourseProgress> { await delay(); throw new Error("mock"); }
export async function saveLessonPosition(lessonId: UUID, seconds: number): Promise<void> { await delay(50); }
export async function markLessonComplete(lessonId: UUID): Promise<void> { await delay(); }

export async function getEnrollments(): Promise<Enrollment[]> { await delay(); return []; }
export async function hasAccessTo(sku: ProductSku): Promise<boolean> { await delay(); return false; }

// Server-side only after an enrollment check. Never called from a client component.
export async function getSignedPlayback(lessonId: UUID): Promise<SignedPlayback> { await delay(); throw new Error("mock"); }
export async function getSignedResourceUrl(resourceId: UUID): Promise<string> { await delay(); throw new Error("mock"); }

export async function getVaultResources(): Promise<Resource[]> { await delay(); return []; }
export async function getLessonResources(lessonId: UUID): Promise<Resource[]> { await delay(); return []; }

export async function getComments(lessonId: UUID): Promise<Comment[]> { await delay(); return []; }
export async function postComment(lessonId: UUID, body: string): Promise<Comment> { await delay(); throw new Error("mock"); }

export async function validateDiscountCode(code: string, sku: ProductSku): Promise<DiscountPreview> { await delay(400); throw new Error("mock"); }
export async function initiateCheckout(sku: ProductSku, code?: string): Promise<{ reference: string; authorizationUrl: string }> { await delay(); throw new Error("mock"); }
export async function pollEnrollment(reference: string): Promise<Enrollment | null> { await delay(); return null; }
export async function redeemInviteCode(code: string): Promise<Enrollment> { await delay(600); throw new Error("mock"); }

// --- Admin ---
export async function adminListStudents(): Promise<Array<Profile & { percentComplete: number }>> { await delay(); return []; }
export async function adminListTransactions(): Promise<import("../types").Transaction[]> { await delay(); return []; }
export async function adminGenerateInviteCodes(count: number, sku: ProductSku): Promise<string[]> { await delay(); return []; }
export async function adminUpsertLesson(lesson: Partial<Lesson>): Promise<Lesson> { await delay(); throw new Error("mock"); }
```

**The marker convention:** `// TODO(handoff):` marks every place real logic belongs. AI Studio must leave them deliberately. Session 1 opens by grepping for them and has an instant work queue.

---

## 3. Visual track — four prompts for Google AI Studio

Four, not three. This app has a public marketing surface, a transactional surface, a content-consumption surface, and an operations surface. Each has a different job and a different aesthetic. Forcing them into three prompts produces mush.

Send them **in order, in one AI Studio conversation.** Context carries between prompts — don't re-paste the whole spec each time. Verify after each before moving on.

Use the annotation toolbar for pixel tweaks rather than burning a full prompt on "move that button left."

---

### Prompt 1 — Foundation and sales page

Paste the three contract files into this prompt where marked.

```text
You are building ONLY the visual front-end of Flag Skool, a paid AI education
platform for Nigerian students. A separate engineer will add all backend
functionality later. Your job is design and presentation. Read the constraints
carefully — what you must NOT build matters as much as what you must build.

=== ABSOLUTE CONSTRAINTS — DO NOT VIOLATE ===
DO NOT install or configure any database, ORM, or backend service.
DO NOT create API routes, route handlers, or server actions.
DO NOT write fetch(), axios, or any network call.
DO NOT use localStorage, sessionStorage, or cookies.
DO NOT implement authentication of any kind.
DO NOT create .env files or reference environment variables.
DO NOT integrate the Gemini API or any AI model. This product does not use one.
DO NOT install any npm package beyond the allowlist below.
DO NOT write email, payment, or data persistence logic.

If a feature seems to need data, use the mock data file. If a button seems to
need an action, call a prop callback and leave a TODO(handoff) comment. That is
the correct behaviour — do not "helpfully" implement the backend. Implementing
the backend is the WRONG behaviour here and will be deleted.

=== STACK ===
React + Vite + TypeScript + Tailwind CSS. Do not drift from this.

=== ALLOWED DEPENDENCIES (nothing else) ===
react, react-dom, typescript, vite, tailwindcss, motion, react-hook-form,
zod, @hookform/resolvers, clsx, lucide-react

=== CONTRACTS — CREATE THESE FILES FIRST, VERBATIM ===
These are contracts. A backend will be built to match them exactly. Do not
deviate from them, do not extend them, do not rename anything in them.

[PASTE /types/index.ts HERE IN FULL]

[PASTE /config/flagskool.config.ts HERE IN FULL]

Create both files exactly as given before writing any component.

=== DESIGN SYSTEM ===
Build a Tailwind theme driven entirely by config.brand. No colour or font may
appear as a literal anywhere else in the codebase.

Dark surface, warm accent. Ink Deep is the page background; Ink Raised is card
surfaces; Ink Border is the 1px divider; Flag Red is the single accent used for
primary actions and progress only — never for decoration. Body copy in Body
Text, secondary copy in Muted Text.

Typography: Fraunces for headings ONLY, at a tight tracking and a heavy weight.
Instrument Sans for all body and UI. JetBrains Mono for code and for the
countdown timer digits. Load from Google Fonts with display=swap.

The feel: confident, editorial, expensive. This costs ₦100,000 — it must not
look like a template. Reference points in spirit: a well-made independent
magazine, not a SaaS landing page. Generous vertical rhythm. Restraint with
colour. Let type and space carry it.

=== COMPONENT LIBRARY ===
All pure and presentational — props in, JSX out, no internal data fetching.

- Button        variants: primary | secondary | ghost | danger; sizes: sm | md | lg;
                loading and disabled states; min 48px touch target
- Card          Ink Raised, 1px Ink Border, generous padding
- Badge         variants: neutral | accent | success | warning
- ProgressBar   value 0-100; label optional; Flag Red fill
- Countdown     props { endsAt: string }; renders D/H/M/S in JetBrains Mono;
                renders an "expired" slot when past. Pure display — no side effects.
- Accordion     controlled; used for the curriculum
- Avatar        initials fallback
- Input, Textarea, Select   labelled, error slot, 16px minimum font size
- EmptyState    icon, headline, body, optional action
- Skeleton      shimmer placeholder

=== PAGE: SALES PAGE (/) ===
Public, no auth. Numbered sections in order. Every string comes from config —
placeholder text must read as TODO(handoff), never as invented marketing copy.

1. NAV — wordmark left; "Log in" and "Get access" right. Sticky, translucent
   backdrop blur on scroll.
2. HERO — config.copy.heroHeadline, heroSubline. Primary CTA "Get access".
   Secondary CTA "Watch lesson 1 free". A muted line: "Taught live to 750+
   students." Behind it, a very subtle animated gradient — opacity and transform
   only.
3. PROMO BAR — Countdown to config.promo.endsAt with config.promo.label. When
   expired, this section renders full price with no countdown. Both states must
   be reachable via the dev switcher.
4. FREE PREVIEW — a large 16:9 placeholder block with a play affordance and the
   caption "Lesson 1 — Fundamentals of AI · Free". onClick calls a prop callback.
   // TODO(handoff): wire to signed playback
5. OUTCOMES — config.copy.outcomeBullets in a three-column grid, single column
   on mobile.
6. CURRICULUM — Accordion of five modules from MOCK_MODULES. Each row: module
   number, title, lesson count, total duration. Expanded: lesson titles with
   durations. Lesson 1 carries a "Free" Badge.
7. PRICING — two Cards side by side, stacked on mobile. Recordings card shows
   the struck-through full price and the promo price when the promo is live.
   Cohort card is visually marked as the premium option and lists that it
   includes every Cohort 1 recording. Both CTAs call prop callbacks.
   // TODO(handoff): wire to checkout
8. INSTRUCTOR — photo placeholder, name from config, two-paragraph bio slot as
   TODO(handoff).
9. TESTIMONIALS — three cards from MOCK_TESTIMONIALS. Include an empty state,
   because real testimonials are not collected yet.
10. FAQ — Accordion. Six questions covering: access duration, payment methods,
    data usage, device support, refunds, and how the cohort differs.
11. FOOTER — Telegram link from config.org.telegramUrl, X handle, support email,
    refund policy link.

=== MOCK DATA ===
Create /lib/mock-data.ts with realistic content drawn from the real curriculum:

Module 0 Onboarding · Module 1 AI Foundations (Fundamentals of AI; Prompting &
content generation; Prompting Pt 2) · Module 2 Automation with n8n (Foundations
of AI automation & n8n; AI-powered email response system) · Module 3 Building AI
Agents (Calendar agent Pt 1; Calendar agent Pt 2; Agent architectures, RAG &
context engineering) · Module 4 RAG in Practice (RAG agent & pipeline Pt 1; Pt 2)
· Module 5 Shipping Products (Website & chatbot with Lovable + n8n; Vibe coding
Pt 1; Vibe coding Pt 2).

Durations between 75 and 140 minutes. bunnyVideoId as placeholder GUIDs.

=== HARD RULES ===
- MOBILE FIRST. Design at 375px first, then scale up. The majority of traffic
  is mid-tier Android phones on Nigerian mobile data, arriving from a Telegram
  link. Assume a slow connection and a small screen as the default case.
- All tap targets minimum 48x48px with generous spacing between them.
- Body text minimum 16px. Never smaller.
- Animate ONLY transform and opacity. Never width, height, top, or left.
- Create a useReducedMotion hook and wrap every non-essential animation in it.
- Flag Red (#CA3A32) on Ink Deep (#030617) must be verified for contrast. If
  Flag Red as text fails 4.5:1, use it as a background with Paper Soft text
  instead, and tell me you did.
- No horizontal overflow at 320px.

=== DEV STATE SWITCHER ===
Add a small fixed-position panel, visible only in development, that forces:
promo-live, promo-expired, testimonials-empty, testimonials-populated.
I need to review every state by clicking, not by editing code.

Build it. Then list every file you created, paste the full contents of
/types/index.ts back to me so I can verify the contract survived intact, and
confirm there are zero network calls in the codebase.
```

**Verify before Prompt 2:** open it on your actual phone. Check for horizontal overflow at 320px. Change `config.brand.colors.flagRed` to something garish and confirm every instance changes. Run `npm ls --depth=0` and compare against the allowlist.

---

### Prompt 2 — Auth and the money path

```text
Continue the Flag Skool build. All constraints from the first prompt still
apply — no backend, no network calls, no auth logic, no storage, no new
dependencies. This prompt covers the transactional screens.

=== PAGES ===

/login          email + password, Google button, "Forgot password", link to signup
/signup         full name, email, password, terms checkbox, Google button
/forgot         email only, success state
/reset          new password + confirm
/verify-email   "Check your inbox" with a resend affordance
/checkout       the purchase flow (detailed below)
/payment-pending the post-Paystack wait (detailed below)
/redeem         invite code redemption (detailed below)

All auth forms are pure presentational components:

interface AuthFormProps {
  state: LoadState<void>;          // controlled from outside
  onSubmit: (values: FormValues) => void;
}

The form owns NO submission logic and NO async state. The parent decides what
happens. Every parent handler contains ONLY:

  // TODO(handoff): replace with real auth call
  setState({ status: "loading" });
  setTimeout(() => setState({ status: "success", data: undefined }), 900);

This fake delay exists purely so I can see loading and success states. Do not
build anything more sophisticated.

=== PAGE: /checkout ===
Takes a productSku. Two-column on desktop, single column stacked on mobile with
the summary FIRST — on a phone people need to see what they're paying before
they see the form.

LEFT: order summary Card — product title, subtitle, price. A discount code
Input with an "Apply" Button. When a code is applied: show the code as a
removable Badge, the original price struck through, the discount line in Flag
Red, and the new total.

RIGHT: payer details (name, email, prefilled and read-only if logged in), a
Paystack-branded pay Button showing the exact final amount, a line reading
"Card or bank transfer · Naira", and the refund policy from config.

Drive the whole page from the CheckoutState union in the contract. Render a
distinct, designed treatment for every single variant: idle, validating-code,
code-invalid, code-applied, redirecting, awaiting-webhook, success, error.

The special case that matters: when the applied code makes
preview.isFullyDiscounted true, the pay Button is REPLACED by a "Claim access"
Button and all payment UI disappears. This is the alumni path — they must never
see a payment form. // TODO(handoff): wire to enrollment

=== PAGE: /payment-pending ===
The screen a student lands on returning from Paystack. Access is granted by a
webhook, not by this page, so it may need to wait a few seconds.

Centred card. A calm, slow pulse animation (opacity only). "Confirming your
payment…" and below it, smaller: "This usually takes a few seconds. Don't close
this page." After a simulated 10 seconds, show a fallback: "Taking longer than
usual" with the support email and the transaction reference in JetBrains Mono,
copyable.

Never a dead end. There must always be a route forward from this screen.

=== PAGE: /redeem ===
For January alumni. This is the first impression for students who already trust
you — it must feel like a gift, not a form.

Single centred Input, uppercase, auto-formatting with the ALUMNI- prefix. One
Button. Drive it from the RedeemState union — render idle, checking, invalid,
already-redeemed, success, error.

The success state is celebratory but restrained: the product title, "You have
lifetime access", and a single Button to the dashboard. A brief motion flourish
using transform and opacity only, wrapped in useReducedMotion.

=== DEV STATE SWITCHER ===
Extend the existing panel with every CheckoutState variant, every RedeemState
variant, and every auth form state. I must be able to review each one by
clicking a button, without filling in a single form.

=== HARD RULES ===
All previous hard rules still apply. Additionally:
- Payment amounts are always rendered through koboToNaira from the contract.
  Never format currency inline anywhere.
- The discount code Input is uppercase-only and strips whitespace on paste,
  because people will paste codes out of Telegram with trailing spaces.

Build it. Then confirm zero network calls, and paste back the list of every
TODO(handoff) marker you left with its file and line.
```

**Verify before Prompt 3:** cycle every state in the switcher. Confirm the fully-discounted checkout shows no payment UI at all. `grep -rn "fetch(" .` returns nothing.

---

### Prompt 3 — The student app

This is the prompt that matters most. The lesson player is the screen that justifies the price.

```text
Continue the Flag Skool build. All previous constraints still apply. This
prompt builds the logged-in student experience.

=== CONTEXT — READ THIS BEFORE DESIGNING ===
The student is on a mid-tier Android phone, on Nigerian mobile data, often at
night, often tired, having paid ₦80,000 of their own money. They watch two-hour
lessons in fragments across several days.

The single job of this interface is to get them to finish the course. Not to
look impressive. Not to show them options. To get them back to the exact second
they stopped and keep them moving forward.

Every design decision follows from that. Where a choice exists between showing
more and showing the next step, show the next step.

=== THE SEAM — IMPORTANT ===
Do NOT import mock data directly into any page component.

Create /lib/data-access.ts exporting the async functions listed below, each
currently returning mock data with a simulated 200ms delay.

[PASTE /lib/data-access.ts HERE IN FULL]

// TODO(handoff): replace every function body with real queries.
// Signatures must not change — components depend on them.

Pages call these functions only. This file is the single seam between the
interface and the backend. If any page imports mock-data.ts directly, the seam
is broken and the handoff fails.

=== PAGE: /dashboard ===
ONE primary call to action. Not a menu. Not a grid of options.

A large Card, top of page, reading:
  "Continue where you left off"
  Module 3 · Lesson 7
  Calendar Agent Pt 2
  [ProgressBar for that lesson]
  [Button: Continue →]

Sourced from courseProgress.nextLesson. When nextLesson is null (course
finished), this Card becomes a completion state instead.

Below it, secondary and visually quieter: overall ProgressBar with
"4 of 13 lessons complete", then the five modules as a list — each with title,
lesson count, and its own ProgressBar. Modules the student has no access to are
shown locked with a muted lock affordance and an upgrade link.

Below that, a thin row: "Vault" and "Community" (config.org.telegramUrl,
opens externally).

Nothing else. Resist adding a stats grid, a streak widget, or an activity feed.

=== PAGE: /learn/[lessonId] — THE LESSON PLAYER ===
The highest-stakes screen in the application.

Layout: player fills the width on mobile; on desktop, player left, lesson
navigation rail right.

PLAYER AREA
- A 16:9 container with a placeholder representing the Bunny embed iframe.
  // TODO(handoff): replace with signed Bunny Stream embed
- A watermark overlay: student name and email, small, semi-transparent, in the
  lower-right, sitting above the video layer.
- Custom control strip beneath the video: play/pause, scrubber, elapsed and
  total time, a quality Select, a Data Saver Toggle, and fullscreen.

THE QUALITY CONTROL — this is not a minor feature
- Defaults to config.player.defaultQuality, which is 480p. Not auto.
- The Data Saver Toggle, when on, forces config.player.dataSaverQuality.
- Beside the quality Select, render live estimated data usage for the remaining
  runtime using estimateDataUsageMb from the contract, e.g. "~310 MB remaining
  at 480p". This must update immediately when quality changes.
- When Data Saver is switched on, show a brief inline confirmation: "Data Saver
  on — using about half the data."
Design this so it reads as care for the student, not as a technical setting.

BELOW THE PLAYER
- Lesson title and module breadcrumb.
- A "Mark complete" Button, and a "Next lesson →" Button. NO autoplay.
- RESOURCES: files attached to this lesson, each a row with a file-type icon,
  title, size, and a download affordance. // TODO(handoff): signed download URL
- COMMENTS: flat list, newest first. Each shows Avatar, author name, an
  "Instructor" Badge when authorIsAdmin, relative timestamp, and body. Pinned
  comments sort to the top with a pin indicator. A Textarea and post Button
  above the list. Include an empty state.

NAVIGATION RAIL (desktop) / BOTTOM SHEET (mobile)
The full course outline. Current lesson highlighted. Completed lessons show a
check. Locked lessons show a lock. Tapping navigates.

=== PAGE: /vault ===
Every resource the student has access to, in one place. This is the page
students screenshot and post about — make it feel like a genuine asset.

Search Input filtering by title. Filter chips by module and by ResourceKind.
Results as a grid of Cards: file-type icon, title, module label, size, download
affordance. Include an empty state and a no-results state.

=== PAGE: /account ===
Name, email, avatar upload placeholder, password change, and a list of active
enrollments with purchase dates. Deliberately plain.

=== HARD RULES ===
All previous hard rules apply. Additionally:
- The player control strip must be usable one-handed with a thumb. Minimum 48px
  targets, spaced so adjacent controls cannot be mis-tapped.
- No animation anywhere on the player screen except the control strip
  fade-out. This screen prioritises responsiveness over delight.
- Every list has a designed empty state. Never a blank region.
- Loading uses Skeleton components matched to the shape of the real content, so
  the layout does not shift when data lands.

=== DEV STATE SWITCHER ===
Extend it with: progress-zero, progress-partial, progress-complete,
comments-empty, comments-populated, resources-empty, lesson-locked,
data-saver-on, data-saver-off.

Build it. Then confirm that NO page component imports mock-data.ts directly,
and paste back the full contents of /lib/data-access.ts.
```

**Verify before Prompt 4:** `grep -rn "mock-data\|MOCK_" --include=*.tsx . | grep -v "lib/data-access"` must return nothing. Anything it returns is a broken seam — fix it now, not later.

---

### Prompt 4 — Admin

```text
Final visual prompt for Flag Skool. All previous constraints apply.

=== AESTHETIC — READ CAREFULLY ===
The admin area does NOT share the student-facing design language. Do not apply
the editorial styling, Fraunces headings, or the dark accent treatment here.

This is a business tool used by one person — the founder — usually at a desk,
usually in a hurry, usually to answer "did that payment land" or "who hasn't
started the course". Information density beats elegance. Small type is
acceptable here. Tables, not cards. No animation anywhere.

Use a light surface, a neutral grey palette, Instrument Sans throughout, and
JetBrains Mono for all identifiers, references, codes, and amounts. Flag Red
appears only on destructive actions.

If you find yourself making this look beautiful, you are doing it wrong.

=== PAGES ===

/admin — overview
  Four figures in a row, no decoration: total students, total revenue in Naira,
  enrollments this week, average course completion. Below: the ten most recent
  transactions as a compact table.

/admin/students
  Sortable table: name, email, enrollments, progress %, last active, joined.
  Search by name or email. Filter by product and by alumni status. Export
  button. // TODO(handoff): wire to real export
  Row click opens a detail panel showing that student's per-lesson progress.

/admin/sales
  Transactions table: date, student, product, amount, discount code used,
  status Badge, Paystack reference in mono, copyable. Filter by status and date
  range. Show the summed total for the current filter.

/admin/codes
  Two sections.
  GENERATE: count Input, product Select, kind Select (invite | promo | alumni),
  and for promo/alumni a discount value Input and expiry. A generate Button
  that produces codes into a table with a "Copy all" affordance and a CSV
  download. This is how alumni codes get made — it must be quick to use in bulk.
  EXISTING: table of all codes — code, kind, value, applies to, redemptions used
  vs max, expiry, active toggle.

/admin/content
  Modules listed in order, each expandable to its lessons. Drag-to-reorder using
  transform only. Per lesson: title, duration, Bunny video ID in mono, free
  preview toggle, published toggle. An edit panel with title, description,
  Bunny video ID, and an attached-resources list with an upload placeholder.
  // TODO(handoff): wire uploads to storage

=== DATA ACCESS ===
All admin pages go through the existing /lib/data-access.ts admin functions.
Add mock data as needed but do NOT import it into page components.

Build it. Then confirm the admin surface shares no styling with the student
surface, and list every TODO(handoff) marker across the entire codebase with
file and line number.
```

---

## 4. Handoff — twenty minutes, do not skip

Export to **GitHub, not a ZIP.** You need history from the first commit.

```bash
# 1. Dependency audit — compare against the allowlist
npm ls --depth=0

# 2. Contraband scan — should return NOTHING
grep -rn "fetch(\|axios\|localStorage\|sessionStorage\|process\.env\|supabase\|firebase\|prisma" \
  --include=*.ts --include=*.tsx --include=*.js --include=*.jsx .

# 3. Uninvited backend directories
find . -path ./node_modules -prune -o -type d \( -name "api" -o -name "server" -o -name "routes" \) -print

# 4. Build the work queue — expect roughly 15–25 markers for this build
grep -rn "TODO(handoff)" --include=*.ts --include=*.tsx .

# 5. Broken seam check — must return NOTHING
grep -rn "mock-data\|MOCK_" --include=*.tsx . | grep -v "lib/data-access"

# 6. Hardcoded instance values that belong in config
grep -rn "flagskool\|₦\|CA3A32\|t\.me" --include=*.tsx src/components src/pages 2>/dev/null

# 7. Clean build — must pass before Claude Code opens the repo
npm install && npm run build

# 8. Tag the baseline
git tag visual-baseline && git push --tags
```

**Far fewer than 15 markers means AI Studio implemented things it shouldn't have.** Go back to step 2 and look harder.

**Framework reconciliation.** AI Studio emits React + Vite. Flag Skool needs Next.js — for Telegram and X link previews, for the Paystack webhook route, and for server-side Bunny URL signing. This migration is the first task of Session 1 and takes roughly 60–90 minutes. Because every component the visual track produced is pure and presentational, they port with minimal change. Budget it now, not on discovery.

---

## 5. CLAUDE.md

Write this at the repo root before opening the first Claude Code session.

````markdown
# Flag Skool

## What this is
A paid AI education platform selling recorded and live cohort courses to
Nigerian students, built by Mustang (Solarin Akintunde Oluwatobi), founder of
FlagIQ and instructor to 750+ students.

The visual layer was generated in Google AI Studio and is largely finished. My
job in this repo is the engineering: migrate to Next.js, build the schema and
row-level security, wire Paystack, sign Bunny video URLs, implement the
progress and completion engine, wire transactional and behavioural email, and
deploy.

## The actual product
This is not "video behind a paywall" — Google Drive already does that for free.
**The job of this application is to make students finish the course.**

₦80,000–₦100,000 is serious money for the target buyer. The worst commercial
outcome is not piracy. It is a student who pays, watches two lessons, drifts,
and privately concludes Flag Skool didn't work. They don't request a refund.
They never buy again and never refer anyone. Silent churn is the primary
business risk, and every feature is justified by whether it moves completion.

Two audiences:
1. **Students** — mid-tier Android, Nigerian mobile data, watching two-hour
   lessons in fragments over several days, often late at night.
   **The lesson player is the highest-stakes surface in the app.** Resume,
   progress, and data-saver are not features; they are the product.
2. **Admin (one person, the founder)** — checking whether payments landed and
   who has stalled. Density over elegance. The admin area is deliberately not
   themed. Do not "improve" it toward the student aesthetic.

## Stack
- Next.js 14 App Router, TypeScript
- Tailwind CSS, theme driven entirely by `/config/flagskool.config.ts`
- Motion (`motion`) — transform and opacity only, always behind reduced-motion
- Supabase — Postgres, Auth, Storage, RLS
- Bunny Stream — video, token-authenticated
- Paystack — Naira, one-time payments only, no subscriptions
- Resend — transactional and behavioural email
- Vercel

## Contracts — do not break these
- `/types/index.ts` — the data model. The schema must match it exactly. Change
  the types only with a deliberate reason, and update the schema in the same
  commit.
- `/config/flagskool.config.ts` — every instance-specific string, colour, price,
  and asset path. **Never hardcode these into a component.** This file is what
  makes the build reusable as a second school later.
- `/lib/data-access.ts` — the only seam between UI and database. Replace the
  bodies with real queries; do not change the signatures.

## Conventions
- `// TODO(handoff):` marks every spot where real logic belongs. Grep for them.
- Presentational components stay pure — props in, JSX out. Data fetching lives
  in server components or `data-access.ts`, never in a UI component.
- All money is kobo, everywhere, always. Format only through `koboToNaira`.
- Every table carries `org_id`. There is exactly one organization row today.
  This exists so multi-tenant is a weekend later rather than a rewrite. Do not
  remove it because it looks redundant.

## Hard constraints
- **Money:** enrollment is created ONLY by the verified Paystack webhook. The
  browser redirect from Paystack grants nothing. Anyone can hit a redirect URL;
  a shortcut here costs ₦80,000 per head.
- **Video:** Bunny URLs are signed server-side with a short TTL, issued only
  after an enrollment check. The Bunny token key must never reach the client
  bundle.
- **Data cost:** the player defaults to 480p, never auto. Thirteen two-hour
  lessons at 720p is ~20GB per student on Nigerian mobile data — a real
  fraction of what they paid, spent on bandwidth. Do not change this default.
- **Performance:** LCP under 2.5s on Slow 4G with 4x CPU throttle. Measure it;
  don't assert it.
- **Accessibility:** WCAG AA. Flag Red (#CA3A32) on Ink Deep (#030617) is the
  risky pairing — report the actual ratio.
- **Motion:** animate only `transform` and `opacity`. Every animation wrapped in
  the reduced-motion check. No motion on the player screen.
- **Link previews:** traffic arrives from Telegram and X. Neither crawler runs
  JavaScript, so OG tags must be server-rendered into the initial HTML.

## Commands
```bash
npm run dev
npm run build          # must pass before any commit
npx supabase db push   # migrations
npx supabase gen types typescript --local > types/database.ts
```

## Current state
Visual layer complete and mock-driven. No backend exists. Everything routes
through `/lib/data-access.ts`, whose function bodies all return mocks.
````

---

## 6. Engineering track — four Claude Code sessions

Each ends somewhere you can pick up your phone and check.

### Session 1 — Migrate, audit, schema, auth

```text
Read CLAUDE.md first, then run:
grep -rn "TODO(handoff)" --include=*.ts --include=*.tsx .

This codebase was UI-generated in Google AI Studio. Work in this order.

=== STEP 1: MIGRATE TO NEXT.JS 14 APP ROUTER ===
Do this BEFORE any schema work.
- Move pages into the app directory with the route structure already implied by
  the visual layer.
- Split client and server components. Presentational components stay pure and
  should port with minimal change — that is why they were built that way.
- Replace the Vite router with App Router navigation.
- Preserve /types, /config, and /lib/data-access.ts exactly as they are.
- Build must pass clean before you continue. Report what you changed.

=== STEP 2: AUDIT AND HARDEN ===
- Fix every type error and warning.
- Find any component importing mock data directly rather than going through
  /lib/data-access.ts, and route it through the seam.
- Find any hardcoded instance-specific value outside the config and move it in.
- Verify /types/index.ts matches what components actually use. Fix mismatches
  NOW, before the schema locks the shape in.
- Report what you found and fixed before continuing.

=== STEP 3: SCHEMA ===
Supabase Postgres. Tables must match /types/index.ts exactly.

organizations      id, slug unique, name, created_at
profiles           id → auth.users, org_id, email, full_name, avatar_url,
                   role ('student'|'admin'), is_alumni bool default false,
                   created_at, last_active_at
products           id, org_id, sku unique per org, title, subtitle,
                   price_kobo bigint, is_active, grants_skus text[]
modules            id, org_id, product_sku, "order" int, title, description
lessons            id, org_id, module_id → modules, "order" int, title,
                   description, bunny_video_id, duration_seconds int,
                   is_free_preview bool default false, published_at
resources          id, org_id, module_id → modules, lesson_id → lessons null,
                   title, kind, storage_path, size_bytes bigint, external_url
enrollments        id, org_id, user_id → profiles, product_sku,
                   source ('purchase'|'invite'|'comp'), transaction_id,
                   discount_code_id, created_at, expires_at null
                   UNIQUE (user_id, product_sku)
discount_codes     id, org_id, code, kind, value jsonb, applies_to_sku,
                   max_redemptions int null, redemption_count int default 0,
                   restricted_to_email null, owner_user_id null, starts_at,
                   expires_at, is_active bool default true
                   UNIQUE (org_id, code)
transactions       id, org_id, user_id, product_sku, reference unique,
                   amount_kobo bigint, discount_code_id, status, paid_at,
                   created_at
lesson_progress    id, org_id, user_id, lesson_id, position_seconds int
                   default 0, completed_at null, last_watched_at
                   UNIQUE (user_id, lesson_id)
comments           id, org_id, lesson_id, user_id, body text,
                   is_pinned bool default false, created_at

Indexes on every foreign key, on enrollments(user_id, product_sku), on
lesson_progress(user_id, lesson_id), and on discount_codes(org_id, code).

=== STEP 4: ROW LEVEL SECURITY ===
This is the paywall. Application-code access checks are not sufficient — a
student's session key used from the browser console must not be able to read
paid content.

Enable RLS on every table. Then:
- profiles: a user reads and updates only their own row. Admins read all.
- lessons: readable when is_free_preview = true AND published_at is not null,
  OR when the requesting user has an enrollment granting that lesson's product
  sku (accounting for grants_skus — a cohort enrollment grants recordings).
- resources: same rule as their parent lesson/module.
- enrollments: a user reads only their own. INSERT is denied to all client
  roles — enrollments are created ONLY by the service role via the webhook.
- lesson_progress: a user reads and writes only their own rows.
- comments: readable by anyone enrolled in that lesson's product. INSERT
  restricted to enrolled users, author only. Only admins may pin or delete.
- transactions: a user reads only their own. No client writes.
- discount_codes: NO client read access whatsoever. Validation happens through
  a security-definer function that returns only a computed DiscountPreview and
  never exposes the code table.

After writing the policies, write a script that authenticates as a student with
NO enrollment and attempts to read a paid lesson row, a paid resource, and the
discount_codes table. Confirm all three fail. Show me the actual output.

=== STEP 5: AUTH ===
- Supabase Auth: email/password plus Google OAuth.
- Email verification required before any content access.
- Middleware protecting every /dashboard, /learn, /vault, /account, /admin
  route. Unauthenticated redirects to /login with a return path.
- A trigger creating a profiles row on auth.users insert, defaulting to the
  single org and role 'student'.
- Wire the login, signup, forgot, and reset forms the visual track already
  built. Do NOT redesign them.
- Verify no privileged key reaches the client bundle, and tell me how you
  verified it.

=== STEP 6: SEED ===
Seed the one organization, both products, the five modules, and the thirteen
lessons with real titles from the mock data. Bunny video IDs stay as
placeholders for now.

=== DONE WHEN ===
I can sign up on my phone, verify my email, log in, land on the dashboard, see
the real seeded curriculum with everything locked, and the RLS attack script
fails on all three attempts with output shown.
Commit in logical chunks with clear messages as you go.
```

---

### Session 2 — The money path

This is the session where mistakes cost real money. It gets its own session for that reason.

```text
Read CLAUDE.md. Session 1 is complete — Next.js, schema, RLS, and auth all
work. This session builds the path from payment to access. Every decision here
has a Naira value attached.

=== 1. PAYSTACK CHECKOUT ===
- POST /api/checkout/initiate: accepts productSku and an optional discount
  code. Recomputes the final price SERVER-SIDE from the products table and the
  discount_codes table. Never trusts any amount from the client.
- Creates a transactions row with status 'pending' and a unique reference.
- Initialises the Paystack transaction and returns the authorization URL.
- Rate-limit this endpoint per user.

=== 2. THE WEBHOOK — highest-stakes code in the repo ===
POST /api/webhooks/paystack
- Verify the x-paystack-signature HMAC SHA512 against the secret. Reject
  anything that fails, and log the rejection.
- Handle charge.success only.
- Idempotent: the same event delivered twice must not create two enrollments.
  Enforce with the UNIQUE (user_id, product_sku) constraint AND an explicit
  check on the transaction status.
- Atomically: mark the transaction 'success', create the enrollment with
  source 'purchase', increment the discount code redemption_count if one was
  used, and create additional enrollments for every sku in the product's
  grants_skus. A partial write must be impossible — use a single transaction or
  a Postgres function.
- Runs as service role. This is the ONLY place enrollments are created from a
  purchase.
- Returns 200 quickly. Email sending must not block or fail the response.

The browser redirect from Paystack grants NOTHING. /payment-pending polls
GET /api/enrollment/status?reference=... which reads the transactions and
enrollments tables. Wire the existing awaiting-webhook state to this poll —
do not change the CheckoutState union or the component props. The UI already
handles every state correctly.

=== 3. DISCOUNT CODE ENGINE ===
A security-definer Postgres function validating a code and returning a
DiscountPreview and nothing else. It must never expose the discount_codes
table to a client role.

Validation: code exists, is_active, within starts_at/expires_at, applies to the
requested sku, redemption_count below max_redemptions, and if
restricted_to_email is set it matches the requesting user's email.

Compute the final price using applyDiscount from /types/index.ts — import the
helper, do not reimplement it. One definition, no drift.

When the result is fully discounted (final = 0), POST /api/checkout/claim
creates the enrollment directly with source 'invite' and skips Paystack
entirely. Same idempotency and atomicity guarantees as the webhook.

=== 4. INVITE REDEMPTION ===
Wire /redeem to the same claim endpoint. Rate-limit it hard — codes must not be
brute-forceable. Use a cryptographically random suffix on generated codes, not
a sequence.

=== 5. SIGNED VIDEO PLAYBACK ===
- Server-only function issuing a Bunny Stream token: SHA256 of
  (tokenKey + videoId + expiryUnix), TTL from config.video.signedUrlTtlSeconds.
- Called ONLY after verifying the requesting user has an enrollment granting
  that lesson's product sku. Free-preview lessons skip the enrollment check but
  still get a signed, expiring URL.
- The Bunny token key lives in server environment only. Verify it does not
  appear in the client bundle and tell me how you verified it.
- Wire the player's embed placeholder to the real signed iframe. Pass the
  student's name and email into the watermark overlay.
- Ensure the initial quality parameter is 480p, from config. Wire the quality
  Select and the Data Saver toggle to real player quality changes.

=== 6. SIGNED RESOURCE DOWNLOADS ===
Supabase Storage signed URLs, short TTL, same enrollment check. Wire the lesson
resource list and the Vault.

=== DONE WHEN ===
On my phone: I pay ₦80,000 with LAUNCH20 through Paystack test mode, land on
the pending screen, watch it resolve when the webhook fires, reach the
dashboard, open Lesson 2, and watch actual video at 480p with my email
watermarked on it. Separately, an ALUMNI- code grants the same access with no
payment screen shown at any point. And a copied video URL is dead within five
minutes — demonstrate this.
Commit in logical chunks as you go.
```

---

### Session 3 — Completion engine, comments, email, admin

```text

Read CLAUDE.md. Sessions 1 and 2 are complete — the money path works end to
end. This session builds the thing that actually determines whether this
business works: completion.

=== 1. PROGRESS AND RESUME ===
- Save playback position to lesson_progress on a throttled interval of
  config.player.savePositionEverySeconds, and on page unload. It must survive a
  dropped connection — queue the write and flush on reconnect.
- Auto-mark complete at config.player.markCompleteAtPercent, and wire the
  manual "Mark complete" button.
- Implement getCourseProgress computing CourseProgress including nextLesson,
  accounting for module order and lesson order. Use computeModuleProgress from
  /types/index.ts — import it, do not reimplement.
- Wire the dashboard's single Continue CTA to real nextLesson data.
- Resume must restore the exact saved second on load.

=== 2. COMMENTS ===
Wire getComments and postComment. Enforce enrollment at the RLS layer, not just
in the UI. Admin pin and delete. Sanitise the body — escape HTML, no markdown
rendering, no links auto-linked. Rate-limit posting.

=== 3. EMAIL — Resend ===
Fires after the triggering event but must NOT block the response. If sending
fails, the underlying action still succeeds and the user still sees success.
Log failures; never surface them to the student.

Transactional:
- Purchase receipt — product, amount paid, discount applied, reference, a link
  straight into the dashboard
- Invite redemption welcome — warmer in tone, addressed to a returning student
- Email verification, password reset

Behavioural — this is the completion engine, and it matters more than any
feature in the UI:
- Day 3 after enrollment with zero lessons started: one nudge, linking directly
  to Lesson 1. Not a newsletter.
- Day 7 with stalled progress: includes their actual percentage and the exact
  next lesson title, linking straight to it.
- On module completion: congratulate, name the next module, one link.

Implement as a scheduled job querying enrollments against lesson_progress. Each
email type sends at most once per enrollment — record sends in a table.

CRITICAL: recipients open these in Gmail on Android. Use inline styles and
table layout. Modern CSS breaks. Keep each email under 100KB. Every email needs
a plain-text alternative.

=== 4. ADMIN ===
Wire every admin data-access function to real queries, admin role enforced at
the RLS layer.
- Student list with computed progress percentages
- Transactions with filters and a real CSV export
- Code generation writing real rows with cryptographically random suffixes,
  plus CSV download — this is how the alumni batch gets made, so it must be
  quick in bulk
- Content management with real Bunny video ID entry and resource upload to
  Supabase Storage

=== 5. CLEANUP ===
Replace every remaining function body in /lib/data-access.ts with real queries.
Signatures must not change. Then delete /lib/mock-data.ts and confirm the build
still passes.

=== DONE WHEN ===
I watch four minutes of a lesson on my phone, close the tab, reopen it the next
day on a different device, and land at 4:00 exactly. My dashboard says
"Continue — Lesson 2". I generate 40 alumni codes, download them as CSV, and
redeem one successfully. A test enrollment with no progress triggers the day-3
email, and it renders correctly in Gmail on Android.
```

---

### Session 4 — Performance, sharing, launch

```text

Read CLAUDE.md. Sessions 1-3 are complete — everything functions. Final
session: make it fast, make it shareable, ship it.

=== 1. PERFORMANCE ===
Target: LCP under 2.5s on the sales page under Slow 4G with 4x CPU throttle.
Measure and report ACTUAL NUMBERS. Do not assert.
- Bundle analysis. Report total client JS in KB for the sales page and for the
  player page separately.
- Self-host and subset Fraunces, Instrument Sans, and JetBrains Mono. Report
  the byte size of each subset.
- Lazy-load everything below the fold on the sales page.
- Explicit dimensions on every image. Report CLS.
- Dynamically import the player and any heavy library so they load only where
  used.
- The player page must become interactive fast — it is the return-visit screen
  and students open it on bad connections.

=== 2. SHARING METADATA ===
Traffic arrives from Telegram and X. Neither crawler executes JavaScript, so
every tag must be server-rendered into the initial HTML.
- Complete OG and Twitter card metadata on the sales page and the free preview.
- Generate the preview image at 1200x630. It must be under 300KB — Telegram
  silently drops previews on larger files with no error. Verify the byte size
  and report it.
- Favicon and touch icons from the same design.

=== 3. MOTION AUDIT ===
- Every animation wrapped in the reduced-motion check. Under reduced motion,
  movement becomes instant state changes or simple opacity fades.
- A persistent motion toggle in account settings.
- Only transform and opacity animated anywhere in the codebase. Find and fix
  violations, and list what you found.
- Confirm ZERO animation on the player screen except the control strip fade.

=== 4. ACCESSIBILITY ===
- Run axe-core across every page. Zero critical issues.
- Report the ACTUAL contrast ratio for Flag Red on Ink Deep, Body Text on Ink
  Deep, and Muted Text on Ink Raised. If any fails 4.5:1, adjust the value in
  config and tell me exactly what you changed.
- Full keyboard reachability with visible focus rings. The player controls in
  particular.
- One h1 per page, no skipped heading levels.
- Form errors announced with role="alert".

=== 5. ERROR HANDLING ===
- Custom 404 in the product's style with a route back.
- Error boundary with a friendly fallback and the support email.
- If Paystack or Bunny is unreachable on the critical path, show a real error
  with a manual fallback route. Never a dead end.
- /api/health endpoint.

=== 6. REUSE PREP ===
- Audit for ANY instance-specific string, colour, price, or asset path outside
  /config/flagskool.config.ts. Move every one in.
- Confirm the config drives the entire theme so a new palette swaps without
  touching Tailwind config.
- Write README.md documenting exactly which files change to launch this as a
  second school, with a realistic time estimate.

=== 7. DEPLOY ===
- Deploy to Vercel.
- Produce a launch checklist covering: production environment variables, the
  Paystack live webhook URL and how to verify it fires, RLS policies to
  re-verify against production data, Resend domain verification, DNS records,
  and how to test the Telegram link preview before distribution.

=== REPORT AT THE END ===
List explicitly: sales page LCP, player page LCP, client JS in KB for both,
CLS, OG image byte size, all three contrast ratios, and the axe-core issue
count.
```

---

## 7. The manual QA pass

Run these yourself. The agent will report done; done is a claim, not a state.

| Check | How |
| --- | --- |
| **Link preview** | Post the URL in your own Telegram DMs and on X. A card must render with image and text. |
| **Real device** | The cheapest Android phone you can borrow, on mobile data, not wifi. |
| **The paywall** | Log in as a student with no enrollment. Open the browser console and try to read a paid lesson row with the session key. It must fail. |
| **Video leak** | Copy a signed video URL. Wait six minutes. Paste it in an incognito window. It must be dead. |
| **The webhook is the gate** | Hit the payment success redirect URL directly, without paying. You must get nothing. |
| **Idempotency** | Replay the same Paystack webhook event twice from their dashboard. One enrollment, not two. |
| **Data cost** | Watch ten minutes at 480p with Data Saver on. Check your phone's data usage. Compare against the estimate shown in the player. |
| **Resume** | Watch four minutes. Close the tab. Reopen the next day on a different device. Land at 4:00. |
| **Alumni path** | Redeem an ALUMNI- code. Confirm you never see a payment screen at any point. |
| **Double redemption** | Redeem the same code twice. Second attempt must fail cleanly. |
| **Email rendering** | Open every email in Gmail on Android. Not desktop. |
| **Degraded network** | Airplane mode mid-lesson, then reconnect. Progress must not be lost. |
| **Boundary states** | Force the expired promo. Force zero testimonials. Force a completed course. |
| **Reuse proof** | Change `config.brand.colors.flagRed` and `config.org.name`. Nothing should break. |

---

## 8. Commercial notes

**The config file is a business asset.** Every instance-specific value lives in one place, which means launching a second school on this codebase is a config swap plus content, not a rebuild. Whether that second school is a client deliverable or the multi-tenant product, the option costs you nothing today and would cost weeks to retrofit.

**The `org_id` column is the same bet.** One row now. It is what stands between "creator business" and "startup" as an architecture question.

**The sequence that makes money fastest:** Sessions 1 and 2 alone give you a working paywall taking real Naira. Session 3 is what makes students finish and refer. Session 4 is what makes the Telegram link look like a real product when you post it. If you have to stop somewhere, stop after 2 and start selling — but understand that stopping there means shipping the cinema without the classroom, and completion is where your ₦300k cohort sales actually come from.

**Longest lead time on the whole project is testimonials.** Not code. Start asking the January group today.
