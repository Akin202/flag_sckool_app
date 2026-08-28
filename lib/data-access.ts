/**
 * The single seam between the interface and the database.
 *
 * Signatures are a contract — every view component depends on them, and they
 * do not change. Only the bodies do.
 *
 * These functions run in the **browser**, because every `src/views/*` is
 * imported by a `'use client'` screen and fetches from `useEffect`. That is
 * deliberate and safe: the browser client carries the user's session, so row
 * level security applies to it exactly as it does to any other caller. RLS is
 * the paywall — the attack suite proves it holds against the anon key hitting
 * PostgREST directly, with no application code in the path at all.
 *
 * Server-only work (signed Bunny playback, signed Storage downloads, Paystack)
 * lives in route handlers under `app/api/`, never here.
 */
import {
  CourseProgress,
  Enrollment,
  FAQItem,
  Lesson,
  LessonComment,
  LessonResource,
  Module,
  ModuleProgress,
  ProgressVariant,
  CommentsVariant,
  ResourcesVariant,
  LessonAccessVariant,
  Testimonial,
  UserProfile,
  VaultResource,
  AdminTransaction,
  AdminOverviewStats,
  AdminStudent,
  AdminDiscountCode,
  AdminModule,
  AdminLesson,
  GenerateCodesParams,
  AdminLessonUpdatePayload,
} from '@/types/index';
import {
  MOCK_MODULES,
  MOCK_TESTIMONIALS,
  MOCK_FAQS,
  MOCK_COMMENTS,
  MOCK_USER_PROFILE,
  MOCK_ADMIN_TRANSACTIONS,
  MOCK_ADMIN_STUDENTS,
  MOCK_ADMIN_CODES,
  MOCK_ADMIN_MODULES,
} from '@/lib/mock-data';
import { fetchCurriculum } from '@/lib/db/curriculum';
import { fetchLessonContext } from '@/lib/db/lessons';
import {
  fetchCourseProgress,
  setLessonCompletion,
  saveLessonPosition as saveLessonPositionDb,
} from '@/lib/db/progress';
import {
  fetchEnrollments,
  fetchUserProfile,
} from '@/lib/db/profile';
import {
  fetchLessonResources,
  fetchVaultResources,
} from '@/lib/db/resources';
import { createClient } from '@/lib/supabase/client';

// Helper to simulate realistic network latency (mock paths only)
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The dev state switcher forces boundary states — empty lists, zero progress, a
 * locked lesson — that real data will not reproduce on demand. Honour those
 * overrides in development only, so production can never be steered by a
 * query parameter into rendering fiction.
 */
const isDev = process.env.NODE_ENV !== 'production';

// In-memory mock states still used by the not-yet-migrated surfaces
let currentComments: LessonComment[] = [...MOCK_COMMENTS];

// In-memory admin mutable collections
let adminTransactions: AdminTransaction[] = [...MOCK_ADMIN_TRANSACTIONS];
let adminStudents: AdminStudent[] = [...MOCK_ADMIN_STUDENTS];
let adminCodes: AdminDiscountCode[] = [...MOCK_ADMIN_CODES];
let adminModules: AdminModule[] = JSON.parse(JSON.stringify(MOCK_ADMIN_MODULES));

/**
 * Returns overall and per-module course completion progress for the active student.
 */
export async function getCourseProgress(
  variant?: ProgressVariant,
  userId?: string
): Promise<CourseProgress> {
  // 'partial' is what the views pass by default and is what real data looks
  // like anyway; only the two synthetic extremes need the mock path.
  if (isDev && (variant === 'zero' || variant === 'complete')) {
    return mockCourseProgress(variant);
  }
  return fetchCourseProgress();
}

/**
 * Returns full module hierarchy with all lesson items.
 */
export async function getModulesWithLessons(userId?: string): Promise<Module[]> {
  const { modules } = await fetchCurriculum();
  return modules;
}

/**
 * Returns details, breadcrumbs, sibling navigation, and unlock state for a single lesson.
 */
