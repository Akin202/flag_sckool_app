import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCourseProgress } from '@/lib/db/progress';

/**
 * /learn with no lesson resolves to wherever the student left off, so the
 * dashboard's single Continue CTA and any bare /learn link both land correctly.
 *
 * This resolves on the server so the student lands on the right lesson in one
 * hop, with no client-side flash of the wrong screen. That is why it reaches
 * `lib/db` directly with a server client rather than going through
 * `data-access.ts`, which is browser-bound: the resume rule — first incomplete
 * lesson the student can actually open — is worth having in exactly one place.
 */
export default async function Page() {
  const supabase = await createClient();
  const progress = await fetchCourseProgress(supabase);
  const target = progress.nextLesson?.lessonId;

  redirect(target ? `/learn/${target}` : '/dashboard');
}
