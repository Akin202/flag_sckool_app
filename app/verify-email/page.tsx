import { VerifyEmailScreen } from '@/components/auth/screens/AuthScreens';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  // TODO(handoff): read the pending address from the Supabase session instead
  // of the query string once sign-up is wired.
  const { email } = await searchParams;
  return <VerifyEmailScreen email={email} />;
}