export async function getLessonById(
  lessonId: string,
  accessVariant?: LessonAccessVariant
): Promise<{
  lesson: Lesson;
  module: Module;
  nextLessonId: string | null;
  prevLessonId: string | null;
  isCompleted: boolean;
  isLocked: boolean;
} | null> {
  const context = await fetchLessonContext(lessonId);
  if (!context) return null;

  // Force the locked treatment over real data rather than substituting a mock
  // lesson — the surrounding navigation stays truthful that way.
  if (isDev && accessVariant === 'locked') {
    return { ...context, isLocked: true };
  }
  return context;
}

/**
 * Returns all downloadable assets and blueprints attached to a specific lesson.
 */
export async function getLessonResources(
  lessonId: string,
  variant?: ResourcesVariant
): Promise<LessonResource[]> {
  if (isDev && variant === 'empty') return [];
  return fetchLessonResources(lessonId);
}

/**
 * Returns the entire vault library accessible by the student.
 */
export async function getAllVaultResources(
  variant?: ResourcesVariant
): Promise<VaultResource[]> {
  if (isDev && variant === 'empty') return [];
  return fetchVaultResources();
}

/**
 * Returns flat list of comments for a lesson, newest first, with pinned comments at top.
 *
 * TODO(handoff): still mock. Real comments need an author name, and `profiles`
 * RLS lets a student read only their own row — so this needs a definer-backed
 * view (like `curriculum`) exposing author name/avatar for entitled readers.
 * That is a migration, and migrations are Stage 3 work.
 */
export async function getLessonComments(
  lessonId: string,
  variant?: CommentsVariant
): Promise<LessonComment[]> {
  await delay(200);

  if (variant === 'empty') {
    return [];
  }

  const lessonComments = currentComments.filter(
    (c) => c.lessonId === lessonId || c.isPinned
  );

  return [...lessonComments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
}

/**
 * Posts a new comment to the lesson discussion thread.
 *
 * TODO(handoff): still mock — see getLessonComments.
 */
export async function postLessonComment(
  lessonId: string,
  body: string,
  author?: Partial<UserProfile>
): Promise<LessonComment> {
  await delay(200);

  const newComment: LessonComment = {
    id: `com-${Date.now()}`,
    lessonId,
    authorName: author?.fullName || MOCK_USER_PROFILE.fullName,
    authorEmail: author?.email || MOCK_USER_PROFILE.email,
    authorAvatar: author?.avatarUrl || MOCK_USER_PROFILE.avatarUrl,
    authorIsAdmin: false,
    createdAt: 'Just now',
    body: body.trim(),
    isPinned: false,
  };

  currentComments = [newComment, ...currentComments];
  return newComment;
}

/**
 * Toggles completion status for a lesson.
 */
export async function toggleLessonCompletion(
  lessonId: string,
  completed: boolean
): Promise<{ success: boolean; isCompleted: boolean }> {
  const isCompleted = await setLessonCompletion(lessonId, completed);
  return { success: true, isCompleted };
}

/**
 * Persists playback position, auto-completing past the configured threshold.
 *
 * Called on an interval from the player, so it stays quiet on failure: a
 * dropped save must not surface an error mid-lesson.
 */
export async function saveLessonPosition(
  lessonId: string,
  positionSeconds: number,
  totalSeconds: number
): Promise<void> {
  try {
    await saveLessonPositionDb(lessonId, positionSeconds, totalSeconds);
  } catch {
    // Swallowed deliberately: the next tick retries, and the student is
    // watching a video, not managing a sync queue.
  }
}

/**
 * Returns the logged-in student's profile.
 */
export async function getUserProfile(userId?: string): Promise<UserProfile> {
  const profile = await fetchUserProfile();
  // The views type this as non-nullable and render immediately. A logged-out
  // caller only reaches here through the dev switcher, so fall back rather
  // than throwing into a component that has no error branch for it.
  return profile ?? { ...MOCK_USER_PROFILE };
}

/**
 * Updates user profile details (name, email, avatar).
 *
 * Only full_name and avatar_url are writable — UPDATE is revoked on the table
 * and re-granted column-wise, so a student cannot promote themselves to admin.
 */
export async function updateUserProfile(
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const patch: { full_name?: string; avatar_url?: string } = {};
    if (data.fullName !== undefined) patch.full_name = data.fullName;
    if (data.avatarUrl !== undefined) patch.avatar_url = data.avatarUrl;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id);
      if (error) throw error;
    }
  }

  return getUserProfile();
}

