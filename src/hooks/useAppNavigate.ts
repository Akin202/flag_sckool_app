'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { Page } from '@/types/index';
import { pageToPath } from '@/lib/navigation';

/**
 * Supplies the `onNavigate(page, lessonId)` callback every page component in
 * the visual layer already expects, backed by the App Router.
 */
export function useAppNavigate() {
  const router = useRouter();

  return useCallback(
    (page: Page, lessonId?: string) => {
      router.push(pageToPath(page, lessonId));
    },
    [router],
  );
}
