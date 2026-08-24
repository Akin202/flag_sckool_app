import { CheckoutScreen } from '@/components/screens/CheckoutScreen';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string }>;
}) {
  const { sku } = await searchParams;
  const productSku = sku === 'recordings' ? 'recordings' : 'cohort';
  return <CheckoutScreen productSku={productSku} />;
}
