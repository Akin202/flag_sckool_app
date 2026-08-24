import React, { useState, useEffect } from 'react';
import {
  FlagSkoolConfig,
  Page,
  CourseProgress,
  ProgressVariant,
  LoadState,
  UserProfile,
} from '@/types/index';
import { getCourseProgress, getUserProfile } from '@/lib/data-access';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StudentNav } from '@/components/StudentNav';
import {
  Play,
  ArrowRight,
  Lock,
  CheckCircle2,
  FolderLock,
  Send,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export interface DashboardPageProps {
  config: FlagSkoolConfig;
  progressVariant?: ProgressVariant;
  onNavigate?: (page: Page, lessonId?: string) => void;
  onOpenCheckout?: (tierId: 'recordings' | 'cohort') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  config,
  progressVariant = 'partial',
  onNavigate,
  onOpenCheckout,
}) => {
  const [loadState, setLoadState] = useState<LoadState<CourseProgress>>({
    status: 'loading',
  });
  const [user, setUser] = useState<UserProfile | undefined>();

  useEffect(() => {
    let isMounted = true;
    setLoadState({ status: 'loading' });

    Promise.all([
      getCourseProgress(progressVariant as ProgressVariant),
      getUserProfile('usr-4911'),
    ])
      .then(([progress, profile]) => {
        if (isMounted) {
          setUser(profile);
          setLoadState({ status: 'success', data: progress });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadState({
            status: 'error',
            error: err?.message || 'Failed to load progress data',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [progressVariant]);

  return (
    <div className="min-h-screen bg-[#030617] text-[#CBD5E1] flex flex-col justify-between">
      <div>
        {/* Student Navigation Bar */}
        <StudentNav
          config={config}
          currentPage="dashboard"
          user={user}
          onNavigate={(page) => onNavigate && onNavigate(page)}
        />

        {/* Main Dashboard Canvas */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
          {/* 1. PRIMARY CALL TO ACTION CARD */}
          {loadState.status === 'loading' ? (
            <Card className="p-6 sm:p-8 bg-[#0A0F29] border-[#1A2342] space-y-4">
              <Skeleton height={20} width={220} />
              <Skeleton height={32} width={340} />
              <Skeleton height={12} width="100%" />
              <Skeleton height={48} width={200} />
            </Card>
          ) : loadState.status === 'success' ? (
            loadState.data.nextLesson ? (
              /* ACTIVE CONTINUE CARD */
              <Card
                id="dashboard-hero-continue-card"
                className="p-6 sm:p-8 bg-gradient-to-b from-[#0A0F29] to-[#0D153B] border-2 border-[#1A2342] shadow-xl space-y-6 relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#8492A6]">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#CA3A32] animate-pulse" />
                    <span>Continue where you left off</span>
                  </div>

                  <div className="text-xs uppercase font-mono text-[#CA3A32] font-bold tracking-wider">
                    Module {loadState.data.nextLesson.moduleNumber} · Lesson {loadState.data.nextLesson.lessonNumber}
                  </div>

                  <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight leading-snug">
                    {loadState.data.nextLesson.title}
                  </h1>
                </div>

                {/* Lesson Resume Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-[#8492A6]">
                    <span>
                      {Math.floor(loadState.data.nextLesson.lastPositionSeconds / 60)}m of{' '}
                      {loadState.data.nextLesson.durationMinutes}m watched
                    </span>
                    <span className="text-[#F8FAFC]">
                      {loadState.data.nextLesson.percentComplete}%
                    </span>
                  </div>
                  <ProgressBar value={loadState.data.nextLesson.percentComplete} />
                </div>

                {/* Single Primary Action Button */}
                <div className="pt-2">
                  <Button
                    id="dashboard-continue-btn"
                    variant="primary"
                    size="lg"
                    fullWidth
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    onClick={() =>
                      onNavigate &&
                      onNavigate('learn', loadState.data.nextLesson?.lessonId)
                    }
                    className="sm:w-auto min-h-[48px] px-8 text-base font-semibold"
                  >
                    Continue →
                  </Button>
                </div>
              </Card>
            ) : (
              /* COURSE COMPLETED CARD */
              <Card
                id="dashboard-completed-card"
                className="p-6 sm:p-8 bg-gradient-to-b from-[#0A0F29] to-[#0D153B] border-2 border-[#1A2342] shadow-xl text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#059669]/20 text-[#10B981] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F8FAFC]">
                    Course Completed! 🎉
                  </h1>
                  <p className="text-sm text-[#8492A6] max-w-md mx-auto">
                    You have finished all lessons in the Flag Skool curriculum. Review any lesson below or grab blueprints from the Vault.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onNavigate && onNavigate('vault')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Go to Resource Vault
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => onNavigate && onNavigate('learn', 'les-0-1')}
                  >
                    Revisit Module 0
                  </Button>
                </div>
              </Card>
            )
          ) : (
            <Card className="p-6 bg-[#0A0F29] border-[#CA3A32]/40 text-center space-y-2">
              <p className="text-sm text-[#CA3A32]">
                {loadState.status === 'error' ? loadState.error : 'Error loading progress'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </Card>
          )}

          {/* 2. OVERALL PROGRESS & MODULES LIST (SECONDARY & QUIETER) */}
          <div className="space-y-4 pt-2">
            {loadState.status === 'loading' ? (
              <div className="space-y-3">
                <Skeleton height={16} width={200} />
                <Skeleton height={10} width="100%" />
                <div className="space-y-2 pt-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Skeleton key={n} height={64} width="100%" />
                  ))}
                </div>
              </div>
            ) : loadState.status === 'success' ? (
              <>
                {/* Secondary Progress Header */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-[#8492A6]">
                    <span>
                      {loadState.data.completedLessonsCount} of {loadState.data.totalLessonsCount} lessons complete
                    </span>
                    <span className="text-[#CBD5E1] font-semibold">
                      {loadState.data.percentComplete}%
                    </span>
                  </div>
                  <ProgressBar value={loadState.data.percentComplete} />
                </div>

                {/* Modules List */}
                <div className="divide-y divide-[#1A2342] rounded-xl border border-[#1A2342] bg-[#0A0F29]/60 overflow-hidden">
                  {loadState.data.modules.map((mod) => (
                    <div
                      key={mod.moduleId}
                      id={`dashboard-module-row-${mod.moduleNumber}`}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#1A2342]/20 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-[#CA3A32]">
                            Module {mod.moduleNumber}
                          </span>
                          {!mod.isUnlocked && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#8492A6] px-1.5 py-0.5 rounded bg-[#1A2342]">
                              <Lock className="w-3 h-3 text-[#8492A6]" />
                              Locked
                            </span>
                          )}
                          {mod.completedCount === mod.lessonCount && mod.lessonCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#10B981] px-1.5 py-0.5 rounded bg-[#059669]/20">
                              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                              Complete
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] truncate">
                          {mod.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-[#8492A6] font-mono">
                          <span>
                            {mod.completedCount} / {mod.lessonCount} lessons
                          </span>
                        </div>

                        {/* Module Mini Progress */}
                        {mod.isUnlocked && (
                          <div className="pt-1 max-w-xs">
                            <ProgressBar value={mod.percentComplete} />
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {mod.isUnlocked ? (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate &&
                              onNavigate(
                                'learn',
                                mod.moduleNumber === 3 ? 'les-3-2' : `les-${mod.moduleNumber}-1`
                              )
                            }
                            className="text-xs font-medium text-[#F8FAFC] bg-[#1A2342] hover:bg-[#2D3A63] px-3.5 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-[#CA3A32] flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenCheckout && onOpenCheckout('cohort')}
                            className="text-xs font-medium text-[#CA3A32] hover:text-[#F8FAFC] hover:bg-[#CA3A32] border border-[#CA3A32]/50 px-3 py-2 rounded-lg transition-all"
                          >
                            Upgrade
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* 3. THIN BOTTOM ROW: VAULT & COMMUNITY */}
          <div className="pt-2 pb-6 flex items-center justify-between border-t border-[#1A2342] text-xs text-[#8492A6]">
            <button
              id="dashboard-vault-link"
              type="button"
              onClick={() => onNavigate && onNavigate('vault')}
              className="flex items-center gap-2 text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors focus:ring-1 focus:ring-[#CA3A32] rounded p-1"
            >
              <FolderLock className="w-4 h-4 text-[#CA3A32]" />
              <span className="font-medium">Resource Vault</span>
            </button>

            <a
              id="dashboard-community-link"
              href={config.org.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors focus:ring-1 focus:ring-[#CA3A32] rounded p-1"
            >
              <Send className="w-4 h-4 text-[#0088CC]" />
              <span className="font-medium">Telegram Community</span>
              <ExternalLink className="w-3 h-3 text-[#8492A6]" />
            </a>
          </div>
        </main>
      </div>
    </div>
  );
};
