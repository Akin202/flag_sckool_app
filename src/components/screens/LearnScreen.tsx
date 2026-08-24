'use client';

import { useRouter } from 'next/navigation';
import { config } from '@/config/flagskool.config';
import { LearnPage } from '@/views/LearnPage';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useDevState } from '@/components/dev/DevStateProvider';

export function LearnScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const navigate = useAppNavigate();
  const { devState } = useDevState();

  return (
    <LearnPage
      config={config}
      lessonId={lessonId}
      commentsVariant={devState.commentsVariant}
      resourcesVariant={devState.resourcesVariant}
      lessonAccessVariant={devState.lessonAccessVariant}
      dataSaverVariant={devState.dataSaverVariant}
      onNavigate={navigate}
      onOpenCheckout={(tierId) => router.push(`/checkout?sku=${tierId}`)}
    />
  );
}
