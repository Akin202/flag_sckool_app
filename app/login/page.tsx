import { LoginScreen } from '@/components/auth/screens/AuthScreens';

/**
 * `next` is attached by proxy.ts when it bounces a logged-out visitor off a
 * protected route; `error` by /auth/confirm when a link has expired.
 *
 * Both are read here rather than with useSearchParams() in the client
 * component: that hook forces a Suspense boundary at build time, and a
 * suspended auth form flashes an empty card on a slow Nigerian connection.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return <LoginScreen next={next} initialError={error} />;
}