/**
 * Handles password change requests.
 */
export async function changePassword(
  currentPass: string,
  newPass: string
): Promise<{ success: boolean }> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPass });
  if (error) throw error;
  return { success: true };
}

/**
 * Returns list of active purchase enrollments with transactions and tiers.
 */
export async function getEnrollments(userId?: string): Promise<Enrollment[]> {
  return fetchEnrollments();
}

/**
 * Landing page: Returns modules for public syllabus view.
 *
 * Reads the `curriculum` view, which is readable by anon — the landing page
 * must render the full syllabus to a logged-out visitor.
 */
export async function getCurriculumModules(): Promise<Module[]> {
  const { modules } = await fetchCurriculum();
  return modules;
}

/**
 * Landing page: Returns social proof testimonials.
 *
 * TODO(handoff): stays static. Testimonials have no table — they are marketing
 * copy, and the January cohort's have not been collected yet.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  await delay(200);
  return MOCK_TESTIMONIALS;
}

/**
 * Landing page: Returns FAQ accordion items.
 *
 * TODO(handoff): stays static — no table, and no reason for one.
 */
export async function getFaqs(): Promise<FAQItem[]> {
  await delay(200);
  return MOCK_FAQS;
}

/**
 * The two synthetic progress extremes the dev switcher can force. Development
 * only — `getCourseProgress` never reaches this in production.
 */
function mockCourseProgress(variant: 'zero' | 'complete'): CourseProgress {
  const modules = MOCK_MODULES;
  const totalLessonsCount = modules.reduce((n, m) => n + m.lessons.length, 0);

  if (variant === 'complete') {
    return {
      completedLessonsCount: totalLessonsCount,
      totalLessonsCount,
      percentComplete: 100,
      nextLesson: null,
      modules: modules.map((m) => ({
        moduleId: m.id,
        moduleNumber: m.number,
        title: m.title,
        lessonCount: m.lessons.length,
        completedCount: m.lessons.length,
        percentComplete: 100,
        isUnlocked: true,
      })),
    };
  }

  const zeroModules: ModuleProgress[] = modules.map((m, idx) => ({
    moduleId: m.id,
    moduleNumber: m.number,
    title: m.title,
    lessonCount: m.lessons.length,
    completedCount: 0,
    percentComplete: 0,
    isUnlocked: idx <= 2,
  }));

  const firstLesson = modules[0].lessons[0];

  return {
    completedLessonsCount: 0,
    totalLessonsCount,
    percentComplete: 0,
    nextLesson: {
      lessonId: firstLesson.id,
      moduleId: modules[0].id,
      moduleNumber: modules[0].number,
      moduleTitle: modules[0].title,
      lessonNumber: 1,
      title: firstLesson.title,
      durationMinutes: firstLesson.durationMinutes,
      lastPositionSeconds: 0,
      totalSeconds: firstLesson.durationMinutes * 60,
      percentComplete: 0,
      isCompleted: false,
    },
    modules: zeroModules,
  };
}

// ----------------------------------------------------
// ADMIN DASHBOARD & FOUNDER DATA ACCESS
// ----------------------------------------------------

/**
 * /admin - Overview stats
 * Returns aggregate metrics and the 10 most recent transactions.
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  await delay(150);

  const totalStudents = adminStudents.length * 78 + 4; // realistic scale demo (784)
  const paidTransactions = adminTransactions.filter((t) => t.status === 'paid');
  const totalRevenueKobo = paidTransactions.reduce((acc, t) => acc + t.amountKobo, 0) * 12 + 1845000000; // ~₦68,450,000

  // Avg completion across students
  const totalProgress = adminStudents.reduce((acc, s) => acc + s.progressPercent, 0);
  const avgCourseCompletionPercent = Math.round(totalProgress / (adminStudents.length || 1));

  // 10 most recent transactions
  const recentTransactions = [...adminTransactions].slice(0, 10);

  return {
    totalStudents: 784,
    totalRevenueKobo: 6845000000,
    enrollmentsThisWeek: 38,
    avgCourseCompletionPercent: avgCourseCompletionPercent || 64,
    recentTransactions,
  };
}

/**
 * /admin/students - Search and filter student records.
 */
