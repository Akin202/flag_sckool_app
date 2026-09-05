import type { Page } from '@/types/index';

/**
 * The visual layer was built against a `Page` union and an
 * `onNavigate(page, lessonId)` callback. App Router uses real paths.
 *
 * These two maps are the only translation layer between them, which is what
 * lets every presentational component keep its original props unchanged.
 */
const PAGE_TO_PATH: Record<Page, string> = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  forgot: '/forgot',
  reset: '/reset',
  'verify-email': '/verify-email',
  checkout: '/checkout',
  'payment-pending': '/payment-pending',
  redeem: '/redeem',
  dashboard: '/dashboard',
  learn: '/learn',
  vault: '/vault',
  account: '/account',
  admin: '/admin',
  'admin/students': '/admin/students',
  'admin/sales': '/admin/sales',
  'admin/codes': '/admin/codes',
  'admin/content': '/admin/content',
};

/** Resolve a Page (plus optional lesson) to the real route to push. */
export function pageToPath(page: Page, lessonId?: string): string {
  if (page === 'learn' && lessonId) return `/learn/${lessonId}`;
  return PAGE_TO_PATH[page] ?? '/';
}

/** Reverse lookup, for components that highlight the active nav item. */
export function pathToPage(pathname?: string | null): Page {
  if (!pathname || pathname === '/' || pathname === '') return 'landing';
  if (pathname.startsWith('/learn')) return 'learn';

  const normalized = pathname.replace(/\/+$/, '');
  const match = (Object.keys(PAGE_TO_PATH) as Page[]).find(
    (page) => PAGE_TO_PATH[page] === normalized,
  );
  return match ?? 'landing';
}
