import { PaymentPendingScreen } from '@/components/screens/PaymentPendingScreen';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  // Paystack returns the reference on the redirect. It grants nothing on its
  // own — /payment-pending polls enrollment status, the webhook is the source
  // of truth.
  const { reference } = await searchParams;
  return <PaymentPendingScreen reference={reference} />;
}
