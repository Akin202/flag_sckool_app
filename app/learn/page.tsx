import { redirect } from 'next/navigation';
import { getCourseProgress } from '@/lib/data-access';

/**
 * /learn with no lesson resolves to wherever the student left off, so the
 * dashboard's single Continue CTA and any bare /learn link both land correctly.
 */
export default async function Page() {
  const progress = await getCourseProgress();
  const target = progress.nextLesson?.lessonId;

  redirect(target ? `/learn/${target}` : '/dashboard');
}