export async function getAdminStudents(params?: {
  search?: string;
  product?: string;
  alumniFilter?: string;
}): Promise<AdminStudent[]> {
  await delay(150);

  let filtered = [...adminStudents];

  if (params?.search) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }

  if (params?.product && params.product !== 'all') {
    filtered = filtered.filter((s) => s.tier === params.product);
  }

  if (params?.alumniFilter && params.alumniFilter !== 'all') {
    const isAlumniQuery = params.alumniFilter === 'alumni';
    filtered = filtered.filter((s) => s.isAlumni === isAlumniQuery);
  }

  return filtered;
}

/**
 * /admin/students - Fetch student detailed lesson completion status.
 */
export async function getAdminStudentById(studentId: string): Promise<AdminStudent | null> {
  await delay(150);
  const student = adminStudents.find((s) => s.id === studentId);
  return student ? { ...student } : null;
}

/**
 * /admin/sales - Filter financial ledger and transactions.
 */
export async function getAdminTransactions(params?: {
  status?: string;
  dateRange?: string;
  search?: string;
}): Promise<{
  transactions: AdminTransaction[];
  totalFilteredKobo: number;
  totalTransactionsCount: number;
}> {
  await delay(150);

  let filtered = [...adminTransactions];

  if (params?.status && params.status !== 'all') {
    filtered = filtered.filter((t) => t.status === params.status);
  }

  if (params?.search) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.studentName.toLowerCase().includes(q) ||
        t.studentEmail.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        (t.discountCode && t.discountCode.toLowerCase().includes(q))
    );
  }

  if (params?.dateRange && params.dateRange !== 'all') {
    if (params.dateRange === 'today') {
      filtered = filtered.filter((t) => t.date.startsWith('2026-08-24'));
    } else if (params.dateRange === '7d') {
      filtered = filtered.filter((t) => t.date >= '2026-08-17');
    } else if (params.dateRange === '30d' || params.dateRange === 'this-month') {
      filtered = filtered.filter((t) => t.date.startsWith('2026-08'));
    }
  }

  // Calculate summed total for the current filter (only paid counts towards revenue)
  const totalFilteredKobo = filtered
    .filter((t) => t.status === 'paid')
    .reduce((acc, t) => acc + t.amountKobo, 0);

  return {
    transactions: filtered,
    totalFilteredKobo,
    totalTransactionsCount: filtered.length,
  };
}

/**
 * /admin/codes - Returns list of all existing discount, invite, and alumni codes.
 */
export async function getAdminCodes(): Promise<AdminDiscountCode[]> {
  await delay(150);
  return [...adminCodes];
}

/**
 * /admin/codes - Bulk generate discount / alumni / invite codes.
 */
export async function generateAdminCodes(
  params: GenerateCodesParams
): Promise<AdminDiscountCode[]> {
  await delay(200);

  const newCodes: AdminDiscountCode[] = [];
  const count = Math.min(Math.max(params.count || 1, 1), 500);

  for (let i = 1; i <= count; i++) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    let prefix = 'FLAG';
    if (params.kind === 'alumni') prefix = 'ALUMNI';
    if (params.kind === 'invite') prefix = 'INV';
    if (params.kind === 'promo') prefix = 'PROMO';

    const codeStr = count === 1 
      ? `${prefix}-${randomHex}`
      : `${prefix}-2026-${String(i).padStart(3, '0')}-${randomHex}`;

    let valueDesc = '100% Free Access';
    if (params.discountPercent) {
      valueDesc = `${params.discountPercent}% OFF (₦${((params.discountPercent / 100) * 100000).toLocaleString('en-NG')})`;
    } else if (params.discountKobo) {
      valueDesc = `₦${(params.discountKobo / 100).toLocaleString('en-NG')} OFF`;
    }

    const newCode: AdminDiscountCode = {
      id: `code-gen-${Date.now()}-${i}`,
      code: codeStr,
      kind: params.kind,
      valueDescription: valueDesc,
      discountPercent: params.discountPercent || (params.kind === 'invite' || params.kind === 'alumni' ? 100 : 50),
      discountKobo: params.discountKobo || 10000000,
      appliesTo: params.product || 'cohort',
      redemptionsUsed: 0,
      maxRedemptions: params.maxRedemptionsPerCode ?? (params.kind === 'alumni' ? 1 : 100),
      expiryDate: params.expiryDate || '2026-03-31',
      isActive: true,
      createdAt: '2026-08-24',
    };

    newCodes.push(newCode);
  }

  adminCodes = [...newCodes, ...adminCodes];
  return newCodes;
}

