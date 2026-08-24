import {
  CourseProgress,
  Enrollment,
  FAQItem,
  Lesson,
  LessonComment,
  LessonProgress,
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
} from '@/types/index';
import {
  MOCK_MODULES,
  MOCK_TESTIMONIALS,
  MOCK_FAQS,
  MOCK_RESOURCES,
  MOCK_COMMENTS,
  MOCK_USER_PROFILE,
  MOCK_ENROLLMENTS,
} from '@/lib/mock-data';

// Helper to simulate realistic network latency
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock states for live mutations during the session
let currentProfile: UserProfile = { ...MOCK_USER_PROFILE };
let currentComments: LessonComment[] = [...MOCK_COMMENTS];
let completedLessonIds: Set<string> = new Set([
  'les-0-1',
  'les-0-2',
  'les-1-1',
  'les-1-2',
]);

// TODO(handoff): replace every function body with real queries.
// Signatures must not change — components depend on them.

/**
 * Returns overall and per-module course completion progress for the active student.
 */
export async function getCourseProgress(
  variant?: ProgressVariant,
  userId?: string
): Promise<CourseProgress> {
  await delay(200);

  const modules = MOCK_MODULES;
  const allLessons = modules.flatMap((m) => m.lessons);
  const totalLessonsCount = allLessons.length;

  if (variant === 'zero') {
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
    const nextLesson: LessonProgress = {
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
    };

    return {
      completedLessonsCount: 0,
      totalLessonsCount,
      percentComplete: 0,
      nextLesson,
      modules: zeroModules,
    };
  }

  if (variant === 'complete') {
    const completeModules: ModuleProgress[] = modules.map((m) => ({
      moduleId: m.id,
      moduleNumber: m.number,
      title: m.title,
      lessonCount: m.lessons.length,
      completedCount: m.lessons.length,
      percentComplete: 100,
      isUnlocked: true,
    }));

    return {
      completedLessonsCount: totalLessonsCount,
      totalLessonsCount,
      percentComplete: 100,
      nextLesson: null,
      modules: completeModules,
    };
  }

  // Default / partial: 4 of 13 completed, current is Module 3 · Lesson 2 (Calendar Agent Pt 2)
  const completedCount = completedLessonIds.size;
  const percentComplete = Math.round((completedCount / totalLessonsCount) * 100);

  const moduleProgressList: ModuleProgress[] = modules.map((mod) => {
    const modCompleted = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length;
    const modPercent = mod.lessons.length > 0 ? Math.round((modCompleted / mod.lessons.length) * 100) : 0;
    // Assume modules 0 through 4 unlocked, Module 5 unlocked if cohort tier
    const isUnlocked = mod.number <= 4 || currentProfile.tier === 'cohort';

    return {
      moduleId: mod.id,
      moduleNumber: mod.number,
      title: mod.title,
      lessonCount: mod.lessons.length,
      completedCount: modCompleted,
      percentComplete: modPercent,
      isUnlocked,
      upgradeTierId: !isUnlocked ? 'cohort' : undefined,
    };
  });

  // Next active lesson: Module 3 · Lesson 2 "Calendar Agent Pt 2"
  const mod3 = modules.find((m) => m.number === 3) || modules[3];
  const les32 = mod3?.lessons.find((l) => l.id === 'les-3-2') || mod3?.lessons[1] || allLessons[0];

  const nextLesson: LessonProgress = {
    lessonId: les32.id,
    moduleId: mod3.id,
    moduleNumber: mod3.number,
    moduleTitle: mod3.title,
    lessonNumber: 2,
    title: les32.title,
    durationMinutes: les32.durationMinutes,
    lastPositionSeconds: 45 * 60 + 12, // 45:12 into a 115m lesson
    totalSeconds: les32.durationMinutes * 60,
    percentComplete: Math.round(((45 * 60 + 12) / (les32.durationMinutes * 60)) * 100),
    isCompleted: completedLessonIds.has(les32.id),
  };

  return {
    completedLessonsCount: completedCount,
    totalLessonsCount,
    percentComplete,
    nextLesson,
    modules: moduleProgressList,
  };
}

