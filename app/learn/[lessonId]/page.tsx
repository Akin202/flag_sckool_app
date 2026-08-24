import { LearnScreen } from '@/components/screens/LearnScreen';

export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LearnScreen lessonId={lessonId} />;
}