/**
 * /admin/codes - Toggle active status of a discount code.
 */
export async function toggleAdminCodeActive(
  codeId: string,
  isActive: boolean
): Promise<AdminDiscountCode> {
  await delay(150);
  const target = adminCodes.find((c) => c.id === codeId);
  if (!target) throw new Error('Code not found');
  target.isActive = isActive;
  return { ...target };
}

/**
 * /admin/codes - Destructive deletion of a code.
 */
export async function deleteAdminCode(codeId: string): Promise<{ success: boolean }> {
  await delay(150);
  adminCodes = adminCodes.filter((c) => c.id !== codeId);
  return { success: true };
}

/**
 * /admin/content - Fetch modular syllabus with video metadata and attached resources.
 */
export async function getAdminModules(): Promise<AdminModule[]> {
  await delay(150);
  return JSON.parse(JSON.stringify(adminModules));
}

/**
 * /admin/content - Update lesson metadata (title, description, Bunny Video ID, free, published).
 */
export async function updateAdminLesson(
  lessonId: string,
  payload: AdminLessonUpdatePayload
): Promise<AdminLesson> {
  await delay(200);

  for (const mod of adminModules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      lesson.title = payload.title;
      lesson.description = payload.description;
      lesson.bunnyVideoId = payload.bunnyVideoId;
      lesson.durationMinutes = payload.durationMinutes;
      lesson.isFree = payload.isFree;
      lesson.isPublished = payload.isPublished;
      return { ...lesson };
    }
  }

  throw new Error(`Lesson ${lessonId} not found`);
}

/**
 * /admin/content - Reorder lessons within a module.
 */
export async function reorderAdminLessons(
  moduleId: string,
  lessonIds: string[]
): Promise<AdminModule> {
  await delay(150);
  const mod = adminModules.find((m) => m.id === moduleId);
  if (!mod) throw new Error('Module not found');

  const lessonMap = new Map(mod.lessons.map((l) => [l.id, l]));
  const reordered: AdminLesson[] = [];
  for (const id of lessonIds) {
    const item = lessonMap.get(id);
    if (item) reordered.push(item);
  }
  mod.lessons = reordered;
  return { ...mod };
}

/**
 * /admin/content - Reorder modules in curriculum.
 */
export async function reorderAdminModules(moduleIds: string[]): Promise<AdminModule[]> {
  await delay(150);
  const modMap = new Map(adminModules.map((m) => [m.id, m]));
  const reordered: AdminModule[] = [];
  moduleIds.forEach((id, idx) => {
    const m = modMap.get(id);
    if (m) {
      m.number = idx;
      reordered.push(m);
    }
  });
  adminModules = reordered;
  return JSON.parse(JSON.stringify(adminModules));
}

/**
 * /admin/content - Delete an attached resource from a lesson.
 */
export async function deleteAdminLessonResource(
  lessonId: string,
  resourceId: string
): Promise<{ success: boolean }> {
  await delay(150);
  for (const mod of adminModules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      lesson.resources = lesson.resources.filter((r) => r.id !== resourceId);
      return { success: true };
    }
  }
  return { success: false };
}

/**
 * /admin/content - Upload placeholder for lesson assets.
 */
export async function uploadAdminLessonResource(
  lessonId: string,
  file: { name: string; sizeBytes: number; format: string }
): Promise<LessonResource> {
  await delay(250);

  const newResource: LessonResource = {
    id: `res-up-${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ''),
    kind: file.format.toLowerCase() === 'json' ? 'blueprint' : 'code',
    fileFormat: file.format.toUpperCase(),
    sizeBytes: file.sizeBytes,
    sizeFormatted: `${(file.sizeBytes / 1024 / 1024).toFixed(1)} MB`,
    downloadUrl: `#uploaded-${file.name}`,
    lessonId,
  };

  for (const mod of adminModules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      lesson.resources = [...lesson.resources, newResource];
      break;
    }
  }

  return newResource;
}