/**
 * Returns full module hierarchy with all lesson items.
 */
export async function getModulesWithLessons(userId?: string): Promise<Module[]> {
  await delay(200);
  return MOCK_MODULES;
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
  await delay(200);

  const modules = MOCK_MODULES;
  let targetModule: Module | null = null;
  let targetLesson: Lesson | null = null;

  for (const mod of modules) {
    const found = mod.lessons.find((l) => l.id === lessonId);
    if (found) {
      targetModule = mod;
      targetLesson = found;
      break;
    }
  }

  if (!targetModule || !targetLesson) {
    // Default fallback to first lesson if not found
    targetModule = modules[3];
    targetLesson = modules[3].lessons[1] || modules[0].lessons[0];
  }

  // Find adjacent lessons in linear order
  const allLessons = modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === targetLesson!.id);
  const prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
  const nextLessonId =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;

  const isLocked =
    accessVariant === 'locked' ||
    (targetModule.number === 5 && currentProfile.tier !== 'cohort');

  return {
    lesson: targetLesson,
    module: targetModule,
    nextLessonId,
    prevLessonId,
    isCompleted: completedLessonIds.has(targetLesson.id),
    isLocked,
  };
}

/**
 * Returns all downloadable assets and blueprints attached to a specific lesson.
 */
export async function getLessonResources(
  lessonId: string,
  variant?: ResourcesVariant
): Promise<LessonResource[]> {
  await delay(200);

  if (variant === 'empty') {
    return [];
  }

  const matches = MOCK_RESOURCES.filter((r) => r.lessonId === lessonId);
  if (matches.length > 0) {
    return matches;
  }

  // If no direct matches, return general module resources for realistic demo
  return MOCK_RESOURCES.slice(0, 2);
}

/**
 * Returns the entire vault library accessible by the student.
 */
export async function getAllVaultResources(
  variant?: ResourcesVariant
): Promise<VaultResource[]> {
  await delay(200);

  if (variant === 'empty') {
    return [];
  }

  return MOCK_RESOURCES;
}

/**
 * Returns flat list of comments for a lesson, newest first, with pinned comments at top.
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

  // Sort pinned comments to the top, then newest
  return [...lessonComments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
}

/**
 * Posts a new comment to the lesson discussion thread.
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
    authorName: author?.fullName || currentProfile.fullName,
    authorEmail: author?.email || currentProfile.email,
    authorAvatar: author?.avatarUrl || currentProfile.avatarUrl,
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
  await delay(200);

  if (completed) {
    completedLessonIds.add(lessonId);
  } else {
    completedLessonIds.delete(lessonId);
  }

  return { success: true, isCompleted: completed };
}

/**
 * Returns the logged-in student's profile.
 */
export async function getUserProfile(userId?: string): Promise<UserProfile> {
  await delay(200);
  return { ...currentProfile };
}

/**
 * Updates user profile details (name, email, avatar).
 */
export async function updateUserProfile(
  data: Partial<UserProfile>
): Promise<UserProfile> {
  await delay(200);
  currentProfile = { ...currentProfile, ...data };
  return { ...currentProfile };
}

/**
 * Handles password change requests.
 */
export async function changePassword(
  currentPass: string,
  newPass: string
): Promise<{ success: boolean }> {
  await delay(200);
  return { success: true };
}

/**
 * Returns list of active purchase enrollments with transactions and tiers.
 */
export async function getEnrollments(userId?: string): Promise<Enrollment[]> {
  await delay(200);
  return MOCK_ENROLLMENTS;
}

/**
 * Landing page: Returns modules for public syllabus view.
 */
export async function getCurriculumModules(): Promise<Module[]> {
  await delay(200);
  return MOCK_MODULES;
}

/**
 * Landing page: Returns social proof testimonials.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  await delay(200);
  return MOCK_TESTIMONIALS;
}

/**
 * Landing page: Returns FAQ accordion items.
 */
export async function getFaqs(): Promise<FAQItem[]> {
  await delay(200);
  return MOCK_FAQS;
}
